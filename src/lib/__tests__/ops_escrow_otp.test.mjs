import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateOtp,
  verifyOtp,
  hashOtp,
  generateEmailOtpFallback,
} from '../../features/dispatch/otpService.ts';

import {
  calculateCustomerCancellation,
  calculateProviderCancellation,
  isTiffinCutoffPassed,
} from '../../features/dispatch/cancellationEngine.ts';

import {
  calculateFollowupMoneyRules,
  transitionFollowupState,
} from '../../features/payouts/followupStateMachine.ts';

import {
  createEscrowHold,
  releaseEscrowToProvider,
  calculateWeeklyTuesdayPayoutBatch,
} from '../../features/payouts/escrowService.ts';

import { generateGstInvoice, SAC_CODES } from '../../features/billing/gstInvoice.ts';
import { formatTelegramSafetyAlert } from '../../features/notifications/telegramService.ts';

// -----------------------------------------------------------------------------
// 1. OTP SERVICE TESTS (S09.2, N03.1)
// -----------------------------------------------------------------------------
test('OTP: Generates valid 4-digit code and hashed record', () => {
  const { plainOtp, record } = generateOtp('ord-101', 'DOOR');
  assert.match(plainOtp, /^\d{4}$/);
  assert.equal(record.orderId, 'ord-101');
  assert.equal(record.type, 'DOOR');
  assert.equal(record.attempts, 0);
  assert.equal(record.verified, false);
  assert.equal(record.otpHash, hashOtp(plainOtp, 'ord-101'));
});

test('OTP: Correct code verifies successfully', () => {
  const { plainOtp, record } = generateOtp('ord-102', 'START');
  const { updatedRecord, result } = verifyOtp(record, plainOtp);
  assert.equal(result.valid, true);
  assert.equal(updatedRecord.verified, true);
  assert.equal(updatedRecord.attempts, 1);
});

test('OTP: Incorrect code increments attempt and locks after 3 failures', () => {
  const { record } = generateOtp('ord-103', 'END');

  // Attempt 1: wrong
  let res = verifyOtp(record, '0000');
  assert.equal(res.result.valid, false);
  assert.equal(res.updatedRecord.attempts, 1);
  assert.equal(res.result.attemptsRemaining, 2);

  // Attempt 2: wrong
  res = verifyOtp(res.updatedRecord, '1111');
  assert.equal(res.result.valid, false);
  assert.equal(res.updatedRecord.attempts, 2);
  assert.equal(res.result.attemptsRemaining, 1);

  // Attempt 3: wrong -> lock
  res = verifyOtp(res.updatedRecord, '2222');
  assert.equal(res.result.valid, false);
  assert.equal(res.updatedRecord.attempts, 3);
  assert.equal(res.result.attemptsRemaining, 0);

  // Attempt 4: rejects immediately
  const lockedRes = verifyOtp(res.updatedRecord, '9999');
  assert.equal(lockedRes.result.valid, false);
  assert.match(lockedRes.result.error, /MAX_ATTEMPTS_EXCEEDED/);
});

test('OTP: Expired code returns expired error', () => {
  const { plainOtp, record } = generateOtp('ord-104', 'DOOR', -10); // Expired 10 min ago
  const { result } = verifyOtp(record, plainOtp);
  assert.equal(result.valid, false);
  assert.match(result.error, /OTP_EXPIRED/);
});

test('OTP: Email fallback notice generated cleanly', () => {
  const fallback = generateEmailOtpFallback('ord-105', 'resident@society.in');
  assert.match(fallback.plainOtp, /^\d{4}$/);
  assert.match(fallback.fallbackNotice, /resident@society\.in/);
});

// -----------------------------------------------------------------------------
// 2. CANCELLATION ENGINE TESTS (N04.1, N04.2, N04.4)
// -----------------------------------------------------------------------------
test('Customer Cancellation: >4 hours ahead is 100% free', () => {
  const scheduled = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const res = calculateCustomerCancellation(500, scheduled);
  assert.equal(res.isFree, true);
  assert.equal(res.penaltyFee, 0);
  assert.equal(res.refundAmount, 500);
});

test('Customer Cancellation: 1-4 hours ahead charges greater of Rs 50 or 10%', () => {
  const scheduled = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  // For ₹300 subtotal, 10% is 30, so flat min ₹50 applies
  const resSmall = calculateCustomerCancellation(300, scheduled);
  assert.equal(resSmall.isFree, false);
  assert.equal(resSmall.penaltyFee, 50);
  assert.equal(resSmall.refundAmount, 250);

  // For ₹1200 subtotal, 10% is ₹120 (> 50)
  const resLarge = calculateCustomerCancellation(1200, scheduled);
  assert.equal(resLarge.penaltyFee, 120);
  assert.equal(resLarge.refundAmount, 1080);
});

