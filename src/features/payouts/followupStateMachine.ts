export type FollowupReasonCase =
  | 'PART_NEEDED'
  | 'PROVIDER_FAULT'
  | 'CUSTOMER_RESCHEDULED'
  | 'MATERIALS_PENDING'
  | 'FOLLOWUP_INSPECTION'
  | 'WARRANTY_CLAIM';

export type FollowupState =
  | 'INITIAL_INCOMPLETE'
  | 'FOLLOWUP_SCHEDULED'
  | 'FOLLOWUP_IN_PROGRESS'
  | 'FOLLOWUP_COMPLETED'
  | 'ESCALATED_DISPUTE'
  | 'RESOLVED_REFUNDED';

export interface FollowupVisitRecord {
  id: string;
  parentOrderId: string;
  providerId: string;
  residentId: string;
  reasonCase: FollowupReasonCase;
  state: FollowupState;
  partCost: number;
  residentExtraCharge: number;
  providerRevisitPayout: number;
  scheduledSlot: string;
  notes: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface MoneyCaseResolution {
  residentCharge: number;
  providerPayout: number;
  escrowAdjustment: number;
  chargeDescription: string;
}

/**
 * Resolves money allocation for all 6 follow-up visit cases (Rule N05.1b):
 * 1. PART_NEEDED: Resident pays part cost + ₹0 revisit labor if under 30m or nominal ₹99. Provider paid part reimbursement + labor.
 * 2. PROVIDER_FAULT: ₹0 charge to resident. Provider must resolve on own time with ₹0 extra payout.
 * 3. CUSTOMER_RESCHEDULED: Customer missed initial visit. Customer pays ₹149 transit penalty. Provider receives ₹149 transit compensation.
 * 4. MATERIALS_PENDING: Agreed resident supplies missing. Customer pays ₹99 re-dispatch fee.
 * 5. FOLLOWUP_INSPECTION: Free quality check within 7 days. ₹0 resident charge.
 * 6. WARRANTY_CLAIM: Under 15-day service guarantee. ₹0 resident charge. If unresolved, full original escrow refunded to resident.
 */
export function calculateFollowupMoneyRules(
  reasonCase: FollowupReasonCase,
  partCost = 0,
): MoneyCaseResolution {
  switch (reasonCase) {
    case 'PART_NEEDED':
      return {
        residentCharge: partCost,
        providerPayout: partCost,
        escrowAdjustment: partCost,
        chargeDescription: `Resident billed ₹${partCost} for required replacement part. Revisit labor covered under initial ticket.`,
      };

    case 'PROVIDER_FAULT':
      return {
        residentCharge: 0,
        providerPayout: 0,
        escrowAdjustment: 0,
        chargeDescription:
          'Provider fault / rework required. Revisit is 100% free for resident. Provider receives ₹0 additional payout.',
      };

    case 'CUSTOMER_RESCHEDULED':
      return {
        residentCharge: 149,
        providerPayout: 149,
        escrowAdjustment: 149,
        chargeDescription:
          'Customer rescheduled after provider arrival. ₹149 convenience fee charged for secondary transit.',
      };

    case 'MATERIALS_PENDING':
      return {
        residentCharge: 99,
        providerPayout: 99,
        escrowAdjustment: 99,
        chargeDescription:
          'Agreed resident supplies pending on-site. ₹99 re-dispatch charge applied for secondary visit.',
      };

    case 'FOLLOWUP_INSPECTION':
      return {
        residentCharge: 0,
        providerPayout: 0,
        escrowAdjustment: 0,
        chargeDescription:
          'Complimentary quality check within 7-day satisfaction window. ₹0 charge.',
      };

    case 'WARRANTY_CLAIM':
      return {
        residentCharge: 0,
        providerPayout: 0,
        escrowAdjustment: 0,
        chargeDescription:
          '15-Day LocalNest Guarantee: Free resolution. Original escrow held until customer signs off.',
      };
  }
}

/**
 * State machine transition validator for follow-up visits.
 */
export function transitionFollowupState(
  currentState: FollowupState,
  action: 'SCHEDULE' | 'START' | 'COMPLETE' | 'ESCALATE' | 'REFUND',
): { allowed: boolean; nextState: FollowupState; error?: string } {
  switch (currentState) {
    case 'INITIAL_INCOMPLETE':
      if (action === 'SCHEDULE') return { allowed: true, nextState: 'FOLLOWUP_SCHEDULED' };
      if (action === 'ESCALATE') return { allowed: true, nextState: 'ESCALATED_DISPUTE' };
      break;

    case 'FOLLOWUP_SCHEDULED':
      if (action === 'START') return { allowed: true, nextState: 'FOLLOWUP_IN_PROGRESS' };
      if (action === 'ESCALATE') return { allowed: true, nextState: 'ESCALATED_DISPUTE' };
      break;

    case 'FOLLOWUP_IN_PROGRESS':
      if (action === 'COMPLETE') return { allowed: true, nextState: 'FOLLOWUP_COMPLETED' };
      if (action === 'ESCALATE') return { allowed: true, nextState: 'ESCALATED_DISPUTE' };
      break;

    case 'ESCALATED_DISPUTE':
      if (action === 'REFUND') return { allowed: true, nextState: 'RESOLVED_REFUNDED' };
      if (action === 'COMPLETE') return { allowed: true, nextState: 'FOLLOWUP_COMPLETED' };
      break;

    case 'FOLLOWUP_COMPLETED':
    case 'RESOLVED_REFUNDED':
      return { allowed: false, nextState: currentState, error: 'Follow-up is already finalized.' };
  }

  return {
    allowed: false,
    nextState: currentState,
    error: `Invalid transition from ${currentState} with action ${action}`,
  };
}
