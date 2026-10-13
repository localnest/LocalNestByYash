'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { Society, Provider } from '@/lib/types';

interface Props {
  societies: Society[];
  providers: Provider[];
  onAddSociety: () => void;
}

export default function AdminSocietiesTab({ societies, providers, onAddSociety }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Multi-Society Scaling Network</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Expand from Greenfield Heights (1,790 flats pilot) to adjacent communities and cities.
          </p>
        </div>
        <button type="button" onClick={onAddSociety} className="btn btn-primary btn-sm">
          <Plus size={16} /> Onboard New Society
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '16px',
        }}
      >
        {societies.map((soc) => (
          <div key={soc.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                  Active Network Node
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px' }}>
                  {soc.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {soc.addressLine}, {soc.city}
                </div>
              </div>
            </div>

            <div
              style={{
                margin: '14px 0',
                background: 'var(--bg-subtle)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Flats:</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  {soc.totalFlats.toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Providers Serving:</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                  {providers.filter((p) => p.supportedSocieties.includes(soc.id)).length}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '10px',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Pincode: {soc.pincode}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
