'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { Service } from '@/lib/types';

interface Props {
  providerServices: Service[];
  onAddService: () => void;
}

export default function ProviderServicesTab({ providerServices, onAddService }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Your Service Offerings</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Configure your pricing models: Fixed, Hourly, Per-Item, Subscriptions, or Inspection.
          </p>
        </div>
        <button type="button" onClick={onAddService} className="btn btn-primary btn-sm">
          <Plus size={16} /> Add New Service
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {providerServices.map((service) => (
          <div key={service.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                  Model: {service.pricingModel.replace('_', ' ')}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>
                  {service.name}
                </h4>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                ₹{service.basePrice}{' '}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  /{service.unitName}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '10px 0' }}>
              {service.description}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '10px',
                fontSize: '0.75rem',
              }}
            >
              <span
                style={{
                  color: service.isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                ● {service.isActive ? 'Active on Marketplace' : 'Paused'}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                Edit Pricing
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
