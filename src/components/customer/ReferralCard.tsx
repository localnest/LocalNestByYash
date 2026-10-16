'use client';

import React, { useState } from 'react';
import { Gift, Share2, Copy, Check, Users } from 'lucide-react';
import {
  generateReferralCode,
  generateWhatsAppShareLink,
} from '@/features/referrals/referralService';

interface ReferralCardProps {
  userName: string;
  userId: string;
  societyName?: string;
}

export default function ReferralCard({
  userName,
  userId,
  societyName = 'Greenfield Heights',
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const code = generateReferralCode(userName, userId);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const url = generateWhatsAppShareLink(code, societyName);
    window.open(url, '_blank');
  };

  return (
    <div
      className="card"
      style={{
        background:
          'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
        border: '1px solid rgba(13, 148, 136, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(13, 148, 136, 0.15)',
              color: 'var(--primary)',
              padding: '3px 10px',
              borderRadius: '16px',
              fontSize: '0.72rem',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            <Gift size={13} />
            Neighbor Referral Program
          </div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 4px',
            }}
          >
            Give ₹50, Get ₹100 Credits
          </h3>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              margin: 0,
              maxWidth: '420px',
              lineHeight: 1.5,
            }}
          >
            Invite friends in {societyName}. They get ₹50 off their first service, and you get ₹100
            credited to your LocalNest wallet!
          </p>
        </div>

        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <Users size={20} />
        </div>
      </div>

      {/* Code Box & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '2px dashed var(--primary)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Your Code:
          </span>
          <span
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--primary)',
            }}
          >
            {code}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="btn btn-primary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#25D366',
            borderColor: '#25D366',
            color: '#fff',
          }}
        >
          <Share2 size={14} />
          Share on WhatsApp
        </button>
      </div>
    </div>
  );
}
