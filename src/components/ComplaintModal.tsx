'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { Order } from '@/lib/types';
import { X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ComplaintModalProps {
  order: Order;
  onClose: () => void;
}

export default function ComplaintModal({ order, onClose }: ComplaintModalProps) {
  const { createComplaint } = useMarketplace();
  const [category, setCategory] = useState<string>('Service Quality Issue');
  const [description, setDescription] = useState<string>('');
  const [ticketResult, setTicketResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const res = createComplaint(order.id, category, description);
    if (res.success) {
      setTicketResult(res.ticketNumber);
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 'min(480px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
            <h3 style={{ fontSize: '1.2rem' }}>Raise Support Ticket</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close complaint modal"
          >
            <X size={20} />
          </button>
        </div>

        {ticketResult ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle
              size={44}
              color="var(--accent-emerald)"
              style={{ margin: '0 auto 12px' }}
            />
            <h4>Ticket #{ticketResult} Created</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              Our platform support team has frozen the order and will mediate between you and{' '}
              {order.providerName} within 2 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{order.providerName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Order #{order.orderNumber} • Amount: ₹{order.totalAmount}
              </div>
            </div>

            <div>
              <label className="form-label">Nature of Complaint</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
              >
                <option value="Service Quality Issue">Service Quality Not As Described</option>
                <option value="Unpunctual / No-Show">Provider Late or No-Show</option>
                <option value="Missing or Damaged Item">Missing or Damaged Clothes/Item</option>
                <option value="Overcharging / Payment Issue">
                  Incorrect Billing / Payment Issue
                </option>
                <option value="Unprofessional Behavior">Unprofessional Conduct</option>
                <option value="Refund Request">Direct Refund Request</option>
              </select>
            </div>

            <div>
              <label className="form-label">Describe the issue clearly:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="form-input"
                placeholder="Please describe what occurred so the platform admin can assist with resolution or refund..."
                required
              />
            </div>

            <div
              style={{
                background: 'var(--accent-rose-light)',
                color: 'var(--accent-rose)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                display: 'flex',
                gap: '8px',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                Platform Payment Protection holds funds in escrow until complaints are resolved.
              </div>
            </div>

            <button type="submit" className="btn btn-dark btn-full">
              Submit Dispute Ticket
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
