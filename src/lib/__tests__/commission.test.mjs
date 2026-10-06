import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCommissionRate } from '../retentionUtils.ts';
import { PLATFORM_CONFIG } from '../config.ts';

const mockDefaultRules = [
  { id: 'rule-default', ruleType: 'DEFAULT', commissionPercentage: 10, isActive: true, notes: 'Default take rate' },
  { id: 'rule-cat-cleaning', ruleType: 'CATEGORY', targetId: 'cat-cleaning', targetName: 'Deep Cleaning', commissionPercentage: 12, isActive: true, notes: 'Cleaning take rate' },
  { id: 'rule-prov-vip', ruleType: 'PROVIDER', targetId: 'prov-vip', targetName: 'VIP Provider', commissionPercentage: 7, isActive: true, notes: 'VIP Provider override' }
];

test('Commission: new provider promotional tier gives 0%', () => {
  const futurePromo = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const res = resolveCommissionRate({
    categoryId: 'cat-cleaning',
    provider: { id: 'prov-new', promoEndsAt: futurePromo },
    customerId: 'cust-1',
    pricingModel: 'FIXED',
    existingOrders: [],
    commissionRules: mockDefaultRules,
  });

  assert.equal(res.rate, 0);
  assert.equal(res.reason, 'NEW_PROVIDER_PROMO');
});

test('Commission: subscription orders receive 5% default rate', () => {
  const expiredPromo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
  const res = resolveCommissionRate({
    categoryId: 'cat-cleaning',
    provider: { id: 'prov-regular', promoEndsAt: expiredPromo },
    customerId: 'cust-1',
    pricingModel: 'SUBSCRIPTION',
    existingOrders: [],
    commissionRules: mockDefaultRules,
  });

  assert.equal(res.rate, PLATFORM_CONFIG.SUBSCRIPTION_DEFAULT_COMMISSION_RATE);
  assert.equal(res.reason, 'SUBSCRIPTION');
});

test('Commission: repeat customer orders receive 4% rate', () => {
  const expiredPromo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
  const existingOrders = [
    {
      id: 'ord-past-1',
      orderNumber: 'ORD-101',
      customerId: 'cust-repeat',
      providerId: 'prov-regular',
      status: 'COMPLETED',
    }
  ];

  const res = resolveCommissionRate({
    categoryId: 'cat-general',
    provider: { id: 'prov-regular', promoEndsAt: expiredPromo },
    customerId: 'cust-repeat',
    pricingModel: 'FIXED',
    existingOrders: existingOrders,
    commissionRules: mockDefaultRules,
  });

  assert.equal(res.rate, PLATFORM_CONFIG.REPEAT_CUSTOMER_COMMISSION_RATE);
  assert.equal(res.reason, 'REPEAT_CUSTOMER');
});

test('Commission: provider rule override takes precedence over repeat and category', () => {
  const expiredPromo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
  const existingOrders = [
    {
      id: 'ord-past-2',
      orderNumber: 'ORD-102',
      customerId: 'cust-repeat',
      providerId: 'prov-vip',
      status: 'COMPLETED',
    }
  ];

  const res = resolveCommissionRate({
    categoryId: 'cat-cleaning',
    provider: { id: 'prov-vip', promoEndsAt: expiredPromo },
    customerId: 'cust-repeat',
    pricingModel: 'FIXED',
    existingOrders: existingOrders,
    commissionRules: mockDefaultRules,
  });

  // rule-prov-vip sets rate to 7%
  assert.equal(res.rate, 7);
  assert.equal(res.reason, 'PROVIDER_RULE');
});

test('Commission: category rule takes precedence over default', () => {
  const expiredPromo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
  const res = resolveCommissionRate({
    categoryId: 'cat-cleaning',
    provider: { id: 'prov-regular', promoEndsAt: expiredPromo },
    customerId: 'cust-first-time',
    pricingModel: 'FIXED',
    existingOrders: [],
    commissionRules: mockDefaultRules,
  });

  // Category cleaning is 12%
  assert.equal(res.rate, 12);
  assert.equal(res.reason, 'CATEGORY_RULE');
});

test('Commission: platform fallback default', () => {
  const expiredPromo = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
  const res = resolveCommissionRate({
    categoryId: 'cat-other',
    provider: { id: 'prov-regular', promoEndsAt: expiredPromo },
    customerId: 'cust-first-time',
    pricingModel: 'FIXED',
    existingOrders: [],
    commissionRules: mockDefaultRules,
  });

  assert.equal(res.rate, 10);
  assert.equal(res.reason, 'DEFAULT');
});
