'use client';

import React from 'react';
import { ArrowDownToLine } from 'lucide-react';
import type { Order, PayoutRecord } from '@/lib/types';

interface Props {
  withdrawableBalance: number;
  totalGrossEarnings: number;
  totalCommissionPaid: number;
  totalWithdrawn: number;
  completedOrders: Order[];
  providerPayouts: PayoutRecord[];
  onOpenPayout: () => void;
}

export default function ProviderEarningsTab({
  withdrawableBalance,
  totalGrossEarnings,
  totalCommissionPaid,
  totalWithdrawn,
  completedOrders,
  providerPayouts,
  onOpenPayout,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Financial Ledger & Bank Payouts</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Transparent net earnings after 10% platform take-rate with on-demand UPI / NEFT bank
            withdrawals.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPayout}
          className="btn btn-primary"
          disabled={withdrawableBalance <= 0}
        >
          <ArrowDownToLine size={16} /> Request Bank Payout (₹{withdrawableBalance.toLocaleString()}
          )
        </button>
      </div>

      {/* Payout Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="card" style={{ background: 'var(--bg-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            GROSS GMV BILLED
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{totalGrossEarnings.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Across {completedOrders.length} completed orders
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            PLATFORM COMMISSION (10%)
          </span>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              marginTop: '4px',
              color: 'var(--accent-amber)',
            }}
          >
            -₹{totalCommissionPaid.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Includes Razorpay PG & escrow fees
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            TOTAL WITHDRAWN TO BANK
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{totalWithdrawn.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {providerPayouts.length} past transfers
          </div>
        </div>

        <div
          className="card"
          style={{ background: '#ecfdf5', borderColor: 'var(--accent-emerald)' }}
        >
          <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700 }}>
            AVAILABLE FOR WITHDRAWAL
          </span>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              marginTop: '4px',
              color: 'var(--accent-emerald)',
            }}
          >
            ₹{withdrawableBalance.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>
            Direct UPI / NEFT transfer
          </div>
        </div>
      </div>

      {/* Payout History Ledger */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>
          Bank Transfer History
        </h3>
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
                <th style={{ padding: '12px 16px' }}>Reference #</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Method</th>
                <th style={{ padding: '12px 16px' }}>Account / UPI Details</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {providerPayouts.map((pay) => (
                <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>{pay.referenceId}</td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontWeight: 800,
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    ₹{pay.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      {pay.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{pay.accountDetails}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {new Date(pay.requestedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      {pay.status === 'COMPLETED'
                        ? 'Settled to Account'
                        : 'Processing (Within 2 hrs)'}
                    </span>
                  </td>
                </tr>
              ))}
              {providerPayouts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    No past withdrawals yet. When you request a payout, transaction records will
                    appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Orders Detailed Breakdown */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>
          Itemized Order Earnings
        </h3>
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
                <th style={{ padding: '12px 16px' }}>Order #</th>
                <th style={{ padding: '12px 16px' }}>Resident Flat</th>
                <th style={{ padding: '12px 16px' }}>Gross GMV</th>
                <th style={{ padding: '12px 16px' }}>Platform Take Rate</th>
                <th style={{ padding: '12px 16px' }}>Net Provider Payout</th>
                <th style={{ padding: '12px 16px' }}>Disbursement</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>{order.orderNumber}</td>
                  <td style={{ padding: '12px 16px' }}>{order.customerFlat}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    ₹{order.subtotal.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-amber)' }}>
                    {order.commissionPercentage}% (-₹{order.platformCommission.toFixed(2)})
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontWeight: 800,
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    ₹{order.providerEarnings.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      Settled in Escrow
                    </span>
                  </td>
                </tr>
              ))}
              {completedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    No completed orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
