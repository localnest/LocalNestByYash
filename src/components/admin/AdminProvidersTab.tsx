'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import type { Provider, Society, ProviderStatus } from '@/lib/types';
import { getCoveredSocieties } from '@/lib/geo';

interface Props {
  providers: Provider[];
  societies: Society[];
  onUpdateStatus: (providerId: string, status: ProviderStatus) => void;
  onEditCoverage: (prov: Provider) => void;
}

export default function AdminProvidersTab({
  providers,
  societies,
  onUpdateStatus,
  onEditCoverage,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            Provider Verification &amp; Quality Desk
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Approve, review documentation, or suspend provider accounts to safeguard resident trust.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '16px',
        }}
      >
        {providers.map((prov) => {
          const isPending = prov.status === 'PENDING' || prov.status === 'UNDER_REVIEW';
          const isVerified = prov.status === 'VERIFIED';
          const coveredCount = getCoveredSocieties(prov, societies).length;
          const coveredNames = getCoveredSocieties(prov, societies)
            .map((s) => s.name)
            .join(', ');

          return (
            <div
              key={prov.id}
              className="card"
              style={{
                borderLeft: isVerified
                  ? '4px solid var(--accent-emerald)'
                  : '4px solid var(--accent-amber)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <span
                    className={`badge ${isVerified ? 'badge-emerald' : 'badge-amber'}`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {prov.status}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>
                    {prov.businessName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Phone: {prov.phone}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '10px 0' }}>
                {prov.description}
              </p>

              {/* Service Area & Coverage Info */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  margin: '10px 0',
                  fontSize: '0.78rem',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                    SERVICE AREA &amp; COVERAGE:
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditCoverage(prov)}
                    style={{
                      color: 'var(--primary)',
                      fontWeight: 700,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.72rem',
                    }}
                  >
                    Adjust Radius ⚙️
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div>
                    📍 <strong>Base:</strong> {prov.baseLocation?.label || 'Whitefield Central'} (
                    {prov.baseLocation?.pincode || '560066'})
                  </div>
                  <div>
                    📏 <strong>Radius:</strong> {prov.maxServiceDistanceKm || 10} km (
                    {prov.coverageMode || 'RADIUS'} Mode) • Cap:{' '}
                    {prov.maxOrdersPerDay ? `${prov.maxOrdersPerDay}/day` : 'None'}
                  </div>
                  <div>
                    🏢 <strong>Covers {coveredCount} Societies:</strong> {coveredNames || 'None'}
                  </div>
                  {prov.travelChargePerKm ? (
                    <div style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                      🚗 Travel fee: ₹{prov.travelChargePerKm}/km past{' '}
                      {prov.freeServiceRadiusKm || 0}km (Max: ₹{prov.maxTravelCharge})
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Documents */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  margin: '10px 0',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  DOCUMENTS SUBMITTED:
                </div>
                {prov.documents && prov.documents.length > 0 ? (
                  prov.documents.map((d) => (
                    <div
                      key={d.type}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '2px',
                      }}
                    >
                      <span>📄 {d.type}</span>
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        Submitted
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>No digital ID docs uploaded yet.</div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {isPending && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(prov.id, 'VERIFIED')}
                      className="btn btn-primary btn-sm"
                      style={{ flex: '1 1 140px', minHeight: '44px' }}
                    >
                      <Check size={14} /> Verify &amp; Approve
                    </button>
                    <button
                      onClick={() => onUpdateStatus(prov.id, 'REJECTED')}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--accent-rose)', flex: '1 1 100px', minHeight: '44px' }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}

                {isVerified && (
                  <button
                    onClick={() => onUpdateStatus(prov.id, 'SUSPENDED')}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--accent-rose)', flex: '1 1 140px', minHeight: '44px' }}
                  >
                    Suspend Account
                  </button>
                )}

                {prov.status === 'SUSPENDED' && (
                  <button
                    onClick={() => onUpdateStatus(prov.id, 'VERIFIED')}
                    className="btn btn-primary btn-sm"
                    style={{ flex: '1 1 140px', minHeight: '44px' }}
                  >
                    Reactivate Provider
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
