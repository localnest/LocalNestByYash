export type WalletTxType =
  'EARN_3_PERCENT' | 'STREAK_BONUS' | 'REDEMPTION' | 'COMPENSATION' | 'EXPIRY' | 'REFUND';

export interface WalletRecord {
  residentId: string;
  balance: number;
  lifetimeEarned: number;
  streakCount: number;
  currency: string;
}
