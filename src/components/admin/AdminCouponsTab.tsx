'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { Coupon } from '@/lib/types';

interface Props {
  coupons: Coupon[];
  toggleCouponActive: (couponId: string) => void;
  onAddCoupon: () => void;
}

export default function AdminCouponsTab({ coupons, toggleCouponActive, onAddCoupon }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Discounts &amp; Promotions Engine</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Manage server-validated coupons, first-order promotions, and society welcome vouchers.
          </p>
        </div>
        <button type="button" onClick={onAddCoupon} className="btn btn-primary btn-sm">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '16px',
        }}
      >
        {coupons.map((coupon) => (
          <div key={coupon.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      letterSpacing: '0.04em',
                      color: 'var(--primary)',
                    }}
                  >
                    {coupon.code}
                  </span>
                  <span
                    className={`badge ${coupon.isActive ? 'badge-emerald' : 'badge-slate'}`}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {coupon.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                  {coupon.title}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  {coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'SUBSCRIPTION'
                    ? `${coupon.discountValue}% OFF`
                    : `₹${coupon.discountValue} OFF`}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0' }}>
              {coupon.description}
            </p>

            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--text-muted)',
              }}
            >
              <span>Min Order: ₹{coupon.minOrderValue}</span>
              <span>
                Used: {coupon.currentUsage} / {coupon.usageLimit || '∞'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '10px',
                marginTop: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => toggleCouponActive(coupon.id)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                {coupon.isActive ? 'Disable Promo' : 'Enable Promo'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
