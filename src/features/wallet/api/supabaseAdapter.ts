import { IWalletApi, WalletBalance, WalletTransaction } from './port.ts';
import { getSupabaseConfig } from '../../../lib/supabaseClient.ts';

export class SupabaseWalletAdapter implements IWalletApi {
  private config = getSupabaseConfig();

  async getBalance(residentId: string): Promise<WalletBalance> {
    if (!this.config.isLive) {
      return {
        residentId,
        creditBalance: 0,
        lifetimeEarned: 0,
        streakCount: 0,
        currency: 'INR',
      };
    }
    try {
      const res = await fetch(
        `${this.config.url}/rest/v1/wallet_balances?resident_id=eq.${residentId}&select=*`,
        {
          headers: {
            apikey: this.config.anonKey,
            Authorization: `Bearer ${this.config.anonKey}`,
          },
        },
      );
      if (!res.ok) throw new Error('Failed to fetch balance');
      const rows = await res.json();
      if (!rows || rows.length === 0) {
        return { residentId, creditBalance: 0, lifetimeEarned: 0, streakCount: 0, currency: 'INR' };
      }
      const row = rows[0];
      return {
        residentId,
        creditBalance: row.credit_balance || 0,
        lifetimeEarned: row.lifetime_earned || 0,
        streakCount: row.streak_count || 0,
        currency: 'INR',
      };
    } catch {
      return { residentId, creditBalance: 0, lifetimeEarned: 0, streakCount: 0, currency: 'INR' };
    }
  }

  async getHistory(residentId: string): Promise<WalletTransaction[]> {
    if (!this.config.isLive) return [];
    try {
      const res = await fetch(
        `${this.config.url}/rest/v1/wallet_transactions?resident_id=eq.${residentId}&order=created_at.desc`,
        {
          headers: {
            apikey: this.config.anonKey,
            Authorization: `Bearer ${this.config.anonKey}`,
          },
        },
      );
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        residentId: String(r.resident_id),
        type: r.type as WalletTransaction['type'],
        amount: Number(r.amount),
        orderId: r.order_id ? String(r.order_id) : undefined,
        description: String(r.description || ''),
        createdAt: String(r.created_at),
      }));
    } catch {
      return [];
    }
  }

  async creditReward(
    residentId: string,
    amount: number,
    orderId: string,
    reason: string,
  ): Promise<WalletTransaction> {
    if (!this.config.isLive) {
      return {
        id: `tx-${Date.now()}`,
        residentId,
        type: 'EARN_3_PERCENT',
        amount,
        orderId,
        description: reason,
        createdAt: new Date().toISOString(),
      };
    }
    const res = await fetch(`${this.config.url}/rest/v1/rpc/credit_wallet_reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.config.anonKey,
        Authorization: `Bearer ${this.config.anonKey}`,
      },
      body: JSON.stringify({
        p_resident_id: residentId,
        p_amount: amount,
        p_order_id: orderId,
        p_reason: reason,
      }),
    });
    if (!res.ok) throw new Error('Failed to credit reward');
    return await res.json();
  }

  async redeemCredit(
    residentId: string,
    amount: number,
    orderId: string,
  ): Promise<{ success: boolean; amountDeducted: number }> {
    if (!this.config.isLive) return { success: false, amountDeducted: 0 };
    const res = await fetch(`${this.config.url}/rest/v1/rpc/redeem_wallet_credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.config.anonKey,
        Authorization: `Bearer ${this.config.anonKey}`,
      },
      body: JSON.stringify({
        p_resident_id: residentId,
        p_amount: amount,
        p_order_id: orderId,
      }),
    });
    return { success: res.ok, amountDeducted: res.ok ? amount : 0 };
  }
}
