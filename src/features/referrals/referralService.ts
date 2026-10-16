export interface ReferralRecord {
  referralCode: string;
  referrerUserId: string;
  refereeUserId: string;
  refereeFirstOrderId?: string;
  rewardStatus: 'PENDING' | 'REWARDED' | 'EXPIRED';
  referrerCreditAmount: number; // default ₹100
  refereeCreditAmount: number; // default ₹50
  createdAt: string;
  rewardedAt?: string;
}

export const REFERRAL_CONSTANTS = {
  REFERRER_BONUS: 100, // ₹100 wallet credit
  REFEREE_DISCOUNT: 50, // ₹50 off on first order
  MIN_ORDER_VALUE: 200, // Minimum order value to qualify
} as const;

/**
 * Generates an alphanumeric referral code from the user's name and ID.
 * e.g., "PRIYA-4819"
 */
export function generateReferralCode(name: string, userId: string): string {
  const cleanName = (name || 'NEST')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 5);
  const suffix = userId
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-4)
    .toUpperCase();
  return `${cleanName}-${suffix || '1024'}`;
}

/**
 * Attributes a referral code to a new resident registration.
 */
export function attributeReferral(
  referralCode: string,
  refereeUserId: string,
  allReferralCodes: Record<string, string>, // code -> referrerUserId mapping
): { valid: boolean; referrerUserId?: string; error?: string } {
  const normalizedCode = referralCode.trim().toUpperCase();
  const referrerUserId = allReferralCodes[normalizedCode];

  if (!referrerUserId) {
    return { valid: false, error: 'INVALID_CODE: Referral code not found.' };
  }

  if (referrerUserId === refereeUserId) {
    return { valid: false, error: 'SELF_REFERRAL: You cannot use your own referral code.' };
  }

  return { valid: true, referrerUserId };
}

/**
 * Awards referral credits upon completion of referee's first qualifying order (Rule N09.4).
 */
export function awardReferralCredits(
  referral: ReferralRecord,
  orderSubtotal: number,
  orderStatus: string,
): { qualified: boolean; referrerBonus: number; refereeBonus: number; reason?: string } {
  if (referral.rewardStatus === 'REWARDED') {
    return { qualified: false, referrerBonus: 0, refereeBonus: 0, reason: 'ALREADY_REWARDED' };
  }

  if (orderStatus !== 'COMPLETED') {
    return { qualified: false, referrerBonus: 0, refereeBonus: 0, reason: 'ORDER_NOT_COMPLETED' };
  }

  if (orderSubtotal < REFERRAL_CONSTANTS.MIN_ORDER_VALUE) {
    return {
      qualified: false,
      referrerBonus: 0,
      refereeBonus: 0,
      reason: `MIN_ORDER_NOT_MET: Minimum order subtotal is ₹${REFERRAL_CONSTANTS.MIN_ORDER_VALUE}`,
    };
  }

  return {
    qualified: true,
    referrerBonus: referral.referrerCreditAmount || REFERRAL_CONSTANTS.REFERRER_BONUS,
    refereeBonus: referral.refereeCreditAmount || REFERRAL_CONSTANTS.REFEREE_DISCOUNT,
  };
}

/**
 * Generates the WhatsApp share text link.
 */
export function generateWhatsAppShareLink(
  referralCode: string,
  societyName = 'Greenfield Heights',
): string {
  const message = `Hey neighbor! Join our society services on LocalNest for ${societyName}. Use my code *${referralCode}* to get ₹50 OFF your first home repair, cleaning, or laundry order! https://localnest.in?ref=${referralCode}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
