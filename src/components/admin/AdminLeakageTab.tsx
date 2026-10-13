'use client';

import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import type { ChatMessage, Order } from '@/lib/types';

interface Props {
  chatMessages: ChatMessage[];
  orders: Order[];
  markFlaggedReviewed: (id: string) => void;
}

export default function AdminLeakageTab({ chatMessages, orders, markFlaggedReviewed }: Props) {
  const pendingCount = chatMessages.filter(
    (m) => m.isFlagged && !m.flaggedReason?.startsWith('[REVIEWED]'),
  ).length;

  const totalFlaggedCount = chatMessages.filter((m) => m.isFlagged).length;
  const cleanCount = chatMessages.filter((m) => !m.isFlagged).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            Anti-Bypass &amp; Leakage Detection Hub
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Real-time audit log of in-app chat messages intercepted for phone numbers, emails, URLs,
            or off-platform payment attempts.
          </p>
        </div>
        <span className="badge badge-amber" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          {pendingCount} Pending Review
        </span>
      </div>

      {/* Quick Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            TOTAL BLOCKED MESSAGES
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--accent-rose)',
              marginTop: '4px',
            }}
          >
            {totalFlaggedCount}
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            UNAUDITED LEAKAGE ALERTS
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--accent-amber)',
              marginTop: '4px',
            }}
          >
            {pendingCount}
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            CLEAN IN-APP MESSAGES
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--accent-emerald)',
              marginTop: '4px',
            }}
          >
            {cleanCount}
          </div>
        </div>
      </div>

      {/* Filtered Messages List */}
      {totalFlaggedCount === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ShieldCheck size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>No Leakage Attempts Detected</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            All resident and provider communications comply with platform safety rules.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chatMessages
            .filter((m) => m.isFlagged)
            .map((msg) => {
              const isReviewed = msg.flaggedReason?.startsWith('[REVIEWED]');
              const order = orders.find((o) => o.id === msg.orderId);
              return (
                <div
                  key={msg.id}
                  className="card"
                  style={{
                    borderLeft: `4px solid ${isReviewed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className={`badge ${isReviewed ? 'badge-emerald' : 'badge-rose'}`}
                        style={{ fontSize: '0.68rem' }}
                      >
                        {isReviewed ? 'AUDITED' : 'FLAGGED / BLOCKED'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        Order: {order?.orderNumber || msg.orderId}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        • {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>
                        Role: {msg.senderRole}
                      </span>
                      {!isReviewed && (
                        <button
                          type="button"
                          onClick={() => markFlaggedReviewed(msg.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        >
                          <Check size={12} /> Mark Reviewed
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      INTERCEPTED MESSAGE CONTENT:
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--accent-rose)',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                      }}
                    >
                      &quot;{msg.flaggedReason?.replace('[REVIEWED] ', '')}&quot;
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ⚠️ System Action: Redacted from counterparty as <code>[BLOCKED]</code> to
                    enforce platform trust &amp; safety.
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