test('Customer Cancellation: <1 hour ahead or dispatched charges 50% penalty', () => {
  const scheduled = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const res = calculateCustomerCancellation(600, scheduled, undefined, true);
  assert.equal(res.penaltyFee, 300);
  assert.equal(res.refundAmount, 300);
  assert.ok(res.providerCompensation > 0);
});

test('Provider Cancellation: >4h free; <2h ₹200 fee; No-show ₹500 + review', () => {
  const now = new Date();
  const scheduledAdvance = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();
  const scheduledShort = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();

  // Advance
  const adv = calculateProviderCancellation(scheduledAdvance);
  assert.equal(adv.penaltyDues, 0);
  assert.equal(adv.suspensionTriggered, false);

  // Short notice
  const short = calculateProviderCancellation(scheduledShort);
  assert.equal(short.penaltyDues, 200);
  assert.equal(short.residentCompensationCredit, 100);

  // No-show
  const noShow = calculateProviderCancellation(scheduledShort, undefined, true);
  assert.equal(noShow.penaltyDues, 500);
  assert.equal(noShow.residentCompensationCredit, 150);
  assert.equal(noShow.suspensionTriggered, true);
});

test('Tiffin Cutoff: Enforces 9:00 PM the night before', () => {
  // If meal is on 2026-10-20:
  // Cutoff is 2026-10-19 21:00:00 IST (15:30:00 UTC)
  const beforeCutoff = '2026-10-19T14:00:00.000Z'; // 7:30 PM IST
  const afterCutoff = '2026-10-19T16:00:00.000Z'; // 9:30 PM IST

  const check1 = isTiffinCutoffPassed('2026-10-20', beforeCutoff);
  assert.equal(check1.cutoffPassed, false);

  const check2 = isTiffinCutoffPassed('2026-10-20', afterCutoff);
  assert.equal(check2.cutoffPassed, true);
});

// -----------------------------------------------------------------------------
// 3. FOLLOW-UP STATE MACHINE & MONEY RULES (N05.1a, N05.1b)
// -----------------------------------------------------------------------------
test('Follow-up: 6 money cases calculate correctly', () => {
  // 1. PART_NEEDED: Resident pays part cost
  const partCase = calculateFollowupMoneyRules('PART_NEEDED', 450);
  assert.equal(partCase.residentCharge, 450);
  assert.equal(partCase.providerPayout, 450);

  // 2. PROVIDER_FAULT: Free for resident, Rs 0 for provider
  const faultCase = calculateFollowupMoneyRules('PROVIDER_FAULT');
  assert.equal(faultCase.residentCharge, 0);
  assert.equal(faultCase.providerPayout, 0);

  // 3. CUSTOMER_RESCHEDULED: Rs 149 transit penalty
  const reschedCase = calculateFollowupMoneyRules('CUSTOMER_RESCHEDULED');
  assert.equal(reschedCase.residentCharge, 149);
  assert.equal(reschedCase.providerPayout, 149);

  // 4. MATERIALS_PENDING: Rs 99 re-dispatch
  const matCase = calculateFollowupMoneyRules('MATERIALS_PENDING');
  assert.equal(matCase.residentCharge, 99);

  // 5. FOLLOWUP_INSPECTION: Rs 0
  const inspectCase = calculateFollowupMoneyRules('FOLLOWUP_INSPECTION');
  assert.equal(inspectCase.residentCharge, 0);

  // 6. WARRANTY_CLAIM: Rs 0
  const warCase = calculateFollowupMoneyRules('WARRANTY_CLAIM');
  assert.equal(warCase.residentCharge, 0);
});

test('Follow-up: State machine allows valid and blocks invalid transitions', () => {
  // Valid flow: INITIAL -> SCHEDULED -> IN_PROGRESS -> COMPLETED
  let trans = transitionFollowupState('INITIAL_INCOMPLETE', 'SCHEDULE');
  assert.equal(trans.allowed, true);
  assert.equal(trans.nextState, 'FOLLOWUP_SCHEDULED');

  trans = transitionFollowupState(trans.nextState, 'START');
  assert.equal(trans.allowed, true);
  assert.equal(trans.nextState, 'FOLLOWUP_IN_PROGRESS');

  trans = transitionFollowupState(trans.nextState, 'COMPLETE');
  assert.equal(trans.allowed, true);
  assert.equal(trans.nextState, 'FOLLOWUP_COMPLETED');

  // Terminal state cannot transition again
  const terminal = transitionFollowupState('FOLLOWUP_COMPLETED', 'START');
  assert.equal(terminal.allowed, false);
});

// -----------------------------------------------------------------------------
// 4. ESCROW & BOOK SAME PROVIDER (S11.2, S11.4, N08.6, S12.2)
// -----------------------------------------------------------------------------
test('Escrow: Standard booking uses category commission rate', () => {
  const escrow = createEscrowHold('ord-201', 'user-1', 'prov-1', 1000, 0.12, false);
  assert.equal(escrow.grossAmount, 1000);
  assert.equal(escrow.platformCommissionRate, 0.12);
  assert.equal(escrow.platformCommissionAmount, 120);
  assert.equal(escrow.providerPayoutAmount, 880);
  assert.equal(escrow.status, 'HELD_IN_ESCROW');
});

