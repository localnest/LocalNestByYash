'use client';

import React from 'react';
import type { Society, Category, Provider, SocietyServiceRequest } from '@/lib/types';
import { isSocietyCovered } from '@/lib/geo';

interface Props {
  societies: Society[];
  categories: Category[];
  providers: Provider[];
  serviceRequests: SocietyServiceRequest[];
  onNavigateToProviders: () => void;
}

export default function AdminCoverageTab({
  societies,
  categories,
  providers,
  serviceRequests,
  onNavigateToProviders,
}: Props) {
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
            Society Supply Gap &amp; Coverage Matrix
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Identifies society clusters with zero verified providers per category so operations can
            proactively recruit partners.
          </p>
        </div>
        <span className="badge badge-emerald" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          {societies.length} Societies • {categories.length} Categories Monitored
        </span>
      </div>

      {/* Resident Demand Signals */}
      {serviceRequests.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              📢 Outstanding Resident Demand Requests ({serviceRequests.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {serviceRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <strong>{req.categoryName}</strong> requested by resident in{' '}
                  <strong>{req.societyName}</strong>
                </div>
                <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                  Pending Recruitment
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Table */}
      <div
        className="card table-responsive"
        style={{ overflowX: 'auto', minWidth: 0, maxWidth: '100%' }}
      >
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
          Cluster Coverage Breakdown
        </h3>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              minWidth: '600px',
              borderCollapse: 'collapse',
              fontSize: '0.825rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border-light)',
                  textAlign: 'left',
                  color: 'var(--text-muted)',
                }}
              >
                <th style={{ padding: '10px 12px' }}>Society / Cluster</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Active Providers</th>
                <th style={{ padding: '10px 12px' }}>Supply Status</th>
                <th style={{ padding: '10px 12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {societies.flatMap((soc) =>
                categories.map((cat) => {
                  const coveringProviders = providers.filter(
                    (p) =>
                      p.status === 'VERIFIED' &&
                      p.categoryId === cat.id &&
                      isSocietyCovered(p, soc, societies),
                  );
                  const hasSupply = coveringProviders.length > 0;
                  const hasDemand = serviceRequests.some(
                    (r) => r.societyId === soc.id && r.categoryId === cat.id,
                  );

                  return (
                    <tr
                      key={`${soc.id}-${cat.id}`}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {soc.name}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {soc.locality || soc.city}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{cat.name}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {hasSupply ? (
                          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                            {coveringProviders.map((p) => p.businessName).join(', ')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
                            0 verified partners
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {hasSupply ? (
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                            Covered ({coveringProviders.length})
                          </span>
                        ) : (
                          <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                            Supply Gap!
                          </span>
                        )}
                        {hasDemand ? (
                          <span
                            className="badge badge-amber"
                            style={{ fontSize: '0.65rem', marginLeft: '4px' }}
                          >
                            Resident Request Logged
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {!hasSupply ? (
                          <button
                            type="button"
                            onClick={onNavigateToProviders}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                          >
                            Recruit / Verify
                          </button>
                        ) : (
                          <span style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem' }}>
                            ✓ Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
