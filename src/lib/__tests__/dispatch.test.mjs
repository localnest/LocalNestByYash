import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isProviderEligibleForJob,
  hasDurationAwareConflict,
  calculateTickWhatYouWantPricing,
  calculateMissingIngredientsSettlement,
  computeAnonymousPoolStats,
  anonymizeFeedbackComment,
  resolveMembershipStatus,
  chooseRotatingTiffinMenu,
} from '../dispatchUtils.ts';

import { atomicClaimJob } from '../dispatchClaim.ts';

// -----------------------------------------------------------------------------
// Test Fixtures
// -----------------------------------------------------------------------------
const mockSociety = {
  id: 'soc-1',
  communityId: 'comm-1',
  name: 'Greenfield Heights',
  addressLine: 'Sarjapur Main Road',
  city: 'Bengaluru',
  pincode: '560102',
  latitude: 12.915,
  longitude: 77.674,
  totalFlats: 1790,
  isActive: true,
};

const mockSocieties = [mockSociety];

const mockCategoryCommission = {
  id: 'cat-maid',
  name: 'House Maid',
  slug: 'house-maid',
  icon: 'Sparkles',
  description: 'Housekeeping',
  sortOrder: 1,
  monetization: 'COMMISSION',
  matching: 'DISPATCH',
  flatCommissionRate: 10,
  isActive: true,
};

const mockCategoryMembership = {
  id: 'cat-elec',
  name: 'Electrician & Handyman',
  slug: 'electrician',
  icon: 'Zap',
  description: 'Repairs',
  sortOrder: 2,
  monetization: 'MEMBERSHIP',
  matching: 'DISPATCH',
  membershipMonthlyFee: 799,
  isActive: true,
};

const mockServiceType = {
  id: 'st-maid',
  categoryId: 'cat-maid',
  name: 'Home Maid Help',
  slug: 'home-maid-help',
  description: 'Complete home chores',
  pricingModel: 'TICK_WHAT_YOU_WANT',
  basePrice: 150,
  estimatedDurationMinutes: 30,
  availableTasks: [
    { id: 'task-utensils', name: 'Wash Utensils', basePrice: 80, estimatedMinutes: 25 },
    { id: 'task-clothes', name: 'Wash Clothes', basePrice: 100, estimatedMinutes: 30 },
    { id: 'task-mop', name: 'Sweep & Mop Floor', basePrice: 120, estimatedMinutes: 35 },
    { id: 'task-bath', name: 'Clean Bathroom', basePrice: 90, estimatedMinutes: 20 },
  ],
  sizeBands: [
    { label: '1-2 people', multiplier: 1.0, price: 150, minutes: 40 },
    { label: '3-4 people', multiplier: 1.3, price: 250, minutes: 60 },
    { label: '5-6 people', multiplier: 1.6, price: 350, minutes: 90 },
  ],
  isActive: true,
};

const mockProvider = {
  id: 'prov-1',
  businessName: 'Shanti Maid Services',
  categoryId: 'cat-maid',
  description: 'Trusted housekeeping',
  phone: '9876543210',
  status: 'VERIFIED',
  rating: 4.9,
  reviewCount: 38,
  completedOrders: 140,
  onTimeRate: 99,
  supportedSocieties: ['soc-1'],
  startingPrice: 150,
  startingPriceUnit: 'visit',
  maxOrdersPerDay: 5,
  workingHours: {
    start: '07:00',
    end: '19:00',
    daysOff: ['Sun'],
  },
  isVacationMode: false,
  enabledServiceTypeIds: ['st-maid'],
  enabledTaskIds: ['task-utensils', 'task-clothes', 'task-mop', 'task-bath'],
  experienceYears: 6,
  membership: {
    id: 'mem-1',
    providerId: 'prov-1',
    categoryGroupId: 'trades',
    status: 'ACTIVE',
    monthlyFee: 799,
    trialStartDate: '2026-01-01',
    trialEndsAt: '2026-03-01',
    currentBillingPeriodStart: '2026-03-01',
    currentBillingPeriodEnd: '2026-04-01',
    autoRenew: true,
    invoices: [],
    updatedAt: '2026-03-01',
  },
};

