export interface WalletBalance {
  residentId: string;
  creditBalance: number;
  lifetimeEarned: number;
  streakCount: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  residentId: string;
  type: 'EARN_3_PERCENT' | 'STREAK_BONUS' | 'REDEMPTION' | 'COMPENSATION' | 'EXPIRY';
  amount: number;
  orderId?: string;
  description: string;
  createdAt: string;
}

export interface IWalletApi {
  getBalance(residentId: string): Promise<WalletBalance>;
  getHistory(residentId: string): Promise<WalletTransaction[]>;
  creditReward(
    residentId: string,
    amount: number,
    orderId: string,
    reason: string,
  ): Promise<WalletTransaction>;
  redeemCredit(
    residentId: string,
    amount: number,
    orderId: string,
  ): Promise<{ success: boolean; amountDeducted: number }>;
}
