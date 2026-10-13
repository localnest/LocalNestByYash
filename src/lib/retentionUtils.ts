import { PLATFORM_CONFIG } from './config.ts';
import type { CommissionReason, CommissionRule, Order, PricingModel, Provider } from './types.ts';

// Contact-detail filter patterns
export const CONTACT_FILTER_PATTERNS = [
  /\d[\d\s\-().]{6,}\d/, // 7+ digit phone numbers (spaced/hyphenated)
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // emails
  /https?:\/\/\S+/i, // URLs
  /www\.\S+/i, // www URLs
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
  categoryRate?: number;
  monetization?: 'COMMISSION' | 'MEMBERSHIP';
  provider?: Pick<Provider, 'id' | 'promoEndsAt' | 'verifiedAt'> | null;
  customerId: string;
  pricingModel: PricingModel;
  existingOrders: Order[];
  commissionRules: CommissionRule[];
}): { rate: number; reason: CommissionReason } {
  const { categoryId, categoryRate, monetization, commissionRules } = params;

  if (monetization === 'MEMBERSHIP') return { rate: 0, reason: 'MEMBERSHIP_TIER' };

  const catRule = commissionRules.find(
    (r) => r.ruleType === 'CATEGORY' && r.targetId === categoryId && r.isActive,
  );
  if (catRule) return { rate: catRule.commissionPercentage, reason: 'CATEGORY_RULE' };
  if (categoryRate !== undefined) return { rate: categoryRate, reason: 'CATEGORY_RULE' };

  const defaultRule = commissionRules.find((r) => r.ruleType === 'DEFAULT' && r.isActive);
  return {
    rate: defaultRule ? defaultRule.commissionPercentage : PLATFORM_CONFIG.DEFAULT_COMMISSION_RATE,
    reason: 'DEFAULT',
  };
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
  return (
    completedOrderCount > 0 && completedOrderCount % PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL === 0
  );
}
