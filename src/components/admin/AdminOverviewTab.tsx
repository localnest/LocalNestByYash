'use client';

import React from 'react';
import { DollarSign, RefreshCw, Percent, ShieldCheck } from 'lucide-react';
import type { Order, Subscription } from '@/lib/types';

interface Props {
  orders: Order[];
  subscriptions: Subscription[];
  totalGmv: number;
  recurringGmv: number;
  platformRevenue: number;
  openComplaintsCount: number;
}

export default function AdminOverviewTab({
  orders,
  subscriptions,
  totalGmv,
  recurringGmv,
  platformRevenue,
  openComplaintsCount,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span>GROSS MERCHANDISE VALUE</span>
            <DollarSign size={18} color="var(--primary)" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '8px',
            }}
          >
            ₹{totalGmv.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            Across {orders.length} resident orders
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span>MONTHLY RECURRING GMV</span>
            <RefreshCw size={18} color="var(--accent-blue)" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--accent-blue)',
              marginTop: '8px',
            }}
          >
            ₹{recurringGmv.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {subscriptions.filter((s) => s.status === 'ACTIVE').length} active household
            subscriptions
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span>PLATFORM COMMISSION REVENUE</span>
            <Percent size={18} color="var(--accent-emerald)" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--accent-emerald)',
              marginTop: '8px',
            }}
          >
            ₹{platformRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Average platform take-rate: ~10.0%
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span>MARKETPLACE TRUST SCORE</span>
            <ShieldCheck size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>98.6%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {openComplaintsCount === 0
              ? '0 open disputes'
              : `${openComplaintsCount} ticket under mediation`}
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div
        className="card table-responsive"
        style={{ overflowX: 'auto', minWidth: 0, maxWidth: '100%' }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
          Recent Platform Orders
        </h3>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              minWidth: '600px',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
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
                <th style={{ padding: '10px 14px' }}>Order #</th>
                <th style={{ padding: '10px 14px' }}>Society Flat</th>
                <th style={{ padding: '10px 14px' }}>Service &amp; Provider</th>
                <th style={{ padding: '10px 14px' }}>Total Amount</th>
                <th style={{ padding: '10px 14px' }}>Platform Cut</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{order.orderNumber}</td>
                  <td style={{ padding: '10px 14px' }}>{order.customerFlat}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div>{order.serviceName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      by {order.providerName}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>₹{order.totalAmount}</td>
                  <td
                    style={{
                      padding: '10px 14px',
                      color: 'var(--accent-emerald)',
                      fontWeight: 600,
                    }}
                  >
                    ₹{order.platformCommission} ({order.commissionPercentage}%)
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