const mockJobRequest = {
  id: 'job-101',
  jobNumber: 'JOB-2026-101',
  societyId: 'soc-1',
  societyName: 'Greenfield Heights',
  flatNumber: 'B-402',
  residentId: 'res-1',
  residentName: 'Aarav Mehta',
  residentPhoneMasked: '+91 98XXX-XX123',
  serviceTypeId: 'st-maid',
  serviceTypeName: 'Home Maid Help',
  categoryId: 'cat-maid',
  categoryName: 'House Maid',
  status: 'OPEN',
  selectedTaskIds: ['task-utensils', 'task-mop'],
  taskBreakdown: [],
  scheduledDate: '2026-10-12', // Monday
  scheduledSlot: '09:00 - 10:00',
  estimatedDurationMinutes: 60,
  lockedSubtotal: 350,
  platformFee: 20,
  totalResidentPrice: 370,
  platformCommission: 35,
  providerPayout: 315,
  residentPreferences: { diet: 'VEG', noOnionGarlic: true },
  doorOtp: '7482',
  notifiedProviderIds: ['prov-1'],
  expiresAt: new Date(Date.now() + 900000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// -----------------------------------------------------------------------------
// Unit Tests
// -----------------------------------------------------------------------------

test('Duration-Aware Conflict: detects overlapping slots on same day', () => {
  // Slot A: 09:00 to 10:00 (60 mins)
  // Slot B: 09:30 to 10:30 (60 mins) -> Should conflict
  assert.equal(hasDurationAwareConflict('09:00 - 10:00', 60, '09:30 - 10:30', 60), true);

  // Slot A: 09:00 to 10:00 (60 mins)
  // Slot C: 11:00 to 12:00 (60 mins) -> Should NOT conflict
  assert.equal(hasDurationAwareConflict('09:00 - 10:00', 60, '11:00 - 12:00', 60), false);
});

test('Matching: Providers must explicitly opt into a service and all requested skills', () => {
  const noOptIn = { ...mockProvider, enabledServiceTypeIds: [], enabledTaskIds: [] };
  const res = isProviderEligibleForJob(
    noOptIn,
    undefined,
    mockJobRequest,
    mockCategoryCommission,
    [],
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'SERVICE_TYPE_NOT_OFFERED');
});

test('Matching: Verified eligible provider passes all checks', () => {
  const result = isProviderEligibleForJob(
    mockProvider,
    mockProvider.membership,
    mockJobRequest,
    mockCategoryCommission,
    [],
    mockSocieties,
  );
  assert.equal(result.eligible, true);
});

test('Duration-Aware Conflict: understands AM/PM and treats invalid schedule values as conflicts', () => {
  assert.equal(hasDurationAwareConflict('09:00 AM', 180, '11:00 AM', 30), true);
  assert.equal(hasDurationAwareConflict('02:00 PM', 60, '04:00 PM', 60), false);
  assert.equal(hasDurationAwareConflict('invalid', 60, '04:00 PM', 60), true);
});

test('Matching: Ineligible if provider is suspended or pending', () => {
  const unverified = { ...mockProvider, status: 'PENDING' };
  const res = isProviderEligibleForJob(
    unverified,
    undefined,
    mockJobRequest,
    mockCategoryCommission,
    [],
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'PROVIDER_NOT_VERIFIED');
});

test('Feedback Anonymization: removes reviewer and business names', () => {
  const anonymized = anonymizeFeedbackComment('Aarav from Shanti Maid Services was excellent.', [
    'Aarav',
    'Shanti Maid Services',
  ]);
  assert.equal(anonymized.includes('Aarav'), false);
  assert.equal(anonymized.includes('Shanti Maid Services'), false);
});

test('Matching: Ineligible if provider is on vacation', () => {
  const onVacation = { ...mockProvider, isVacationMode: true };
  const res = isProviderEligibleForJob(
    onVacation,
    undefined,
    mockJobRequest,
    mockCategoryCommission,
    [],
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'ON_VACATION');
});

test('Matching: Ineligible if provider lacks requested task skill', () => {
  const missingSkill = { ...mockProvider, enabledTaskIds: ['task-utensils'] }; // lacks task-mop
  const res = isProviderEligibleForJob(
    missingSkill,
    undefined,
    mockJobRequest,
    mockCategoryCommission,
    [],
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'MISSING_REQUIRED_TASKS');
});

test('Matching: Ineligible if scheduled on provider day off', () => {
  // 2026-10-11 is Sunday
  const sundayJob = { ...mockJobRequest, scheduledDate: '2026-10-11' };
  const res = isProviderEligibleForJob(
    mockProvider,
    undefined,
    sundayJob,
    mockCategoryCommission,
    [],
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'PROVIDER_DAY_OFF');
});

test('Matching: Ineligible if provider hit daily order limit', () => {
  const commitments = [
    { providerId: 'prov-1', date: '2026-10-12', slot: '07:00 - 08:00', durationMinutes: 60 },
    { providerId: 'prov-1', date: '2026-10-12', slot: '10:30 - 11:30', durationMinutes: 60 },
    { providerId: 'prov-1', date: '2026-10-12', slot: '12:00 - 13:00', durationMinutes: 60 },
    { providerId: 'prov-1', date: '2026-10-12', slot: '14:00 - 15:00', durationMinutes: 60 },
    { providerId: 'prov-1', date: '2026-10-12', slot: '16:00 - 17:00', durationMinutes: 60 }, // 5 orders = maxOrdersPerDay
  ];
  const res = isProviderEligibleForJob(
    mockProvider,
    undefined,
    mockJobRequest,
    mockCategoryCommission,
    commitments,
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'DAILY_CAP_REACHED');
});

test('Matching: Ineligible if duration-aware schedule clashes with another order', () => {
  const commitments = [
    { providerId: 'prov-1', date: '2026-10-12', slot: '09:30 - 10:30', durationMinutes: 60 }, // overlaps with 09:00-10:00
  ];
  const res = isProviderEligibleForJob(
    mockProvider,
    undefined,
    mockJobRequest,
    mockCategoryCommission,
    commitments,
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'SCHEDULE_CLASH');
});

test('Matching: Membership category rejects LAPSED memberships', () => {
  const lapsedMembership = { ...mockProvider.membership, status: 'LAPSED' };
  const res = isProviderEligibleForJob(
    mockProvider,
    lapsedMembership,
    mockJobRequest,
    mockCategoryMembership,
    [],
    mockSocieties,
  );
  assert.equal(res.eligible, false);
  assert.equal(res.reason, 'MEMBERSHIP_LAPSED');
});

test('Matching: Membership category accepts TRIAL and GRACE memberships', () => {
  const trialMem = {
    ...mockProvider.membership,
    status: 'TRIAL',
    trialEndsAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const resTrial = isProviderEligibleForJob(
    mockProvider,
    trialMem,
    mockJobRequest,
    mockCategoryMembership,
    [],
    mockSocieties,
  );
  assert.equal(resTrial.eligible, true);

  const graceMem = {
    ...mockProvider.membership,
    status: 'GRACE',
    gracePeriodEndsAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const resGrace = isProviderEligibleForJob(
    mockProvider,
    graceMem,
    mockJobRequest,
    mockCategoryMembership,
    [],
    mockSocieties,
  );
  assert.equal(resGrace.eligible, true);
});

test('Membership: expired trials and grace periods are excluded; live grace period remains eligible', () => {
  const now = Date.now();
  const membership = {
    ...mockProvider.membership,
    status: 'TRIAL',
    trialEndsAt: new Date(now - 1).toISOString(),
  };
  assert.equal(resolveMembershipStatus(membership, now), 'LAPSED');
  assert.equal(
    resolveMembershipStatus(
      {
        ...membership,
        gracePeriodEndsAt: new Date(now + 1000).toISOString(),
      },
      now,
    ),
    'GRACE',
  );
  assert.equal(
    resolveMembershipStatus(
      {
        ...membership,
        status: 'GRACE',
        gracePeriodEndsAt: new Date(now - 1).toISOString(),
      },
      now,
    ),
    'LAPSED',
  );
});

test('Cook missing-ingredients settlement credits resident and reduces provider payout', () => {
  assert.deepEqual(calculateMissingIngredientsSettlement(520, 400), {
    residentCredit: 260,
    adjustedProviderPayout: 200,
  });
});

test('Tiffin subscriptions rotate to another available kitchen when possible', () => {
  const cutoffAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const menus = [
    {
      id: 'menu-a',
      providerId: 'kitchen-a',
      societyIds: ['soc-1'],
      deliveryDate: '2026-10-12',
      cutoffAt,
      availableQuantity: 3,
      isActive: true,
    },
    {
      id: 'menu-b',
      providerId: 'kitchen-b',
      societyIds: ['soc-1'],
      deliveryDate: '2026-10-12',
      cutoffAt,
      availableQuantity: 2,
      isActive: true,
    },
  ];
  assert.equal(chooseRotatingTiffinMenu(menus, 'soc-1', '2026-10-12', 'kitchen-a')?.id, 'menu-b');
  assert.equal(
    chooseRotatingTiffinMenu(menus, 'soc-1', '2026-10-12', 'kitchen-a', Date.now(), 3)?.id,
    'menu-a',
  );
  assert.equal(chooseRotatingTiffinMenu(menus, 'soc-2', '2026-10-12'), undefined);
});

test('Pricing: "Tick What You Want" correctly aggregates tasks and size bands', () => {
  // Maid tasks: Utensils (80) + Sweep/Mop (120) with size band "3-4 people" (base 250)
  const calc = calculateTickWhatYouWantPricing(
    mockServiceType,
    ['task-utensils', 'task-mop'],
    '3-4 people',
  );
  // 250 (band) + 80 + 120 = 450
  assert.equal(calc.subtotal, 450);
  // 60 mins (band) + 25 + 35 = 120 mins
  assert.equal(calc.durationMinutes, 120);
  assert.equal(calc.taskBreakdown.length, 2);
});

test('Atomic Claim: First writer wins; second gets ALREADY_CLAIMED', () => {
  let storeJobs = [{ ...mockJobRequest }];
  let storeOrders = [];

  const onCommit = (updatedJobs, newOrder) => {
    storeJobs = updatedJobs;
    storeOrders.push(newOrder);
  };

  // Provider 1 claims
  const claim1 = atomicClaimJob(
    mockJobRequest.id,
    'prov-1',
    mockProvider,
    storeJobs,
    storeOrders,
    onCommit,
  );
  assert.equal(claim1.success, true);
  assert.equal(claim1.status, 'CLAIMED');
  assert.equal(storeOrders.length, 1);
  assert.equal(storeOrders[0].providerId, 'prov-1');
  assert.equal(storeJobs[0].status, 'CLAIMED');

  // Provider 2 tries to claim same job
  const prov2 = { ...mockProvider, id: 'prov-2', businessName: 'Another Service' };
  const claim2 = atomicClaimJob(
    mockJobRequest.id,
    'prov-2',
    prov2,
    storeJobs,
    storeOrders,
    onCommit,
  );
  assert.equal(claim2.success, false);
  assert.equal(claim2.status, 'ALREADY_CLAIMED');
});

test('Atomic Claim: Rejects expired job requests', () => {
  const expiredJob = {
    ...mockJobRequest,
    expiresAt: new Date(Date.now() - 10000).toISOString(), // expired 10s ago
  };

  const res = atomicClaimJob(expiredJob.id, 'prov-1', mockProvider, [expiredJob], [], () => {});
  assert.equal(res.success, false);
  assert.equal(res.status, 'EXPIRED');
});

test('Anonymous Pool Stats: Computes pool metrics and hides breakdown if pool < 3', () => {
  const stats = computeAnonymousPoolStats(
    [mockProvider], // only 1 provider
    [mockProvider.membership],
    'st-maid',
    mockCategoryCommission,
    mockSociety,
    [],
    '2026-10-12',
    '09:00 - 10:00',
    mockSocieties,
  );

  assert.equal(stats.totalPoolCount, 1);
  assert.equal(stats.availableSlotCount, 1);
  assert.equal(stats.hideBreakdown, true); // true because < 3 providers
});

test('Feedback Anonymization: Redacts phone numbers and off-platform attempts', () => {
  const text =
    'Great job done! Contact him directly at 9876543210 or email test@gmail.com for paytm';
  const anonymized = anonymizeFeedbackComment(text);
  assert.ok(!anonymized.includes('9876543210'));
  assert.ok(!anonymized.includes('test@gmail.com'));
});
