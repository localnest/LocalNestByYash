'use client';

import React from 'react';
import { AlertCircle, Bell, Info } from 'lucide-react';
import type { SocietyNotice } from '@/lib/types';

interface SocietyNoticeBannerProps {
  notices: SocietyNotice[];
}

export default function SocietyNoticeBanner({ notices }: SocietyNoticeBannerProps) {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {notices.slice(0, 2).map((notice) => {
        const isUrgent = notice.priority === 'URGENT';
        return (
          <div
            key={notice.id}
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
              isUrgent
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : 'bg-slate-900/80 border-slate-800 text-slate-200'
            }`}
          >
            {isUrgent ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : notice.type === 'ALERT' ? (
              <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold">{notice.title}</h4>
                <span className="text-[10px] text-slate-400">
                  {notice.societyName} • {notice.authorName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{notice.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
