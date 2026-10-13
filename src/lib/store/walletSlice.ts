import { useState } from 'react';

export interface WalletState {
  balance: number;
  lifetimeEarned: number;
  streakCount: number;
}

export function useWalletSlice() {
  const [wallet, setWallet] = useState<WalletState>({
    balance: 150,
    lifetimeEarned: 350,
    streakCount: 2,
  });

  const creditReward = (amount: number) => {
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      lifetimeEarned: prev.lifetimeEarned + amount,
    }));
  };

  const debitCredit = (amount: number): boolean => {
    if (wallet.balance < amount) return false;
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance - amount,
    }));
    return true;
  };

  return {
    wallet,
    creditReward,
    debitCredit,
  };
}
