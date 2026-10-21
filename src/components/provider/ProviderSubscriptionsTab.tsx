'use client';

import React from 'react';
import { Repeat } from 'lucide-react';
import type { Subscription } from '@/lib/types';

interface Props {
  providerSubscriptions: Subscription[];
  checkedManifestIds: string[];
  onToggleCheck: (subscriptionId: string) => void;
}

export default function ProviderSubscriptionsTab({
  providerSubscriptions,
  checkedManifestIds,
  onToggleCheck,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Recurring Resident Subscriptions</h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Society residents subscribed to your recurring daily tiffin, laundry pickup, or car wash
          plans.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
          gap: '14px',
        }}
      >
        {providerSubscriptions.map((sub) => {
          const isDelivered = checkedManifestIds.includes(sub.id);
          return (
            <div key={sub.id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                    {sub.frequency.replace('_', ' ')}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>
                    {sub.customerName}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {sub.customerFlat}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{sub.monthlyPrice}/mo
                </div>
              </div>

              <div
                style={{
                  margin: '12px 0',
                  background: 'var(--bg-subtle)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  Time Slot: <strong>{sub.scheduledTimeSlot}</strong>
                </div>
                <div>
                  Next Fulfillment: <strong>{sub.nextServiceDate}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => onToggleCheck(sub.id)}
                  className={`btn btn-sm ${isDelivered ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {isDelivered ? '✓ Delivered Today' : 'Mark Delivered for Today'}
                </button>
              </div>
            </div>
          );
        })}

        {providerSubscriptions.length === 0 && (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '36px',
              color: 'var(--text-muted)',
              gridColumn: '1 / -1',
            }}
          >
            <Repeat size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p>No active subscriptions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