test('Escrow: "Book Same Provider" reduces commission to 4% (N08.6)', () => {
  const escrow = createEscrowHold('ord-202', 'user-1', 'prov-1', 1000, 0.15, true);
  assert.equal(escrow.platformCommissionRate, 0.04);
  assert.equal(escrow.platformCommissionAmount, 40);
  assert.equal(escrow.providerPayoutAmount, 960);
  assert.equal(escrow.isBookSameProviderExemption, true);
});

test('Escrow: Releasing escrow marks status and returns provider credit', () => {
  const escrow = createEscrowHold('ord-203', 'user-1', 'prov-1', 500, 0.1);
  const released = releaseEscrowToProvider(escrow);
  assert.equal(released.updatedEscrow.status, 'RELEASED_TO_PROVIDER');
  assert.equal(released.providerCredit, 450);
});

test('Weekly Payout: Aggregates Tuesday batch and deducts penalty dues (S12.2)', () => {
  const escrowA = {
    orderId: 'ord-1',
    residentId: 'u1',
    providerId: 'prov-rajesh',
    grossAmount: 1000,
    platformCommissionRate: 0.1,
    platformCommissionAmount: 100,
    providerPayoutAmount: 900,
    status: 'RELEASED_TO_PROVIDER',
    heldAt: '2026-10-10T10:00:00Z',
    isBookSameProviderExemption: false,
  };

  const escrowB = {
    orderId: 'ord-2',
    residentId: 'u2',
    providerId: 'prov-rajesh',
    grossAmount: 500,
    platformCommissionRate: 0.1,
    platformCommissionAmount: 50,
    providerPayoutAmount: 450,
    status: 'RELEASED_TO_PROVIDER',
    heldAt: '2026-10-11T10:00:00Z',
    isBookSameProviderExemption: false,
  };

  // Rajesh has ₹200 pending penalty dues from a short notice cancellation
  const dues = { 'prov-rajesh': 200 };
  const banks = { 'prov-rajesh': { accountMasked: '****5678', ifsc: 'SBIN0004321' } };

  const batch = calculateWeeklyTuesdayPayoutBatch([escrowA, escrowB], dues, banks);
  assert.equal(batch.length, 1);
  const rajesh = batch[0];
  assert.equal(rajesh.totalGross, 1500);
  assert.equal(rajesh.totalCommissionDeducted, 150);
  assert.equal(rajesh.totalPenaltyDuesDeducted, 200);
  assert.equal(rajesh.netPayoutPayable, 1150); // 1500 - 150 - 200 = 1150
  assert.equal(rajesh.bankAccountMasked, '****5678');
  assert.equal(rajesh.orderIds.length, 2);
});

// -----------------------------------------------------------------------------
// 5. GST INVOICE & TELEGRAM ALERTS (S12.6, N07.2)
// -----------------------------------------------------------------------------
test('GST Invoice: Intra-state splits into 9% CGST + 9% SGST with correct SAC', () => {
  const inv = generateGstInvoice('ord-999', 1180, 'Deep Home Repairs', '27', '27');
  assert.equal(inv.isIntraState, true);
  assert.equal(inv.sacCode, SAC_CODES.HOME_REPAIRS);
  assert.equal(inv.taxes.cgstRate, 0.09);
  assert.equal(inv.taxes.sgstRate, 0.09);
  assert.equal(inv.taxes.igstRate, 0);
  assert.equal(inv.taxes.totalInvoiceAmount, 1180);
  assert.equal(Math.round(inv.taxes.taxableAmount + inv.taxes.totalTax), 1180);
});

test('GST Invoice: Inter-state applies 18% IGST', () => {
  const inv = generateGstInvoice('ord-998', 1180, 'Tiffin Service', '27', '29'); // MH to KA
  assert.equal(inv.isIntraState, false);
  assert.equal(inv.sacCode, SAC_CODES.TIFFIN_CATERING);
  assert.equal(inv.taxes.cgstAmount, 0);
  assert.equal(inv.taxes.sgstAmount, 0);
  assert.equal(inv.taxes.igstRate, 0.18);
  assert.ok(inv.taxes.igstAmount > 0);
});

test('Telegram: Formats critical safety alert with markdown', () => {
  const text = formatTelegramSafetyAlert({
    complaintId: 'cmp-01',
    orderId: 'ord-888',
    societyName: 'Greenfield Heights',
    residentFlat: 'B-402',
    category: 'Electrical Work',
    severity: 'CRITICAL_SAFETY',
    description: 'Sparks observed from main distribution box post technician visit.',
    timestamp: '2026-10-16 12:30',
  });

  assert.match(text, /CRITICAL SAFETY ALERT/);
  assert.match(text, /Greenfield Heights/);
  assert.match(text, /B-402/);
  assert.match(text, /ord-888/);
});
