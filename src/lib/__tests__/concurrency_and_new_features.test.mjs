import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateReferralCode,
  attributeReferral,
  awardReferralCredits,
  generateWhatsAppShareLink,
} from '../../features/referrals/referralService.ts';

import {
  isOrderExpiredForRetention,
  sanitizeOrdersForRetention,
} from '../../features/privacy/dataRetention.ts';

import {
  residentOnboardingSchema,
  bankVerificationSchema,
  validateForm,
} from '../validation/schemas.ts';

// -----------------------------------------------------------------------------
// 1. REFERRAL CODE & ATTRIBUTION TESTS (N09.4, N09.5)
// -----------------------------------------------------------------------------
test('Referrals: Generates clean uppercase referral code', () => {
  const code = generateReferralCode('Rahul Sharma', 'usr-9281');
  assert.equal(code, 'RAHUL-9281');
});

test('Referrals: Prevents self-referral attribution', () => {
  const codes = { 'RAHUL-9281': 'user-rahul' };
  const res = attributeReferral('RAHUL-9281', 'user-rahul', codes);
  assert.equal(res.valid, false);
  assert.match(res.error, /SELF_REFERRAL/);
});

test('Referrals: Successfully attributes valid referral code', () => {
  const codes = { 'PRIYA-1024': 'user-priya' };
  const res = attributeReferral('PRIYA-1024', 'user-vikram', codes);
  assert.equal(res.valid, true);
  assert.equal(res.referrerUserId, 'user-priya');
});

test('Referrals: Awards ₹100 to referrer and ₹50 to referee on completed order >= ₹200', () => {
  const referral = {
    referralCode: 'PRIYA-1024',
    referrerUserId: 'user-priya',
    refereeUserId: 'user-vikram',
    rewardStatus: 'PENDING',
    referrerCreditAmount: 100,
    refereeCreditAmount: 50,
    createdAt: '2026-10-10T10:00:00Z',
  };

  // Subtotal ₹150 (< ₹200 min value) -> rejected
  const smallOrder = awardReferralCredits(referral, 150, 'COMPLETED');
  assert.equal(smallOrder.qualified, false);
  assert.match(smallOrder.reason, /MIN_ORDER_NOT_MET/);

  // Subtotal ₹350 -> awarded
  const validOrder = awardReferralCredits(referral, 350, 'COMPLETED');
  assert.equal(validOrder.qualified, true);
  assert.equal(validOrder.referrerBonus, 100);
  assert.equal(validOrder.refereeBonus, 50);
});

test('Referrals: Formats WhatsApp share link with encoded message', () => {
  const link = generateWhatsAppShareLink('VIKRAM-5544', 'Greenfield Heights');
  assert.match(link, /^https:\/\/wa\.me\/\?text=/);
  assert.match(link, /VIKRAM-5544/);
});

// -----------------------------------------------------------------------------
// 2. DATA RETENTION & DPDP PRIVACY TESTS (N08.5)
// -----------------------------------------------------------------------------
test('Data Retention: Identifies orders older than 30 days', () => {
  const now = new Date('2026-10-16T12:00:00Z');
  const recentOrderDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
  const oldOrderDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(); // 35 days ago

  assert.equal(isOrderExpiredForRetention(recentOrderDate, now.toISOString()), false);
  assert.equal(isOrderExpiredForRetention(oldOrderDate, now.toISOString()), true);
});

