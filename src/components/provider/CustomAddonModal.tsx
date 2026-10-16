'use client';

import React, { useState } from 'react';
import { PlusCircle, CheckCircle, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface CustomAddonModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, amount: number, notes: string) => void;
}

export default function CustomAddonModal({
  orderId,
  isOpen,
  onClose,
  onSubmit,
}: CustomAddonModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;
    onSubmit(title.trim(), Number(amount), notes.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
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
            <PlusCircle size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Request On-Site Add-On</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <CheckCircle
              size={48}
              color="var(--accent-emerald)"
              style={{ margin: '0 auto 12px' }}
            />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Add-On Dispatched to Resident!
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              The customer has received an approval prompt on their phone with escrow adjustment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.5 }}>
                Order <strong>#{orderId.slice(0, 8).toUpperCase()}</strong>: Resident must approve
                the item & price on their screen before payment is added to the escrow ledger.
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Item / Part Description *
              </label>
              <input
                type="text"
                placeholder="e.g. Copper Pipe replacement (2 meters)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Extra Amount (₹) *
              </label>
              <input
                type="number"
                min="10"
                step="1"
                placeholder="e.g. 250"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || '')}
                required
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Reason / Technical Notes (Optional)
              </label>
              <textarea
                placeholder="Discovered rust in previous joint causing slow leakage..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '18px',
              }}
            >
              <ShieldAlert size={14} />
              Platform commission applies consistently to on-site approved add-ons.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary btn-full">
                Request Customer Approval
              </button>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
