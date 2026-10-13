import type { IWalletApi, WalletBalance, WalletTransaction } from './port.ts';

export class MockWalletAdapter implements IWalletApi {
  private balances = new Map<string, WalletBalance>();
  private history = new Map<string, WalletTransaction[]>();

  async getBalance(residentId: string): Promise<WalletBalance> {
    if (!this.balances.has(residentId)) {
      this.balances.set(residentId, {
        residentId,
        creditBalance: 150,
        lifetimeEarned: 350,
        streakCount: 2,
        currency: 'INR',
      });
    }
    return this.balances.get(residentId)!;
  }

  async getHistory(residentId: string): Promise<WalletTransaction[]> {
    return (
      this.history.get(residentId) || [
        {
          id: 'tx-1',
          residentId,
          type: 'EARN_3_PERCENT',
          amount: 45,
          orderId: 'ord-101',
          description: '3% reward for Cook service booking',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'tx-2',
          residentId,
          type: 'STREAK_BONUS',
          amount: 50,
          description: 'Society loyalty streak bonus',
          createdAt: new Date().toISOString(),
        },
      ]
    );
  }

  async creditReward(
    residentId: string,
    amount: number,
    orderId: string,
    reason: string,
  ): Promise<WalletTransaction> {
    const bal = await this.getBalance(residentId);
    bal.creditBalance += amount;
    bal.lifetimeEarned += amount;

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      residentId,
      type: 'EARN_3_PERCENT',
      amount,
      orderId,
      description: reason,
      createdAt: new Date().toISOString(),
    };

    const currentHistory = this.history.get(residentId) || [];
    this.history.set(residentId, [tx, ...currentHistory]);
    return tx;
  }

  async redeemCredit(
    residentId: string,
    amount: number,
    orderId: string,
  ): Promise<{ success: boolean; amountDeducted: number }> {
    const bal = await this.getBalance(residentId);
    if (bal.creditBalance < amount) {
      return { success: false, amountDeducted: 0 };
    }
    bal.creditBalance -= amount;

    const tx: WalletTransaction = {
      id: `tx-red-${Date.now()}`,
      residentId,
      type: 'REDEMPTION',
      amount: -amount,
      orderId,
      description: `Redeemed on order ${orderId}`,
      createdAt: new Date().toISOString(),
    };

    const currentHistory = this.history.get(residentId) || [];
    this.history.set(residentId, [tx, ...currentHistory]);

    return { success: true, amountDeducted: amount };
  }
}
