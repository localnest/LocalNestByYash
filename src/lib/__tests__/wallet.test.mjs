import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateEarnedCredits, 
  calculateMaxRedeemableCredits, 
  isStreakBonusEligible 
} from '../retentionUtils.ts';
import { PLATFORM_CONFIG } from '../config.ts';

test('Wallet: calculates 3% credits earned on subtotal', () => {
  // ₹1000 subtotal -> ₹30
  assert.equal(calculateEarnedCredits(1000), 30);
  // ₹500 subtotal -> ₹15
  assert.equal(calculateEarnedCredits(500), 15);
  // ₹249 subtotal -> Math.round(7.47) = 7
  assert.equal(calculateEarnedCredits(249), 7);
  // ₹0 subtotal -> 0
  assert.equal(calculateEarnedCredits(0), 0);
});

test('Wallet: enforces max 20% redemption cap', () => {
  const subtotal = 1000;
  // 20% cap = ₹200

  // Case 1: User has abundant balance (₹500), capped at ₹200
  assert.equal(calculateMaxRedeemableCredits(subtotal, 500), 200);

  // Case 2: User has balance below cap (₹80), can redeem full ₹80
  assert.equal(calculateMaxRedeemableCredits(subtotal, 80), 80);

  // Case 3: Exactly at cap (₹200)
  assert.equal(calculateMaxRedeemableCredits(subtotal, 200), 200);

  // Case 4: Zero balance
  assert.equal(calculateMaxRedeemableCredits(subtotal, 0), 0);
});

test('Wallet: detects streak bonus interval', () => {
  // Interval is 5 orders
  assert.equal(isStreakBonusEligible(1), false);
  assert.equal(isStreakBonusEligible(4), false);
  assert.equal(isStreakBonusEligible(5), true);
  assert.equal(isStreakBonusEligible(6), false);
  assert.equal(isStreakBonusEligible(10), true);
  assert.equal(isStreakBonusEligible(15), true);
  assert.equal(isStreakBonusEligible(0), false);
});
