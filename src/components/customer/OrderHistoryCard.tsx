'use client';

import React, { useState } from 'react';
import type { Order, Service, Provider } from '@/lib/types';
import CancellationConfirmModal from './CancellationConfirmModal';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  Star,
} from 'lucide-react';

export interface OrderHistoryCardProps {
  order: Order;
  hasReviewed: boolean;
  service?: Service;
  provider?: Provider;
  onCancelOrder: (orderId: string, reason: string) => void;
  onRaiseDispute: (order: Order) => void;
  onOpenChat: (orderId: string) => void;
  onBookAgain?: (service: Service, provider: Provider) => void;
  onRateReview: (order: Order) => void;
  onExploreAlternative?: () => void;
}

export function getOrderStatusBadge(status: Order['status']) {
  switch (status) {
    case 'PENDING':
      return <span className="badge badge-amber">Waiting Provider Acceptance</span>;
    case 'ACCEPTED':
      return <span className="badge badge-blue">Accepted by Provider</span>;
    case 'SCHEDULED':
      return <span className="badge badge-emerald">Scheduled</span>;
    case 'IN_PROGRESS':
      return <span className="badge badge-blue">In Progress</span>;
    case 'COMPLETED':
      return <span className="badge badge-emerald">Completed</span>;
    case 'CANCELLED':
      return <span className="badge badge-slate">Cancelled</span>;
    case 'REJECTED':
      return <span className="badge badge-rose">Declined by Provider (Refunded)</span>;
    case 'REFUNDED':
      return <span className="badge badge-emerald">Escrow Refunded ✓</span>;
    case 'DISPUTED':
      return <span className="badge badge-rose">Under Support Mediation</span>;
    default:
      return <span className="badge badge-slate">{status}</span>;
  }
}

const STEPS = [
  { state: 'PENDING', label: '1. Placed', desc: 'Escrow Paid' },
  { state: 'ACCEPTED', label: '2. Accepted', desc: 'Provider Ready' },
  { state: 'SCHEDULED', label: '3. Gate Pass', desc: 'Security Cleared' },
  { state: 'IN_PROGRESS', label: '4. Active', desc: 'Doorstep Service' },
  { state: 'COMPLETED', label: '5. Done', desc: 'Signed Off' },
];

