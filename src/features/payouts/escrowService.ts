export interface EscrowHold {
  orderId: string;
  residentId: string;
  providerId: string;
  grossAmount: number;
  platformCommissionRate: number; // e.g. 0.12 or 0.04
  platformCommissionAmount: number;
  providerPayoutAmount: number;
  status: 'HELD_IN_ESCROW' | 'RELEASED_TO_PROVIDER' | 'REFUNDED_TO_RESIDENT' | 'HELD_IN_DISPUTE';
  heldAt: string;
  releasedAt?: string;
  isBookSameProviderExemption: boolean;
}

export interface PayoutBatchItem {
  providerId: string;
  totalGross: number;
  totalCommissionDeducted: number;
  totalPenaltyDuesDeducted: number;
  netPayoutPayable: number;
  bankAccountMasked: string;
  ifsc: string;
  orderIds: string[];
}

/**
 * Creates an escrow hold for a newly booked and paid order.
 * Implements N08.6 'Book same provider' rule:
 * - If customer books the same provider directly, commission is reduced to a flat 4.0%
 *   (down from standard category rates 10-15%) and rotation is exempted.
 */
export function createEscrowHold(
  orderId: string,
  residentId: string,
  providerId: string,
  grossAmount: number,
  standardCategoryCommissionRate: number,
  isBookSameProvider = false,
  nowIso = new Date().toISOString(),
): EscrowHold {
  const commissionRate = isBookSameProvider ? 0.04 : standardCategoryCommissionRate;
  const platformCommissionAmount = Math.round(grossAmount * commissionRate);
  const providerPayoutAmount = Math.max(0, grossAmount - platformCommissionAmount);

  return {
    orderId,
    residentId,
    providerId,
    grossAmount,
    platformCommissionRate: commissionRate,
    platformCommissionAmount,
    providerPayoutAmount,
    status: 'HELD_IN_ESCROW',
    heldAt: nowIso,
    isBookSameProviderExemption: isBookSameProvider,
  };
}

/**
 * Releases escrow funds upon successful service completion and End OTP verification.
 */
export function releaseEscrowToProvider(
  escrow: EscrowHold,
  nowIso = new Date().toISOString(),
): { updatedEscrow: EscrowHold; providerCredit: number } {
  if (escrow.status !== 'HELD_IN_ESCROW') {
    throw new Error(`Cannot release escrow in status: ${escrow.status}`);
  }

  const updatedEscrow: EscrowHold = {
    ...escrow,
    status: 'RELEASED_TO_PROVIDER',
    releasedAt: nowIso,
  };

  return {
    updatedEscrow,
    providerCredit: escrow.providerPayoutAmount,
  };
}

/**
 * Calculates weekly Tuesday payout batch ledger (Rule S12.2).
 * Aggregates all released escrow amounts for the week, subtracts any accumulated penalty dues,
 * and generates the payable payout line items.
 */
export function calculateWeeklyTuesdayPayoutBatch(
  releasedEscrows: EscrowHold[],
  providerPendingDues: Record<string, number> = {},
  providerBankDetails: Record<string, { accountMasked: string; ifsc: string }> = {},
): PayoutBatchItem[] {
  const grouped: Record<string, { gross: number; commission: number; orders: string[] }> = {};

  for (const esc of releasedEscrows) {
    if (esc.status !== 'RELEASED_TO_PROVIDER') continue;
    if (!grouped[esc.providerId]) {
      grouped[esc.providerId] = { gross: 0, commission: 0, orders: [] };
    }
    grouped[esc.providerId].gross += esc.grossAmount;
    grouped[esc.providerId].commission += esc.platformCommissionAmount;
    grouped[esc.providerId].orders.push(esc.orderId);
  }

  const batch: PayoutBatchItem[] = [];

  for (const [providerId, stats] of Object.entries(grouped)) {
    const unadjustedEarnings = stats.gross - stats.commission;
    const dues = providerPendingDues[providerId] || 0;
    const netPayoutPayable = Math.max(0, unadjustedEarnings - dues);
    const bank = providerBankDetails[providerId] || {
      accountMasked: '****0000',
      ifsc: 'HDFC0001234',
    };

    batch.push({
      providerId,
      totalGross: stats.gross,
      totalCommissionDeducted: stats.commission,
      totalPenaltyDuesDeducted: Math.min(dues, unadjustedEarnings),
      netPayoutPayable,
      bankAccountMasked: bank.accountMasked,
      ifsc: bank.ifsc,
      orderIds: stats.orders,
    });
  }

  return batch;
}
