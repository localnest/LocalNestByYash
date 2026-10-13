'use client';

import React from 'react';
import { Printer, FileSpreadsheet } from 'lucide-react';

interface ManifestItem {
  id: string;
  type: 'ORDER' | 'SUBSCRIPTION';
  customerName: string;
  customerFlat: string;
  customerPhone: string;
  serviceName: string;
  slot: string;
  specialInstructions: string;
}

interface Props {
  allManifestItems: ManifestItem[];
  checkedManifestIds: string[];
  onToggleCheck: (id: string) => void;
}

export default function ProviderManifestTab({
  allManifestItems,
  checkedManifestIds,
  onToggleCheck,
}: Props) {
  const doneCount = checkedManifestIds.length;
  const total = allManifestItems.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            Daily Gate &amp; Tower Delivery Sheet
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Sorted sequentially by Tower &amp; Flat for fast, error-free doorstep fulfillment.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} /> Print Manifest
          </button>
        </div>
      </div>

      {/* Progress summary */}
      <div
        className="card"
        style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}
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
          <div>
            <strong style={{ color: 'var(--primary-hover)', fontSize: '0.95rem' }}>
              {doneCount} of {total} Doorsteps Fulfilled Today
            </strong>
            <div style={{ fontSize: '0.8rem', color: '#115e59' }}>
              Greenfield Heights Security Checkpoint Pass Active
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
            {pct}% Done
          </div>
        </div>
      </div>

      {/* Manifest Table */}
      <div
        className="card table-responsive"
        style={{ padding: 0, overflowX: 'auto', minWidth: 0, maxWidth: '100%' }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '650px',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-light)',
                color: 'var(--text-muted)',
              }}
            >
              <th style={{ padding: '12px 14px', width: '48px' }}>Done</th>
              <th style={{ padding: '12px 14px' }}>Flat / Tower</th>
              <th style={{ padding: '12px 14px' }}>Resident Name</th>
              <th style={{ padding: '12px 14px' }}>Service &amp; Plan</th>
              <th style={{ padding: '12px 14px' }}>Preferred Slot</th>
              <th style={{ padding: '12px 14px' }}>Delivery Instructions</th>
            </tr>
          </thead>
          <tbody>
            {allManifestItems.map((item) => {
              const isDone = checkedManifestIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    background: isDone ? 'rgba(209, 250, 229, 0.3)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <td style={{ padding: '12px 14px', minWidth: '48px' }}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => onToggleCheck(item.id)}
                      style={{
                        width: '22px',
                        height: '22px',
                        minWidth: '22px',
                        minHeight: '22px',
                        cursor: 'pointer',
                        accentColor: 'var(--primary)',
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--primary)' }}>
                    {item.customerFlat}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{item.customerName}</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Use in-app chat
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div>{item.serviceName}</div>
                    <span className="badge badge-slate" style={{ fontSize: '0.62rem' }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{item.slot}</td>
                  <td
                    style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                  >
                    {item.specialInstructions || 'Direct doorstep handover'}
                  </td>
                </tr>
              );
            })}

            {allManifestItems.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}
                >
                  <FileSpreadsheet size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  No delivery tasks scheduled for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