const STATE_ORDER = ['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

function OrderStepProgress({ order }: { order: Order }) {
  if (order.status === 'REJECTED' || order.status === 'REFUNDED') {
    return null;
  }

  const currentIdx = STATE_ORDER.indexOf(order.status);

  return (
    <div style={{ margin: '18px 0', overflowX: 'auto', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          minWidth: '280px',
          paddingBottom: '4px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '13px',
            left: '8%',
            right: '8%',
            height: '3px',
            background: 'var(--border-light)',
            zIndex: 0,
          }}
        />
        {STEPS.map((step, idx) => {
          const stepIdx = STATE_ORDER.indexOf(step.state);
          const isDone =
            currentIdx >= stepIdx && order.status !== 'CANCELLED' && order.status !== 'DISPUTED';
          const isCurrent = order.status === step.state;

          return (
            <div
              key={step.state}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                zIndex: 1,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isDone ? 'var(--primary)' : 'var(--bg-subtle)',
                  border: isCurrent ? '2.5px solid #0f766e' : '1px solid var(--border-light)',
                  boxShadow: isCurrent ? '0 0 10px rgba(13, 148, 136, 0.4)' : undefined,
                  color: isDone ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? 'var(--primary)' : 'var(--text-main)',
                }}
              >
                {step.label}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {order.status === 'SCHEDULED' && (
        <div
          style={{
            marginTop: '12px',
            background: 'var(--bg-subtle)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>
            Society Gate Pass: <strong>GP-2026-{order.orderNumber.slice(-4)}</strong> generated for
            delivery personnel.
          </span>
        </div>
      )}
    </div>
  );
}

function OrderDisputeBanner({
  order,
  onExploreAlternative,
}: {
  order: Order;
  onExploreAlternative?: () => void;
}) {
  if (order.status === 'REJECTED') {
    return (
      <div
        style={{
          margin: '14px 0',
          background: '#fff1f2',
          border: '1.5px solid #fecdd3',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#be123c',
            fontWeight: 800,
            fontSize: '0.925rem',
          }}
        >
          <AlertCircle size={18} /> Request Declined by Provider
        </div>
        <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#9f1239' }}>
          <strong>Decline Reason:</strong> &ldquo;
          {order.rejectionReason || 'Provider is currently at maximum capacity for today.'}&rdquo;
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '0.78rem',
            color: '#047857',
            background: '#ecfdf5',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={14} /> 100% Escrow refund of ₹{order.totalAmount} has been returned to
          your original payment method.
        </div>
        {onExploreAlternative && (
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={onExploreAlternative}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', background: '#fff' }}
            >
              Explore Alternative Providers →
            </button>
          </div>
        )}
      </div>
    );
  }

  if (order.status === 'REFUNDED') {
    return (
      <div
        style={{
          margin: '14px 0',
          background: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#065f46',
            fontWeight: 800,
            fontSize: '0.925rem',
          }}
        >
          <CheckCircle2 size={18} /> Dispute Mediated — 100% Refund Disbursed
        </div>
        <div style={{ marginTop: '6px', fontSize: '0.82rem', color: '#047857' }}>
          The platform society mediation desk reviewed this ticket. Full order payment of ₹
          {order.totalAmount} has been returned to your account.
        </div>
      </div>
    );
  }

  return null;
}

export default function OrderHistoryCard({
  order,
  hasReviewed,
  service,
  provider,
  onCancelOrder,
  onRaiseDispute,
  onOpenChat,
  onBookAgain,
  onRateReview,
  onExploreAlternative,
}: OrderHistoryCardProps) {
  const [cancellationOpen, setCancellationOpen] = useState(false);
  const isCompleted = order.status === 'COMPLETED';
  const isCancellable = order.status === 'PENDING' || order.status === 'ACCEPTED';
  const showChat = ['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(
    order.status,
  );

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{order.providerName}</span>
            {getOrderStatusBadge(order.status)}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            Order #{order.orderNumber} • {order.serviceName}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
            ₹{order.totalAmount}
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--accent-emerald)',
              fontWeight: 600,
            }}
          >
            ✓ Razorpay Escrow Paid
          </span>
        </div>
      </div>

      {/* Schedule & Address Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          margin: '14px 0',
          background: 'var(--bg-subtle)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.825rem',
        }}
      >
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SCHEDULED FOR</div>
          <strong>
            {order.scheduledDate} ({order.scheduledSlot})
          </strong>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DELIVERY LOCATION</div>
          <strong>{order.deliveryAddress}</strong>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>PRICING MODEL</div>
          <strong>
            {order.pricingModel.replace('_', ' ')} (Qty: {order.itemQuantity})
          </strong>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            COMMISSION / BREAKDOWN
          </div>
          <span>
            Platform Fee: ₹{order.platformFee}{' '}
            {order.discountAmount > 0 ? `• Saved: ₹${order.discountAmount}` : ''}
          </span>
        </div>
      </div>

      {/* Doorstep OTP Passcode */}
      {order.doorOtp &&
        order.status !== 'COMPLETED' &&
        order.status !== 'CANCELLED' &&
        order.status !== 'REJECTED' && (
          <div
            style={{
              margin: '12px 0',
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#166534',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Doorstep Security Passcode
              </span>
              <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                Share this 4-digit code with the pro when they arrive at your flat door
              </div>
            </div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '4px',
                background: '#dcfce7',
                padding: '6px 16px',
                borderRadius: '8px',
                color: '#166534',
                border: '1px solid #bbf7d0',
              }}
            >
              {order.doorOtp}
            </div>
          </div>
        )}

      {/* State Machine Progression or Status Banners */}
      <OrderDisputeBanner order={order} onExploreAlternative={onExploreAlternative} />
      <OrderStepProgress order={order} />

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '12px',
          flexWrap: 'wrap',
        }}
      >
        {isCancellable && (
          <button
            onClick={() => setCancellationOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--accent-rose)' }}
          >
            Cancel Booking
          </button>
        )}

        <button onClick={() => onRaiseDispute(order)} className="btn btn-secondary btn-sm">
          Raise Dispute / Support
        </button>

        {showChat && (
          <button
            onClick={() => onOpenChat(order.id)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <MessageCircle size={13} /> Chat
          </button>
        )}

        {isCompleted && service && provider && onBookAgain && (
          <button
            onClick={() => onBookAgain(service, provider)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw size={13} /> Book Again
          </button>
        )}

        {isCompleted && !hasReviewed && (
          <button onClick={() => onRateReview(order)} className="btn btn-primary btn-sm">
            <Star size={14} /> Rate & Review Provider
          </button>
        )}

        {isCompleted && hasReviewed && (
          <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
            ✓ Review Submitted
          </span>
        )}
      </div>

      {/* Cancellation modal – shown when user clicks Cancel Booking */}
      <CancellationConfirmModal
        order={order}
        isOpen={cancellationOpen}
        onClose={() => setCancellationOpen(false)}
        onConfirmCancel={(orderId, reason) => {
          onCancelOrder(orderId, reason);
          setCancellationOpen(false);
        }}
      />
    </div>
  );
}
