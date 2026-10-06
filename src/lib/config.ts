// Central configuration file for platform constants and retention features

export const PLATFORM_CONFIG = {
  // Loyalty wallet
  LOYALTY_EARN_RATE: 0.03, // 3% of subtotal
  LOYALTY_REDEMPTION_CAP_RATIO: 0.20, // max 20% of subtotal can be paid with credits
  LOYALTY_STREAK_INTERVAL: 5, // every 5th completed order
  LOYALTY_STREAK_BONUS: 50, // ₹50 bonus credits

  // Tiered commission & promos
  NEW_PROVIDER_PROMO_DAYS: 60, // 0% commission for first 60 days from verifiedAt
  REPEAT_CUSTOMER_COMMISSION_RATE: 4, // 4% commission if customer has >=1 completed order with provider
  SUBSCRIPTION_DEFAULT_COMMISSION_RATE: 5, // 5% default for subscriptions
  DEFAULT_COMMISSION_RATE: 10, // 10% platform fallback

  // Platform fees
  DEFAULT_ONE_TIME_PLATFORM_FEE: 20, // ₹20 for standard bookings
  DEFAULT_SUBSCRIPTION_PLATFORM_FEE: 0, // ₹0 for subscriptions

  // Guarantee & protection
  GUARANTEE_COMPLAINT_WINDOW_HOURS: 48, // 48 hours post-completion to raise guarantee dispute
  CHAT_READ_ONLY_DAYS_AFTER_COMPLETION: 7, // 7 days after completion chat is read-only
} as const;
