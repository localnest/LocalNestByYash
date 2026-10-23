'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import type { Order } from '@/lib/types';
import { calculateCustomerCancellation } from '@/features/dispatch/cancellationEngine';
import { useScrollLock } from '@/lib/hooks/useScrollLock';
import AppSelect from '@/components/ui/AppSelect';

interface CancellationConfirmModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => void;
}

export default function CancellationConfirmModal({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}: CancellationConfirmModalProps) {
  const [reason, setReason] = useState('Personal schedule changed');
  const [customReason, setCustomReason] = useState('');

  useScrollLock(isOpen && order !== null, onClose);

  if (!isOpen || !order) return null;

  // Determine scheduled ISO timestamp
  const scheduledTimeIso = order.scheduledDate
    ? new Date(`${order.scheduledDate}T12:00:00Z`).toISOString()
    : new Date().toISOString();

  const isDispatched = order.status === 'IN_PROGRESS' || order.status === 'SCHEDULED';
  const calculation = calculateCustomerCancellation(
    order.totalAmount,
    scheduledTimeIso,
    new Date().toISOString(),
    isDispatched,
  );

  const handleConfirm = () => {
    const finalReason = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;
    onConfirmCancel(order.id, finalReason);
    onClose();
  };

  return (
    <div className="modal-overlay customer-modal" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Confirm Order Cancellation</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '14px',
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to cancel Order <strong>#{order.orderNumber}</strong> with{' '}
          <strong>{order.providerName}</strong>?
        </p>

        {/* Breakdown Box */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Refund & Cancellation Policy Breakdown
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              marginBottom: '6px',
            }}
          >
            <span>Order Total Paid:</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              marginBottom: '6px',
              color: calculation.penaltyFee > 0 ? '#dc2626' : 'var(--accent-emerald)',
            }}
          >
            <span>Late Cancellation Fee:</span>
            <span>
              {calculation.penaltyFee > 0
                ? `-₹${calculation.penaltyFee.toFixed(2)}`
                : '₹0.00 (Free)'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.95rem',
              fontWeight: 800,
              borderTop: '1px solid var(--border-light)',
              paddingTop: '8px',
              marginTop: '6px',
            }}
          >
            <span>Eligible Refund Amount:</span>
            <span style={{ color: 'var(--accent-emerald)' }}>
              ₹{calculation.refundAmount.toFixed(2)}
            </span>
          </div>

          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '8px',
              lineHeight: 1.4,
            }}
          >
            <ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {calculation.explanation}
          </div>
        </div>

        {/* Reason Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}
          >
            Reason for Cancellation:
          </label>
          <AppSelect
            label="Reason for cancellation"
            value={reason}
            onChange={setReason}
            options={[
              { value: 'Personal schedule changed', label: 'Personal schedule changed' },
              { value: 'Found alternative solution', label: 'Found alternative solution' },
              { value: 'Booked wrong date/slot', label: 'Booked wrong date/slot' },
              { value: 'Provider requested reschedule', label: 'Provider requested reschedule' },
              { value: 'Other', label: 'Other reason...' },
            ]}
          />
        </div>

        {reason === 'Other' && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Please specify reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-danger"
            style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
          >
            Yes, Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}
