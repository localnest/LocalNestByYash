'use client';

import React from 'react';
import { Check, X, Calendar, Clock, CheckCircle, PackageCheck, MessageCircle } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';

interface Props {
  providerOrders: Order[];
  onAccept: (orderId: string) => void;
  onSchedule: (orderId: string, date: string) => void;
  onProgress: (orderId: string) => void;
  onComplete: (orderId: string) => void;
  onDecline: (order: Order) => void;
  onOpenChat: (orderId: string) => void;
}

function statusBadgeClass(status: OrderStatus): string {
  if (status === 'COMPLETED') return 'badge-emerald';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'badge-rose';
  if (status === 'PENDING') return 'badge-amber';
  return 'badge-blue';
}

export default function ProviderOrdersTab({
  providerOrders,
  onAccept,
  onSchedule,
  onProgress,
  onComplete,
  onDecline,
  onOpenChat,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Orders Pipeline &amp; Management</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Accept incoming requests, provide cancellation/rejection reasons, and confirm
            fulfillment.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {providerOrders.map((order) => (
          <div key={order.id} className="card">
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    Order #{order.orderNumber}
                  </span>
                  <span className={`badge ${statusBadgeClass(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                  Customer: <strong>{order.customerName}</strong> ({order.customerFlat})
                  <button
                    onClick={() => onOpenChat(order.id)}
                    style={{
                      marginLeft: '8px',
                      background: 'none',
                      border: '1px solid var(--primary)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MessageCircle size={12} /> Chat
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Service: {order.serviceName} • Model: {order.pricingModel} • Qty:{' '}
                  {order.itemQuantity}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                  Total: ₹{order.totalAmount}
                </div>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}
                >
                  Your Net Payout: ₹{order.providerEarnings.toFixed(2)}
                </span>
              </div>
            </div>

            {order.specialInstructions && (
              <div
                style={{
                  margin: '10px 0',
                  background: 'var(--bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Resident Note:</strong> &quot;{order.specialInstructions}&quot;
              </div>
            )}

            {order.status === 'REJECTED' && order.rejectionReason && (
              <div
                style={{
                  margin: '10px 0',
                  background: '#ffe4e6',
                  border: '1px solid #fecdd3',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#be123c',
                }}
              >
                <strong>Decline Reason Provided:</strong> &quot;{order.rejectionReason}&quot; (100%
                Escrow Refunded to Customer)
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '12px',
                marginTop: '10px',
                flexWrap: 'wrap',
              }}
            >
              {order.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => onDecline(order)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--accent-rose)' }}
                  >
                    <X size={14} /> Decline with Reason
                  </button>
                  <button onClick={() => onAccept(order.id)} className="btn btn-primary btn-sm">
                    <Check size={14} /> Accept Request
                  </button>
                </>
              )}

              {order.status === 'ACCEPTED' && (
                <button
                  onClick={() => onSchedule(order.id, order.scheduledDate)}
                  className="btn btn-primary btn-sm"
                >
                  <Calendar size={14} /> Schedule for {order.scheduledDate}
                </button>
              )}

              {order.status === 'SCHEDULED' && (
                <button onClick={() => onProgress(order.id)} className="btn btn-secondary btn-sm">
                  <Clock size={14} /> Mark In Progress
                </button>
              )}

              {order.status === 'IN_PROGRESS' && (
                <button onClick={() => onComplete(order.id)} className="btn btn-primary btn-sm">
                  <CheckCircle size={14} /> Confirm Service Completed
                </button>
              )}

              {order.status === 'COMPLETED' && (
                <span className="badge badge-emerald">✓ Completed &amp; Disbursed</span>
              )}
            </div>
          </div>
        ))}

        {providerOrders.length === 0 && (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}
          >
            <PackageCheck size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p>No customer orders received yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
