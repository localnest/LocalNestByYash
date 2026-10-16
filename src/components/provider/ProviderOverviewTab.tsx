'use client';

import React from 'react';
import {
  DollarSign,
  PackageCheck,
  Repeat,
  Star,
  FileSpreadsheet,
  AlertCircle,
  Palmtree,
} from 'lucide-react';
import type { Provider, Order, Subscription, Review } from '@/lib/types';

interface ManifestItem {
  id: string;
  type: 'ORDER' | 'SUBSCRIPTION';
  customerName: string;
  customerFlat: string;
  slot: string;
  serviceName: string;
}

interface Props {
  provider: Provider;
  withdrawableBalance: number;
  totalEarned: number;
  dynamicRating: string;
  providerOrders: Order[];
  providerSubscriptions: Subscription[];
  myReviews: Review[];
  allManifestItems: ManifestItem[];
  checkedManifestIds: string[];
  onToggleManifest: (id: string) => void;
  onGoToTab: (tab: string) => void;
  onOpenAvailability: () => void;
  onOpenPayout: () => void;
}

export default function ProviderOverviewTab({
  provider,
  withdrawableBalance,
  totalEarned,
  dynamicRating,
  providerOrders,
  providerSubscriptions,
  myReviews,
  allManifestItems,
  checkedManifestIds,
  onToggleManifest,
  onGoToTab,
  onOpenAvailability,
  onOpenPayout,
}: Props) {
  const pendingCount = providerOrders.filter((o) => o.status === 'PENDING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Vacation Alert Banner */}
      {provider.isVacationMode && (
        <div
          style={{
            background: '#fef3c7',
            border: '1.5px solid #f59e0b',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Palmtree size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>
                Vacation Mode is Currently ACTIVE
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#b45309', margin: '2px 0 0' }}>
                &quot;{provider.vacationReason || 'Not accepting new orders'}&quot; — Residents are
                informed and booking is paused.
              </p>
            </div>
          </div>
          <button onClick={onOpenAvailability} className="btn btn-dark btn-sm">
            Resume Taking Bookings
          </button>
        </div>
      )}

      {/* KPI Cards */}
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
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AVAILABLE PAYOUT</span>
            <DollarSign size={18} color="var(--accent-emerald)" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginTop: '8px',
              color: 'var(--accent-emerald)',
            }}
          >
            ₹{withdrawableBalance.toLocaleString()}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Lifetime: ₹{totalEarned.toLocaleString()}
            </span>
            <button
              onClick={() => {
                onGoToTab('earnings');
                onOpenPayout();
              }}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>COMPLETED ORDERS</span>
            <PackageCheck size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
            {provider.completedOrders}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {provider.onTimeRate}% on-time completion rate
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE SUBSCRIPTIONS</span>
            <Repeat size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
            {providerSubscriptions.filter((s) => s.status === 'ACTIVE').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            MRR: ₹
            {providerSubscriptions.reduce((acc, s) => acc + s.monthlyPrice, 0).toLocaleString()}/mo
          </div>
        </div>

        <div
          className="card card-hover"
          onClick={() => onGoToTab('reviews')}
          style={{ cursor: 'pointer', border: '1px solid var(--border-light)' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>SOCIETY REPUTATION</span>
            <Star size={18} color="#f59e0b" fill="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#b45309' }}>
            ★ {dynamicRating} / 5.0
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--primary)',
              marginTop: '4px',
              fontWeight: 600,
            }}
          >
            {myReviews.length} verified resident reviews →
          </div>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {pendingCount > 0 && (
        <div
          style={{
            background: 'var(--accent-amber-light)',
            border: '1px solid var(--accent-amber)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={22} color="var(--accent-amber)" />
            <div>
              <strong>You have {pendingCount} new booking request(s) awaiting your action!</strong>
              <div style={{ fontSize: '0.8rem', color: '#78350f' }}>
                Please accept or decline promptly to maintain your reliability score.
              </div>
            </div>
          </div>
          <button onClick={() => onGoToTab('orders')} className="btn btn-dark btn-sm">
            View Requests
          </button>
        </div>
      )}

      {/* Today's Schedule Widget */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Today&apos;s Fulfillment Schedule
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {allManifestItems.length} deliveries &amp; scheduled visits planned
            </div>
          </div>
          <button
            onClick={() => onGoToTab('manifest')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={14} /> Open Full Delivery Sheet
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {allManifestItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.customerFlat}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    • {item.customerName}
                  </span>
                  <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>
                    {item.type}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Slot: <strong>{item.slot}</strong> • Service: {item.serviceName}
                </div>
              </div>
              <button
                onClick={() => onToggleManifest(item.id)}
                className={`btn btn-sm ${checkedManifestIds.includes(item.id) ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {checkedManifestIds.includes(item.id) ? '✓ Completed' : 'Mark Done'}
              </button>
            </div>
          ))}
          {allManifestItems.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                padding: '24px 0',
                fontSize: '0.85rem',
              }}
            >
              No pending orders or subscriptions scheduled for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
