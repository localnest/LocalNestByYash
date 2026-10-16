'use client';

import React, { useState } from 'react';
import type { CommissionRule, PlatformFeeRules } from '@/lib/types';

interface Props {
  commissionRules: CommissionRule[];
  updateCommissionRule: (ruleId: string, percentage: number) => void;
  platformFeeRules?: PlatformFeeRules;
  updatePlatformFeeRules: (rules: PlatformFeeRules) => void;
}

export default function AdminCommissionTab({
  commissionRules,
  updateCommissionRule,
  platformFeeRules,
  updatePlatformFeeRules,
}: Props) {
  const [oneTimeFeeInput, setOneTimeFeeInput] = useState(platformFeeRules?.oneTimeFee ?? 20);
  const [subFeeInput, setSubFeeInput] = useState(platformFeeRules?.subscriptionFee ?? 10);
  const [feeSaveSuccess, setFeeSaveSuccess] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          Platform Take-Rate & Commission Rules
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Configure platform commissions without hardcoding. Supports default, category overrides,
          and service tiers.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '16px',
        }}
      >
        {commissionRules.map((rule) => (
          <div key={rule.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                {rule.ruleType} TIER
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)' }}>
                {rule.commissionPercentage}%
              </span>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '8px' }}>
              {rule.targetName || 'Platform Default Take Rate'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {rule.notes}
            </p>

            <div
              style={{
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Adjust Rate (%):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={rule.commissionPercentage}
                onChange={(e) => updateCommissionRule(rule.id, Number(e.target.value))}
                className="form-input"
                style={{ width: '80px', padding: '6px 8px' }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-emerald)',
                  fontWeight: 600,
                }}
              >
                ✓ Applied to live orders
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Fee Rules Card */}
      <div className="card" style={{ marginTop: '10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Society Convenience Fee Settings
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Hyperlocal operations convenience fee charged per resident transaction to maintain
              gate verification.
            </p>
          </div>
          {feeSaveSuccess && (
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
              {feeSaveSuccess}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <label
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Standard One-Time Order Platform Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={oneTimeFeeInput}
              onChange={(e) => setOneTimeFeeInput(Number(e.target.value))}
              className="form-input"
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Active platform rate: ₹{platformFeeRules?.oneTimeFee ?? 20}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <label
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Subscription Recurring Order Platform Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={subFeeInput}
              onChange={(e) => setSubFeeInput(Number(e.target.value))}
              className="form-input"
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Active platform rate: ₹{platformFeeRules?.subscriptionFee ?? 10}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              updatePlatformFeeRules({
                oneTimeFee: Number(oneTimeFeeInput),
                subscriptionFee: Number(subFeeInput),
              });
              setFeeSaveSuccess('Platform fee rates saved and applied live!');
              setTimeout(() => setFeeSaveSuccess(''), 3500);
            }}
            className="btn btn-primary btn-sm"
          >
            Save Platform Fee Rules
          </button>
        </div>
      </div>
    </div>
  );
}
