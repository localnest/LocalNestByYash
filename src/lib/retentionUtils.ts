import { PLATFORM_CONFIG } from './config.ts';
import type { CommissionReason, CommissionRule, Order, PricingModel, Provider } from './types.ts';

// Contact-detail filter patterns
export const CONTACT_FILTER_PATTERNS = [
  /\d[\d\s\-().]{6,}\d/,                    // 7+ digit phone numbers (spaced/hyphenated)
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // emails
  /https?:\/\/\S+/i,                          // URLs
  /www\.\S+/i,                                // www URLs
  /call me/i,
  /whatsapp/i,
  /pay directly/i,
  /pay outside/i,
  /offline payment/i,
  /direct payment/i,
];

export function filterContactDetails(text: string): { blocked: boolean; reason?: string } {
  for (const pattern of CONTACT_FILTER_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason: pattern.source };
    }
  }
  return { blocked: false };
}

// Tiered commission calculation
export function resolveCommissionRate(params: {
  categoryId?: string;
  provider?: Pick<Provider, 'id' | 'promoEndsAt' | 'verifiedAt'> | null;
  customerId: string;
  pricingModel: PricingModel;
  existingOrders: Order[];
  commissionRules: CommissionRule[];
}): { rate: number; reason: CommissionReason } {
  const { categoryId, provider, customerId, pricingModel, existingOrders, commissionRules } = params;

  // 1. New provider promo (0% for first 60 days)
  if (provider?.promoEndsAt && new Date() < new Date(provider.promoEndsAt)) {
    return { rate: 0, reason: 'NEW_PROVIDER_PROMO' };
  }
  if (provider?.verifiedAt && !provider.promoEndsAt) {
    const daysSinceVerified = (Date.now() - new Date(provider.verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceVerified <= PLATFORM_CONFIG.NEW_PROVIDER_PROMO_DAYS) {
      return { rate: 0, reason: 'NEW_PROVIDER_PROMO' };
    }
  }

  // 2. Subscription default rate (5%)
  if (pricingModel === 'SUBSCRIPTION') {
    const providerRule = commissionRules.find(r => r.ruleType === 'PROVIDER' && r.targetId === provider?.id && r.isActive);
    if (providerRule) return { rate: providerRule.commissionPercentage, reason: 'PROVIDER_RULE' };
    return { rate: PLATFORM_CONFIG.SUBSCRIPTION_DEFAULT_COMMISSION_RATE, reason: 'SUBSCRIPTION' };
  }

  // 3. Repeat customer rate (4%) — if customer has >= 1 completed order with this provider
  const hasRepeatOrder = existingOrders.some(
    o => o.customerId === customerId && o.providerId === provider?.id && o.status === 'COMPLETED'
  );
  if (hasRepeatOrder) {
    const providerRule = commissionRules.find(r => r.ruleType === 'PROVIDER' && r.targetId === provider?.id && r.isActive);
    if (providerRule) return { rate: providerRule.commissionPercentage, reason: 'PROVIDER_RULE' };
    return { rate: PLATFORM_CONFIG.REPEAT_CUSTOMER_COMMISSION_RATE, reason: 'REPEAT_CUSTOMER' };
  }

  // 4. Provider rule
  const providerRule = commissionRules.find(r => r.ruleType === 'PROVIDER' && r.targetId === provider?.id && r.isActive);
  if (providerRule) return { rate: providerRule.commissionPercentage, reason: 'PROVIDER_RULE' };

  // 5. Category rule
  const catRule = commissionRules.find(r => r.ruleType === 'CATEGORY' && r.targetId === categoryId && r.isActive);
  if (catRule) return { rate: catRule.commissionPercentage, reason: 'CATEGORY_RULE' };

  // 6. Default
  const defaultRule = commissionRules.find(r => r.ruleType === 'DEFAULT' && r.isActive);
  return { rate: defaultRule ? defaultRule.commissionPercentage : PLATFORM_CONFIG.DEFAULT_COMMISSION_RATE, reason: 'DEFAULT' };
}

// Wallet loyalty helpers
export function calculateEarnedCredits(subtotal: number): number {
  return Math.round(subtotal * PLATFORM_CONFIG.LOYALTY_EARN_RATE);
}

export function calculateMaxRedeemableCredits(subtotal: number, balance: number): number {
  const maxAllowed = Math.floor(subtotal * PLATFORM_CONFIG.LOYALTY_REDEMPTION_CAP_RATIO);
  return Math.max(0, Math.min(balance, maxAllowed));
}

export function isStreakBonusEligible(completedOrderCount: number): boolean {
  return completedOrderCount > 0 && completedOrderCount % PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL === 0;
}
