export interface CancellationFeeBreakdown {
  isFree: boolean;
  penaltyFee: number;
  refundAmount: number;
  providerCompensation: number;
  platformRetention: number;
  reasonCode: string;
  explanation: string;
}

export interface ProviderPenaltyResult {
  penaltyDues: number;
  residentCompensationCredit: number;
  reassignToBackupPool: boolean;
  suspensionTriggered: boolean;
  reasonCode: string;
  explanation: string;
}

/**
 * Calculates customer cancellation fees according to rule N04.1:
 * - > 4 hours prior: 100% Free refund.
 * - 1 to 4 hours prior: Rs 50 or 10% of subtotal (whichever is higher).
 * - < 1 hour prior or provider already dispatched: 50% penalty (base fee retained for provider).
 */
export function calculateCustomerCancellation(
  orderSubtotal: number,
  scheduledTimeIso: string,
  cancelledTimeIso = new Date().toISOString(),
  providerDispatched = false,
): CancellationFeeBreakdown {
  const scheduledMs = new Date(scheduledTimeIso).getTime();
  const cancelledMs = new Date(cancelledTimeIso).getTime();
  const diffHours = (scheduledMs - cancelledMs) / (1000 * 60 * 60);

  // Case 1: Cancelled more than 4 hours ahead
  if (diffHours >= 4 && !providerDispatched) {
    return {
      isFree: true,
      penaltyFee: 0,
      refundAmount: orderSubtotal,
      providerCompensation: 0,
      platformRetention: 0,
      reasonCode: 'CUSTOMER_ADVANCE_FREE',
      explanation: 'Cancelled > 4 hours before service window. 100% full refund.',
    };
  }

  // Case 2: Cancelled between 1 and 4 hours ahead
  if (diffHours >= 1 && !providerDispatched) {
    const penaltyFee = Math.min(orderSubtotal, Math.max(50, Math.round(orderSubtotal * 0.1)));
    const refundAmount = Math.max(0, orderSubtotal - penaltyFee);
    const providerCompensation = Math.round(penaltyFee * 0.7); // 70% of fee to provider
    const platformRetention = penaltyFee - providerCompensation;

    return {
      isFree: false,
      penaltyFee,
      refundAmount,
      providerCompensation,
      platformRetention,
      reasonCode: 'CUSTOMER_MODERATE_NOTICE',
      explanation: `Cancelled within 1-4 hours of slot. Standard late cancellation fee of ₹${penaltyFee} applied.`,
    };
  }

  // Case 3: Cancelled less than 1 hour ahead or provider is already dispatched/on-site
  const penaltyFee = Math.round(orderSubtotal * 0.5);
  const refundAmount = Math.max(0, orderSubtotal - penaltyFee);
  const providerCompensation = Math.round(penaltyFee * 0.85); // 85% to compensate travel
  const platformRetention = penaltyFee - providerCompensation;

  return {
    isFree: false,
    penaltyFee,
    refundAmount,
    providerCompensation,
    platformRetention,
    reasonCode: 'CUSTOMER_IMMEDIATE_OR_DISPATCHED',
    explanation:
      'Cancelled < 1 hour before slot or provider en-route. 50% fee applied for transit compensation.',
  };
}

/**
 * Calculates provider cancellation penalties according to rule N04.2:
 * - > 4 hours prior: No penalty dues, broadcasted to backup pool.
 * - < 2 hours prior: Rs 200 provider dues added, resident given Rs 100 wallet credit.
 * - No-show / unnotified: Rs 500 penalty, automatic account review/suspension, 100% resident refund + Rs 150 apology credit.
 */
export function calculateProviderCancellation(
  scheduledTimeIso: string,
  cancelledTimeIso = new Date().toISOString(),
  isNoShow = false,
): ProviderPenaltyResult {
  if (isNoShow) {
    return {
      penaltyDues: 500,
      residentCompensationCredit: 150,
      reassignToBackupPool: true,
      suspensionTriggered: true,
      reasonCode: 'PROVIDER_NO_SHOW',
      explanation:
        'Provider unnotified no-show: ₹500 penalty dues, account flagged for review, ₹150 credit to resident.',
    };
  }

  const scheduledMs = new Date(scheduledTimeIso).getTime();
  const cancelledMs = new Date(cancelledTimeIso).getTime();
  const diffHours = (scheduledMs - cancelledMs) / (1000 * 60 * 60);

  if (diffHours >= 4) {
    return {
      penaltyDues: 0,
      residentCompensationCredit: 0,
      reassignToBackupPool: true,
      suspensionTriggered: false,
      reasonCode: 'PROVIDER_ADVANCE_NOTICE',
      explanation:
        'Provider cancelled with >4h notice. Order re-broadcasted to eligible society providers.',
    };
  }

  return {
    penaltyDues: 200,
    residentCompensationCredit: 100,
    reassignToBackupPool: true,
    suspensionTriggered: false,
    reasonCode: 'PROVIDER_SHORT_NOTICE',
    explanation:
      'Provider cancelled <2h before slot. ₹200 fee debited to dues; ₹100 credit awarded to resident.',
  };
}

/**
 * Checks if a daily tiffin service can be cancelled or skipped according to rule N04.4:
 * Cutoff: strictly 9:00 PM (21:00) on the preceding calendar day.
 */
export function isTiffinCutoffPassed(
  mealDateString: string, // 'YYYY-MM-DD'
  currentTimeIso = new Date().toISOString(),
): { cutoffPassed: boolean; cutoffTimeIso: string; message: string } {
  const [year, month, day] = mealDateString.split('-').map(Number);

  // Cutoff is strictly 9:00 PM IST (15:30 UTC) on the calendar day preceding the meal
  const cutoffUtcMs = Date.UTC(year, month - 1, day - 1, 15, 30, 0, 0);
  const cutoffTimeIso = new Date(cutoffUtcMs).toISOString();

  const currentMs = new Date(currentTimeIso).getTime();
  const cutoffPassed = currentMs > cutoffUtcMs;

  return {
    cutoffPassed,
    cutoffTimeIso,
    message: cutoffPassed
      ? 'Tiffin cancellation cutoff (9:00 PM the night before) has passed. Fresh ingredients already prepped.'
      : 'Tiffin can be skipped/cancelled with 100% credit refund.',
  };
}
