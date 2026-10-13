'use client';

import React from 'react';
import { Wallet, Sparkles, Flame } from 'lucide-react';

interface WalletRewardsCardProps {
  creditBalance: number;
  lifetimeEarned: number;
  streakCount: number;
  onOpenHistory?: () => void;
}

export default function WalletRewardsCard({
  creditBalance,
  lifetimeEarned,
  streakCount,
  onOpenHistory,
}: WalletRewardsCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-800/40 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-semibold text-white">Society Wallet & Rewards</h3>
            <span className="bg-teal-950/80 border border-teal-700/60 text-teal-300 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-400" /> 3% Cashback
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Earn 3% credits automatically on every society home service booking.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Available Balance</span>
            <span className="text-2xl font-bold text-teal-300">₹{creditBalance}</span>
          </div>

          <div className="border-l border-slate-800 pl-4 text-left">
            <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{streakCount} orders streak</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Lifetime: ₹{lifetimeEarned} earned
            </span>
          </div>

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl transition-colors font-medium"
            >
              Passbook
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
