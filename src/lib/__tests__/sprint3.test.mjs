import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateIfsc,
  validateAccountNumber,
  maskAccountNumber,
  hashAccountNumber,
  verifyBankAccountPennyDrop,
} from '../../features/payouts/bankVerification.ts';

import {
  getFeatureFlags,
  isFeatureEnabled,
  setFeatureFlagOverride,
  clearFeatureFlagOverrides,
} from '../featureFlags.ts';

import {
  subscribeToOrder,
  subscribeToSocietyDispatch,
  subscribeToOrderChat,
} from '../supabase/realtime.ts';

test('Bank Verification: IFSC validation', () => {
  assert.equal(validateIfsc('HDFC0001234'), true);
  assert.equal(validateIfsc('sbin0004567'), true); // case-insensitive check
  assert.equal(validateIfsc('ICIC0000001'), true);
  assert.equal(validateIfsc('INVALID'), false);
  assert.equal(validateIfsc('HDFC1001234'), false); // 5th character must be '0'
  assert.equal(validateIfsc(''), false);
});

test('Bank Verification: Account number validation', () => {
  assert.equal(validateAccountNumber('123456789'), true); // 9 digits
  assert.equal(validateAccountNumber('123456789012345678'), true); // 18 digits
  assert.equal(validateAccountNumber('12345678'), false); // 8 digits (too short)
  assert.equal(validateAccountNumber('1234567890123456789'), false); // 19 digits (too long)
  assert.equal(validateAccountNumber('12345abcd'), false); // non-numeric
  assert.equal(validateAccountNumber(''), false);
});

test('Bank Verification: Mask account number', () => {
  assert.equal(maskAccountNumber('123456789012'), '••••••••9012');
  assert.equal(maskAccountNumber('1234'), '1234');
});

test('Bank Verification: Account number hashing', () => {
  const hash1 = hashAccountNumber('123456789012');
  const hash2 = hashAccountNumber('123456789012');
  const hash3 = hashAccountNumber('987654321098');
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hash3);
  assert.ok(hash1.startsWith('hash_'));
});

test('Bank Verification: Penny drop simulation flow', async () => {
  // Valid bank account
  const validResult = await verifyBankAccountPennyDrop({
    providerId: 'prov-1',
    accountHolderName: 'Rajesh Kumar',
    accountNumber: '123456789012',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
  });
  assert.equal(validResult.valid, true);
  assert.equal(validResult.status, 'VERIFIED');
  assert.ok(validResult.referenceId);
  assert.equal(validResult.maskedAccount, '••••••••9012');

  // Invalid IFSC code
  const invalidIfscResult = await verifyBankAccountPennyDrop({
    providerId: 'prov-2',
    accountHolderName: 'Rajesh Kumar',
    accountNumber: '123456789012',
    ifscCode: 'BAD_IFSC',
    bankName: 'HDFC Bank',
  });
  assert.equal(invalidIfscResult.valid, false);
  assert.equal(invalidIfscResult.status, 'FAILED');
  assert.ok(invalidIfscResult.failureReason?.includes('Invalid IFSC'));

  // Invalid Account Number
  const invalidAccResult = await verifyBankAccountPennyDrop({
    providerId: 'prov-3',
    accountHolderName: 'Rajesh Kumar',
    accountNumber: '123',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
  });
  assert.equal(invalidAccResult.valid, false);
  assert.equal(invalidAccResult.status, 'FAILED');
  assert.ok(invalidAccResult.failureReason?.includes('between 9 and 18'));
});

test('Feature Flags: Default values and runtime overrides', () => {
  clearFeatureFlagOverrides();
  const defaults = getFeatureFlags();
  assert.equal(defaults.ENABLE_MEMBERSHIP_BILLING, true);
  assert.equal(defaults.ENABLE_FLAT_COMMISSION, true);
  assert.equal(defaults.ENABLE_INSTANT_PAYOUTS, false);
  assert.equal(isFeatureEnabled('ENABLE_MEMBERSHIP_BILLING'), true);
  assert.equal(isFeatureEnabled('ENABLE_INSTANT_PAYOUTS'), false);

  // Apply override
  setFeatureFlagOverride('ENABLE_INSTANT_PAYOUTS', true);
  assert.equal(isFeatureEnabled('ENABLE_INSTANT_PAYOUTS'), true);

  // Clear overrides
  clearFeatureFlagOverrides();
  assert.equal(isFeatureEnabled('ENABLE_INSTANT_PAYOUTS'), false);
});

test('Realtime Subscriptions: graceful fallback when Supabase is unconfigured', () => {
  const unsubOrder = subscribeToOrder('ord-1', () => {});
  assert.equal(typeof unsubOrder, 'function');
  assert.doesNotThrow(() => unsubOrder());

  const unsubDispatch = subscribeToSocietyDispatch('soc-1', () => {});
  assert.equal(typeof unsubDispatch, 'function');
  assert.doesNotThrow(() => unsubDispatch());

  const unsubChat = subscribeToOrderChat('ord-1', () => {});
  assert.equal(typeof unsubChat, 'function');
  assert.doesNotThrow(() => unsubChat());
});
