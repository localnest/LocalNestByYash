import type { JobRequest, Order, Provider } from './types.ts';

export interface ClaimResult {
  success: boolean;
  status: 'CLAIMED' | 'ALREADY_CLAIMED' | 'EXPIRED' | 'NOT_FOUND' | 'ERROR';
  message: string;
  claimedJob?: JobRequest;
  createdOrder?: Order;
}

/**
 * Atomic Claim Handler (First-writer-wins).
 *
 * Implements the single entry point for claiming an open dispatch job.
 * In localStorage, simulates conditional lock (WHERE status = 'OPEN' AND expires_at > NOW()).
 * Returns error if another provider already claimed it or if the timer expired.
 */
export function atomicClaimJob(
  jobId: string,
  providerId: string,
  provider: Provider,
  currentJobs: JobRequest[],
  existingOrders: Order[],
  onCommit: (updatedJobs: JobRequest[], newOrder: Order) => void,
): ClaimResult {
  const now = Date.now();
  const jobIndex = currentJobs.findIndex((j) => j.id === jobId);

  if (jobIndex === -1) {
    return {
      success: false,
      status: 'NOT_FOUND',
      message: 'Job request not found.',
    };
  }

  let job = currentJobs[jobIndex];

  if (typeof localStorage !== 'undefined') {
    try {
      const persisted = localStorage.getItem('hg_job_requests');
      if (persisted) {
        const persistedJobs: JobRequest[] = JSON.parse(persisted);
        const persistedJob = persistedJobs.find((item) => item.id === jobId);
        if (persistedJob?.status === 'CLAIMED') {
          return {
            success: false,
            status: 'ALREADY_CLAIMED',
            message: 'Another provider accepted this job.',
          };
        }
        if (persistedJob) job = persistedJob;
      }
    } catch (error) {
      return {
        success: false,
        status: 'ERROR',
        message: `Unable to confirm the current claim state: ${error instanceof Error ? error.message : 'storage error'}`,
      };
    }
  }

  // 1. Check if already claimed by someone else
  if (job.status === 'CLAIMED') {
    return {
      success: false,
      status: 'ALREADY_CLAIMED',
      message: 'Another verified provider just accepted this job a moment ago.',
    };
  }

  // 2. Check if expired
  const expiresAtMs = new Date(job.expiresAt).getTime();
  if (job.status === 'EXPIRED' || !Number.isFinite(expiresAtMs) || now >= expiresAtMs) {
    return {
      success: false,
      status: 'EXPIRED',
      message: 'This job broadcast window has expired.',
    };
  }

  // 3. Conditional Update Lock (Simulating update ... where status = 'OPEN')
  if (job.status !== 'OPEN') {
    return {
      success: false,
      status: 'ALREADY_CLAIMED',
      message: 'This job is no longer available for booking.',
    };
  }

  const claimedAtStr = new Date().toISOString();
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const preferences = job.residentPreferences || {};

  // Create canonical order
  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerId: job.residentId,
    customerName: 'Resident',
    customerPhone: 'Contact through LocalNest',
    customerFlat: job.flatNumber,
    providerId: provider.id,
    providerName: provider.businessName,
    serviceId: job.serviceTypeId,
    serviceName: job.serviceTypeName,
    categoryName: job.categoryName,
    societyId: job.societyId,
    societyName: job.societyName,
    status: 'ACCEPTED', // Claimed jobs start as ACCEPTED
    scheduledDate: job.scheduledDate,
    scheduledSlot: job.scheduledSlot,
    deliveryAddress: `${job.flatNumber}, ${job.societyName}`,
    specialInstructions:
      [
        job.dishNotes,
        preferences.diet && `Diet: ${preferences.diet}`,
        preferences.allergies?.length && `Allergies: ${preferences.allergies.join(', ')}`,
        preferences.noOnionGarlic && 'No onion or garlic',
        preferences.houseNotes,
        preferences.pets && preferences.pets !== 'NONE' && `Pets: ${preferences.pets}`,
      ]
        .filter(Boolean)
        .join('\n') || undefined,
    pricingModel: job.pricingModel || 'FIXED',
    itemQuantity: job.selectedTaskIds?.length || 1,
    subtotal: job.lockedSubtotal,
    platformFee: job.platformFee,
    totalAmount: job.totalResidentPrice,
    commissionPercentage:
      job.lockedSubtotal > 0 ? Math.round((job.platformCommission / job.lockedSubtotal) * 100) : 0,
    platformCommission: job.platformCommission,
    providerEarnings: job.providerPayout,
    paymentStatus: 'PAID', // Escrow paid by resident at broadcast time
    discountAmount: 0,
    discountSource: 'PLATFORM',
    jobRequestId: job.id,
    isDoorOtpVerified: false,
    createdAt: claimedAtStr,
    updatedAt: claimedAtStr,
  };

  const updatedJob: JobRequest = {
    ...job,
    status: 'CLAIMED',
    claimedByProviderId: provider.id,
    claimedAt: claimedAtStr,
    orderId,
    updatedAt: claimedAtStr,
  };

  const nextJobs = [...currentJobs];
  nextJobs[jobIndex] = updatedJob;

  if (typeof localStorage !== 'undefined') {
    try {
      const persisted = localStorage.getItem('hg_job_requests');
      const persistedJobs: JobRequest[] = persisted ? JSON.parse(persisted) : currentJobs;
      const persistedIndex = persistedJobs.findIndex((item) => item.id === jobId);
      if (persistedIndex >= 0 && persistedJobs[persistedIndex].status !== 'OPEN') {
        return {
          success: false,
          status: 'ALREADY_CLAIMED',
          message: 'Another provider accepted this job.',
        };
      }
      const committedJobs = [...persistedJobs];
      if (persistedIndex >= 0) committedJobs[persistedIndex] = updatedJob;
      else committedJobs.push(updatedJob);
      localStorage.setItem('hg_job_requests', JSON.stringify(committedJobs));
    } catch (error) {
      return {
        success: false,
        status: 'ERROR',
        message: `Unable to save this claim: ${error instanceof Error ? error.message : 'storage error'}`,
      };
    }
  }

  onCommit(nextJobs, newOrder);

  return {
    success: true,
    status: 'CLAIMED',
    message: `Job claimed successfully! Payout of ₹${job.providerPayout} secured in escrow.`,
    claimedJob: updatedJob,
    createdOrder: newOrder,
  };
}
