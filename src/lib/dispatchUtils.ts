import type {
  Provider,
  Category,
  JobRequest,
  ProviderMembership,
  Society,
  ServiceType,
  ServiceTaskDefinition,
  TiffinMenu,
} from './types.ts';
import { isSocietyCovered } from './geo.ts';
import { filterContactDetails } from './retentionUtils.ts';

export interface ScheduleCommitment {
  providerId: string;
  date: string; // 'YYYY-MM-DD'
  slot: string; // e.g. "09:00 - 10:00" or "09:00"
  durationMinutes: number;
}

/**
 * Converts a slot string like "09:00 - 10:00" or "14:30" to minutes from midnight.
 */
export function parseSlotStartMinutes(slot: string): number {
  const startTimeStr = slot.split(/\s*[-–—]\s*/)[0].trim();
  const match = startTimeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return Number.NaN;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (minutes > 59 || hours > 23 || (period && (hours < 1 || hours > 12))) return Number.NaN;
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Pure function: Checks if two duration-aware time windows on the same date overlap.
 */
export function hasDurationAwareConflict(
  slotA: string,
  durationA: number,
  slotB: string,
  durationB: number,
): boolean {
  const startA = parseSlotStartMinutes(slotA);
  const startB = parseSlotStartMinutes(slotB);
  if (!Number.isFinite(startA) || !Number.isFinite(startB)) return true;
  const endA = startA + Math.max(15, durationA);
  const endB = startB + Math.max(15, durationB);

  // Overlap occurs if startA < endB and startB < endA
  return startA < endB && startB < endA;
}

/**
 * Pure matching function: Decides if a provider can receive and claim a dispatch job.
 */
export function isProviderEligibleForJob(
  provider: Provider,
  membership: ProviderMembership | undefined,
  job: JobRequest,
  category: Category,
  allCommitments: ScheduleCommitment[],
  societies: Society[],
): { eligible: boolean; reason?: string } {
  // 1. Account Status
  if (provider.status !== 'VERIFIED') {
    return { eligible: false, reason: 'PROVIDER_NOT_VERIFIED' };
  }
  if (provider.isVacationMode) {
    return { eligible: false, reason: 'ON_VACATION' };
  }

  // 2. Society Geo Coverage
  const society = societies.find((s) => s.id === job.societyId);
  if (!society || !isSocietyCovered(provider, society, societies)) {
    return { eligible: false, reason: 'SOCIETY_OUT_OF_RANGE' };
  }

  // 3. Service Type & Task Competency
  if (!provider.enabledServiceTypeIds?.includes(job.serviceTypeId)) {
    return { eligible: false, reason: 'SERVICE_TYPE_NOT_OFFERED' };
  }

  if (job.selectedTaskIds && job.selectedTaskIds.length > 0) {
    const hasAllTasks = job.selectedTaskIds.every((tId) => provider.enabledTaskIds?.includes(tId));
    if (!hasAllTasks) {
      return { eligible: false, reason: 'MISSING_REQUIRED_TASKS' };
    }
  }

  // 4. Stylist Gender Preference Check (if applicable)
  if (job.stylistGenderPreference && job.stylistGenderPreference !== 'ANY') {
    if (provider.gender && provider.gender !== job.stylistGenderPreference) {
      return { eligible: false, reason: 'STYLIST_GENDER_MISMATCH' };
    }
  }

  // 5. Working Hours & Days Off
  const jobDate = new Date(`${job.scheduledDate}T12:00:00`);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[jobDate.getDay()];
  const daysOff = (provider.workingHours?.daysOff || []).map((day) =>
    day.slice(0, 3).toLowerCase(),
  );
  if (daysOff.includes(dayName.slice(0, 3).toLowerCase())) {
    return { eligible: false, reason: 'PROVIDER_DAY_OFF' };
  }

  if (provider.workingHours?.start && provider.workingHours?.end) {
    const jobStartMin = parseSlotStartMinutes(job.scheduledSlot);
    const jobEndMin = jobStartMin + job.estimatedDurationMinutes;
    const workStartMin = parseSlotStartMinutes(provider.workingHours.start);
    const workEndMin = parseSlotStartMinutes(provider.workingHours.end);

    if (
      !Number.isFinite(jobStartMin) ||
      !Number.isFinite(workStartMin) ||
      !Number.isFinite(workEndMin) ||
      jobStartMin < workStartMin ||
      jobEndMin > workEndMin
    ) {
      return { eligible: false, reason: 'OUTSIDE_WORKING_HOURS' };
    }
  }

  // 6. Daily Order Cap
  const maxCap = provider.maxOrdersPerDay ?? 8;
  const sameDayCommitments = allCommitments.filter(
    (c) => c.providerId === provider.id && c.date === job.scheduledDate,
  );

  if (sameDayCommitments.length >= maxCap) {
    return { eligible: false, reason: 'DAILY_CAP_REACHED' };
  }

  // 7. Duration-Aware Clashing with Existing Commitments
  const hasClash = sameDayCommitments.some((comm) =>
    hasDurationAwareConflict(
      job.scheduledSlot,
      job.estimatedDurationMinutes,
      comm.slot,
      comm.durationMinutes,
    ),
  );

  if (hasClash) {
    return { eligible: false, reason: 'SCHEDULE_CLASH' };
  }

  // 8. Membership Gate (for Membership Categories)
  if (category.monetization === 'MEMBERSHIP') {
    const provMembership = membership || provider.membership;
    if (!provMembership) {
      return { eligible: false, reason: 'NO_MEMBERSHIP' };
    }
    const effectiveStatus = resolveMembershipStatus(provMembership);
    if (!['ACTIVE', 'TRIAL', 'GRACE'].includes(effectiveStatus)) {
      return { eligible: false, reason: 'MEMBERSHIP_LAPSED' };
    }
    // TRIAL, ACTIVE, GRACE are eligible
  }

  return { eligible: true };
}

export function resolveMembershipStatus(
  membership: ProviderMembership,
  now = Date.now(),
): ProviderMembership['status'] {
  if (membership.status === 'TRIAL') {
    const trialEnd = new Date(membership.trialEndsAt).getTime();
    if (!Number.isFinite(trialEnd)) return 'LAPSED';
    if (trialEnd <= now) {
      const graceEnd = membership.gracePeriodEndsAt
        ? new Date(membership.gracePeriodEndsAt).getTime()
        : Number.NaN;
      return Number.isFinite(graceEnd) && graceEnd > now ? 'GRACE' : 'LAPSED';
    }
  }
  if (membership.status === 'GRACE') {
    const graceEnd = membership.gracePeriodEndsAt
      ? new Date(membership.gracePeriodEndsAt).getTime()
      : Number.NaN;
    if (!Number.isFinite(graceEnd) || graceEnd <= now) return 'LAPSED';
  }
  return membership.status;
}

/**
 * Pure function: Calculates subtotal and estimated duration for "Tick What You Want" bookings.
 */
export function calculateTickWhatYouWantPricing(
  serviceType: ServiceType,
  selectedTaskIds: string[],
  sizeBandInput?: string,
  dishNotes?: string,
): {
  subtotal: number;
  durationMinutes: number;
  taskBreakdown: { id: string; name: string; price: number; minutes: number }[];
} {
  const breakdown: { id: string; name: string; price: number; minutes: number }[] = [];
  let taskSubtotal = 0;
  let taskMinutes = 0;

  // 1. Task Checklist Add-ons
  if (serviceType.availableTasks && serviceType.availableTasks.length > 0) {
    for (const tId of selectedTaskIds) {
      const task = serviceType.availableTasks.find((t) => t.id === tId);
      if (task) {
        taskSubtotal += task.basePrice;
        taskMinutes += task.estimatedMinutes;
        breakdown.push({
          id: task.id,
          name: task.name,
          price: task.basePrice,
          minutes: task.estimatedMinutes,
        });
      }
    }
  }

  // 2. Household Size Band (Cook Basic / Maid multiplier)
  if (serviceType.sizeBands && serviceType.sizeBands.length > 0 && sizeBandInput) {
    const matchedBand = serviceType.sizeBands.find(
      (b) => b.label.toLowerCase() === sizeBandInput.toLowerCase(),
    );
    if (matchedBand) {
      const subtotal = matchedBand.price + taskSubtotal;
      const durationMinutes = matchedBand.minutes + taskMinutes;
      return { subtotal, durationMinutes: Math.max(durationMinutes, 15), taskBreakdown: breakdown };
    }
  }

  const subtotal = (serviceType.basePrice || 0) + taskSubtotal;
  const durationMinutes = taskMinutes || serviceType.estimatedDurationMinutes || 45;
  return {
    subtotal,
    durationMinutes: Math.max(durationMinutes, 15),
    taskBreakdown: breakdown,
  };
}

export function calculateMissingIngredientsSettlement(
  totalResidentPrice: number,
  providerPayout: number,
): {
  residentCredit: number;
  adjustedProviderPayout: number;
} {
  const residentCredit = Math.round(Math.max(0, totalResidentPrice) * 0.5);
  const adjustedProviderPayout = Math.round(Math.max(0, providerPayout) * 0.5);
  return { residentCredit, adjustedProviderPayout };
}

export function chooseRotatingTiffinMenu(
  menus: TiffinMenu[],
  societyId: string,
  deliveryDate: string,
  lastProviderId?: string,
  now = Date.now(),
  quantity = 1,
): TiffinMenu | undefined {
  const candidates = menus.filter(
    (menu) =>
      menu.isActive &&
      menu.deliveryDate === deliveryDate &&
      menu.societyIds.includes(societyId) &&
      menu.availableQuantity >= quantity &&
      Number.isFinite(new Date(menu.cutoffAt).getTime()) &&
      new Date(menu.cutoffAt).getTime() > now,
  );
  return candidates.find((menu) => menu.providerId !== lastProviderId) || candidates[0];
}

/**
 * Pure function: Computes anonymized provider pool statistics for resident service page.
 */
export function computeAnonymousPoolStats(
  providers: Provider[],
  memberships: ProviderMembership[],
  serviceTypeId: string,
  category: Category,
  society: Society,
  allCommitments: ScheduleCommitment[],
  targetDate: string,
  targetSlot: string,
  societies: Society[],
  requiredTaskIds: string[] = [],
  durationMinutes = 60,
  serviceType?: ServiceType,
  feedback: { comment: string; rating: number; createdAt: string; customerName?: string }[] = [],
): {
  totalPoolCount: number;
  availableSlotCount: number;
  averageRating: number;
  ratingDistribution: { stars: number; count: number; pct: number }[];
  averageExperienceYears: number;
  onTimeRatePct: number;
  typicalAcceptanceMinutes: number;
  skillsCovered: string[];
  verificationStats: { idChecked: number; backgroundChecked: number; coverageVerified: number };
  anonymousReviews: { comment: string; rating: number; createdAt: string }[];
  hideBreakdown: boolean;
} {
  // Filter providers covering the society and offering the service
  const coveringProviders = providers.filter((p) => {
    if (p.status !== 'VERIFIED' || p.isVacationMode) return false;
    if (!isSocietyCovered(p, society, societies)) return false;
    if (!p.enabledServiceTypeIds?.includes(serviceTypeId)) return false;
    if (category.monetization === 'MEMBERSHIP') {
      const m = memberships.find((mem) => mem.providerId === p.id) || p.membership;
      if (!m || !['ACTIVE', 'TRIAL', 'GRACE'].includes(resolveMembershipStatus(m))) return false;
    }
    return true;
  });

  const totalPoolCount = coveringProviders.length;

  // Determine how many are free for target slot
  const dummyJob: JobRequest = {
    id: 'probe',
    jobNumber: 'PROBE',
    societyId: society.id,
    societyName: society.name,
    flatNumber: 'A-000',
    residentId: 'probe-res',
    residentName: 'Resident',
    residentPhoneMasked: '+91 99XXX-XX000',
    serviceTypeId,
    serviceTypeName: '',
    categoryId: category.id,
    categoryName: category.name,
    status: 'OPEN',
    selectedTaskIds: requiredTaskIds,
    taskBreakdown: [],
    scheduledDate: targetDate,
    scheduledSlot: targetSlot,
    estimatedDurationMinutes: durationMinutes,
    lockedSubtotal: 200,
    platformFee: 20,
    totalResidentPrice: 220,
    platformCommission: 20,
    providerPayout: 200,
    residentPreferences: {},
    doorOtp: '1234',
    notifiedProviderIds: [],
    expiresAt: new Date(Date.now() + 900000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const availableSlotCount = coveringProviders.filter((p) => {
    const m = memberships.find((mem) => mem.providerId === p.id) || p.membership;
    const res = isProviderEligibleForJob(p, m, dummyJob, category, allCommitments, societies);
    return res.eligible;
  }).length;

  if (totalPoolCount === 0) {
    return {
      totalPoolCount: 0,
      availableSlotCount: 0,
      averageRating: 0,
      ratingDistribution: [],
      averageExperienceYears: 0,
      onTimeRatePct: 0,
      typicalAcceptanceMinutes: 0,
      skillsCovered: [],
      verificationStats: { idChecked: 0, backgroundChecked: 0, coverageVerified: 0 },
      anonymousReviews: [],
      hideBreakdown: true,
    };
  }

  const avgRating = coveringProviders.reduce((sum, p) => sum + (p.rating || 0), 0) / totalPoolCount;
  const avgExp =
    coveringProviders.reduce((sum, p) => sum + (p.experienceYears || 0), 0) / totalPoolCount;
  const avgOnTime =
    coveringProviders.reduce((sum, p) => sum + (p.onTimeRate || 0), 0) / totalPoolCount;

  // Rating distribution
  const ratings = [5, 4, 3, 2, 1].map((stars) => {
    const count = coveringProviders.filter((p) => Math.round(p.rating || 0) === stars).length;
    return {
      stars,
      count,
      pct: Math.round((count / totalPoolCount) * 100),
    };
  });

  return {
    totalPoolCount,
    availableSlotCount,
    averageRating: Math.round(avgRating * 10) / 10,
    ratingDistribution: ratings,
    averageExperienceYears: Math.round(avgExp * 10) / 10,
    onTimeRatePct: Math.round(avgOnTime),
    typicalAcceptanceMinutes: Math.round(
      coveringProviders.reduce(
        (sum, provider) => sum + (provider.averageAcceptanceMinutes ?? 5),
        0,
      ) / totalPoolCount,
    ),
    skillsCovered: serviceType
      ? [
          ...new Set(
            coveringProviders
              .flatMap((provider) => provider.enabledTaskIds || [])
              .map((id) => serviceType.availableTasks.find((task) => task.id === id)?.name)
              .filter((name): name is string => Boolean(name)),
          ),
        ]
      : [],
    verificationStats: {
      idChecked: coveringProviders.filter((provider) =>
        provider.documents?.some(
          (document) => /id|aadhaar/i.test(document.type) && document.verified,
        ),
      ).length,
      backgroundChecked: coveringProviders.filter((provider) =>
        provider.documents?.some(
          (document) => /background|police/i.test(document.type) && document.verified,
        ),
      ).length,
      coverageVerified: totalPoolCount,
    },
    anonymousReviews: feedback.slice(0, 5).map((review) => ({
      comment: anonymizeFeedbackComment(review.comment, [
        review.customerName || '',
        ...coveringProviders.map((provider) => provider.businessName),
      ]),
      rating: review.rating,
      createdAt: review.createdAt,
    })),
    hideBreakdown: totalPoolCount < 3, // Hide breakdown when pool < 3
  };
}

/**
 * Anonymizes feedback comments to prevent external off-platform contact leaks.
 */
export function anonymizeFeedbackComment(rawComment: string, names: string[] = []): string {
  if (!rawComment) return '';
  let sanitized = rawComment;

  if (filterContactDetails(rawComment).blocked) {
    sanitized = sanitized
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[email redacted]')
      .replace(/(?:https?:\/\/|www\.)\S+/gi, '[link redacted]')
      .replace(/\b(?:[a-z0-9-]+\.)+(?:com|in|net|org|co|io|app)\b(?:\/\S*)?/gi, '[link redacted]')
      .replace(/\b\d[\d\s\-().]{5,}\d\b/g, '[contact redacted]')
      .replace(
        /\b(call me|whatsapp|pay directly|pay outside|offline payment|direct payment)\b/gi,
        '[redacted]',
      );
  }
  for (const name of names.filter((value) => value.trim().length >= 3)) {
    sanitized = sanitized.replace(
      new RegExp(`\\b${escapeRegExp(name.trim())}\\b`, 'gi'),
      '[name redacted]',
    );
  }

  return sanitized.trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