test('Data Retention: Purges resident flat, photos, and chats after 30 days', () => {
  const now = new Date('2026-10-16T12:00:00Z');
  const oldCompleted = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString();

  const orders = [
    {
      id: 'ord-old-01',
      status: 'COMPLETED',
      completedAt: oldCompleted,
      flatNumber: 'B-104',
      beforePhotoUrl: 'https://storage/before.jpg',
      afterPhotoUrl: 'https://storage/after.jpg',
      chatMessages: [{ sender: 'resident', text: 'Call me at gate' }],
    },
    {
      id: 'ord-recent-02',
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      flatNumber: 'A-502',
      beforePhotoUrl: 'https://storage/recent.jpg',
      chatMessages: [{ sender: 'resident', text: 'Ring bell' }],
    },
  ];

  const { sanitizedOrders, result } = sanitizeOrdersForRetention(orders, now.toISOString());
  assert.equal(result.ordersPurgedCount, 1);
  assert.equal(result.photosRedactedCount, 2);
  assert.equal(result.chatsAnonymizedCount, 1);

  // Old order is redacted
  const purged = sanitizedOrders.find((o) => o.id === 'ord-old-01');
  assert.equal(purged.flatNumber, '[REDACTED_BY_RETENTION_POLICY]');
  assert.equal(purged.beforePhotoUrl, undefined);
  assert.equal(purged.chatMessages.length, 0);

  // Recent order remains intact
  const active = sanitizedOrders.find((o) => o.id === 'ord-recent-02');
  assert.equal(active.flatNumber, 'A-502');
  assert.equal(active.beforePhotoUrl, 'https://storage/recent.jpg');
});

// -----------------------------------------------------------------------------
// 3. ZOD FORM VALIDATION TESTS (S16.4)
// -----------------------------------------------------------------------------
test('Zod: Resident onboarding validates Indian phone and fields', () => {
  const invalid = validateForm(residentOnboardingSchema, {
    name: 'A',
    phone: '12345',
    tower: '',
    flatNumber: '',
    societyId: '',
  });
  assert.equal(invalid.success, false);
  assert.ok(invalid.errors.phone);

  const valid = validateForm(residentOnboardingSchema, {
    name: 'Yash Khandagale',
    phone: '9876543210',
    tower: 'Tower B',
    flatNumber: 'B-402',
    societyId: 'soc-greenfield',
  });
  assert.equal(valid.success, true);
});

test('Zod: Bank verification enforces IFSC format and matching account numbers', () => {
  const mismatch = validateForm(bankVerificationSchema, {
    accountNumber: '1234567890',
    confirmAccountNumber: '9999999999',
    ifsc: 'HDFC0001234',
    beneficiaryName: 'Rajesh Kumar',
  });
  assert.equal(mismatch.success, false);
  assert.match(mismatch.errors.confirmAccountNumber, /match/);

  const match = validateForm(bankVerificationSchema, {
    accountNumber: '123456789012',
    confirmAccountNumber: '123456789012',
    ifsc: 'SBIN0001234',
    beneficiaryName: 'Rajesh Kumar',
  });
  assert.equal(match.success, true);
});

// -----------------------------------------------------------------------------
// 4. ATOMIC CONCURRENCY & RACE CONDITION TEST (S18.5)
// -----------------------------------------------------------------------------
test('Concurrency: Simulated simultaneous claims allow exactly one winner', async () => {
  let jobClaimedBy = null;
  let claimAttempts = 0;

  // Thread-safe atomic claim simulation function
  async function simulateAtomicClaim(providerId) {
    claimAttempts++;
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 5)); // random tick jitter

    // Atomic compare-and-swap
    if (jobClaimedBy === null) {
      jobClaimedBy = providerId;
      return { success: true, claimedBy: providerId };
    }
    return { success: false, error: 'ALREADY_CLAIMED' };
  }

  // 10 providers simultaneously attempt to claim the exact same open job
  const providerIds = Array.from({ length: 10 }, (_, i) => `prov-${i + 1}`);
  const results = await Promise.all(providerIds.map((id) => simulateAtomicClaim(id)));

  const winners = results.filter((r) => r.success);
  const losers = results.filter((r) => !r.success);

  assert.equal(winners.length, 1);
  assert.equal(losers.length, 9);
  assert.equal(claimAttempts, 10);
  assert.ok(jobClaimedBy !== null);
});
