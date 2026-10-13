'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { Complaint } from '@/lib/types';

interface Props {
  complaints: Complaint[];
  onOpenMediation: (comp: Complaint) => void;
  onQuickDismiss: (complaintId: string) => void;
}

export default function AdminDisputesTab({ complaints, onOpenMediation, onQuickDismiss }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Disputes &amp; Escrow Mediation</h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Safeguard society residents with escrow holds and transparent dispute resolution.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {complaints.map((comp) => (
          <div key={comp.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    Ticket #{comp.ticketNumber}
                  </span>
                  <span
                    className={`badge ${comp.status === 'RESOLVED' ? 'badge-emerald' : 'badge-rose'}`}
                  >
                    {comp.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.825rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                  }}
                >
                  Resident: <strong>{comp.customerName}</strong> • Provider:{' '}
                  <strong>{comp.providerName}</strong> • Order #{comp.orderNumber}
                </div>
              </div>
            </div>

            <div
              style={{
                margin: '12px 0',
                background: 'var(--bg-subtle)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Reason: {comp.category}
              </div>
              <p style={{ color: 'var(--text-muted)' }}>{comp.description}</p>
            </div>

            {comp.adminNotes && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}
              >
                <strong>Operations Log:</strong> {comp.adminNotes}
              </div>
            )}

            {comp.status !== 'RESOLVED' ? (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => onOpenMediation(comp)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ShieldCheck size={14} /> Open Mediation &amp; Escrow Desk
                </button>
                <button
                  type="button"
                  onClick={() => onQuickDismiss(comp.id)}
                  className="btn btn-secondary btn-sm"
                >
                  Quick Dismiss / Settle
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--accent-emerald)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 size={15} />
                    {comp.resolutionType === 'FULL_REFUND'
                      ? '100% Escrow Refund Issued'
                      : comp.resolutionType === 'PARTIAL_REFUND'
                        ? `Partial Escrow Refund (₹${comp.refundAmount || 0})`
                        : comp.resolutionType === 'FREE_REWORK'
                          ? 'Free Provider Rework Mandated'
                          : 'Mediated & Closed'}
                  </span>
                  {comp.resolvedAt && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Closed {new Date(comp.resolvedAt).toLocaleDateString()} by{' '}
                      {comp.resolvedBy || 'Admin Desk'}
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>{comp.resolution}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
