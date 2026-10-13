import test from 'node:test';
import assert from 'node:assert/strict';
import { MockDispatchAdapter } from '../../features/dispatch/api/mockAdapter.ts';
import { MockWalletAdapter } from '../../features/wallet/api/mockAdapter.ts';
import { MockChatAdapter } from '../../features/chat/api/mockAdapter.ts';

test('Feature Ports: MockDispatchAdapter claims job correctly', async () => {
  const mockJob = {
    id: 'job-test-1',
    jobNumber: 'JOB-001',
    societyId: 'soc-1',
    societyName: 'Test Society',
    flatNumber: 'A-101',
    residentId: 'res-1',
    residentName: 'Test Resident',
    residentPhoneMasked: '+91 98XXX-XX123',
    serviceTypeId: 'st-clean',
    serviceTypeName: 'Home Cleaning',
    categoryId: 'cat-clean',
    categoryName: 'Cleaning',
    status: 'OPEN',
    selectedTaskIds: [],
    taskBreakdown: [],
    scheduledDate: '2026-10-14',
    scheduledSlot: '10:00 - 11:00',
    estimatedDurationMinutes: 60,
    lockedSubtotal: 300,
    platformFee: 20,
    totalResidentPrice: 320,
    platformCommission: 30,
    providerPayout: 270,
    residentPreferences: {},
    doorOtp: '1234',
    notifiedProviderIds: [],
  };

  const adapter = new MockDispatchAdapter([mockJob]);
  const openJobs = await adapter.getOpenJobs('Test Society');
  assert.equal(openJobs.length, 1);

  const claimRes = await adapter.claimJob('job-test-1', 'prov-1');
  assert.equal(claimRes.success, true);
  assert.equal(claimRes.jobId, 'job-test-1');

  // Verify OTP
  const startRes = await adapter.verifyOtp('job-test-1', '1234', 'START');
  assert.equal(startRes.success, true);
});

test('Feature Ports: MockWalletAdapter handles credits and redemption', async () => {
  const wallet = new MockWalletAdapter();
  const bal = await wallet.getBalance('resident-42');
  assert.equal(bal.creditBalance, 150);

  const tx = await wallet.creditReward('resident-42', 30, 'ord-99', 'Test reward');
  assert.equal(tx.amount, 30);

  const newBal = await wallet.getBalance('resident-42');
  assert.equal(newBal.creditBalance, 180);

  const redeem = await wallet.redeemCredit('resident-42', 50, 'ord-100');
  assert.equal(redeem.success, true);
  assert.equal(redeem.amountDeducted, 50);

  const finalBal = await wallet.getBalance('resident-42');
  assert.equal(finalBal.creditBalance, 130);
});

test('Feature Ports: MockChatAdapter enforces retention chat filter', async () => {
  const chat = new MockChatAdapter();
  const allowed = await chat.sendMessage(
    'order-1',
    'res-1',
    'resident',
    'Hi, when will you arrive?',
  );
  assert.equal(allowed.success, true);
  assert.equal(allowed.blocked, undefined);

  // Phone number leak attempt
  const blockedPhone = await chat.sendMessage(
    'order-1',
    'res-1',
    'resident',
    'Call me on 9876543210',
  );
  assert.equal(blockedPhone.success, false);
  assert.equal(blockedPhone.blocked, true);

  // Off-platform bypass phrase
  const blockedBypass = await chat.sendMessage(
    'order-1',
    'res-1',
    'resident',
    'You can pay directly to my account',
  );
  assert.equal(blockedBypass.success, false);
  assert.equal(blockedBypass.blocked, true);
});
