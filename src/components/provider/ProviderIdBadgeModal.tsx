'use client';

import React from 'react';
import type { Provider } from '@/lib/types';
import { ShieldCheck, Award, Printer, X, MapPin } from 'lucide-react';

interface ProviderIdBadgeModalProps {
  provider: Provider;
  societyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProviderIdBadgeModal({
  provider,
  societyName,
  isOpen,
  onClose,
}: ProviderIdBadgeModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const profileUrl = `https://localnest.in/provider/${provider.id}`;
  // SVG QR Code simulation
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    profileUrl,
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content print-page"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '400px',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Official Provider ID Badge</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Printable Badge Card */}
        <div
          id="printable-provider-badge"
          style={{
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)',
              color: '#ffffff',
              padding: '16px 12px',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              LocalNest Hyperlocal Verified
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px' }}>
              Service Professional
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
                fontSize: '0.75rem',
                opacity: 0.9,
              }}
            >
              <MapPin size={12} />
              {societyName}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 16px' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                margin: '-45px auto 10px',
                border: '3px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#0369a1',
              }}
            >
              {provider.businessName.charAt(0)}
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {provider.businessName}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {provider.phone}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginTop: '10px',
              }}
            >
              <ShieldCheck size={14} />
              Aadhaar & Police Verified
            </div>

            {/* QR Code */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--bg-subtle)',
                borderRadius: '12px',
                display: 'inline-block',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSvgUrl}
                alt="Scan to verify badge"
                width={120}
                height={120}
                style={{ display: 'block', margin: '0 auto', borderRadius: '6px' }}
              />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Scan to verify rating & past reviews
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Badge ID: <strong>LN-{provider.id.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '18px',
          }}
        >
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-full print-include"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            Print Badge (A4 Fit)
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
