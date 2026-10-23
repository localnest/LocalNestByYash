'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import AppSelect from '@/components/ui/AppSelect';
import { Building2, ShieldCheck, Tag, ArrowRight, Sparkles } from 'lucide-react';

export default function ResidentOnboarding() {
  const { currentUser, societies, completeResidentOnboarding, logout } = useMarketplace();

  // Information Taken from Resident
  const [fullName, setFullName] = useState<string>(currentUser?.fullName || '');
  const [phone, setPhone] = useState<string>(currentUser?.phone || '');
  const [societyId, setSocietyId] = useState<string>(societies[0].id);
  const [towerWing, setTowerWing] = useState<string>('Tower A');
  const [flatNumber, setFlatNumber] = useState<string>('402');
  const [acceptedGuidelines, setAcceptedGuidelines] = useState<boolean>(true);
  const [step, setStep] = useState<1 | 2>(1);

  const selectedSociety = societies.find((s) => s.id === societyId) || societies[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!fullName.trim() || !flatNumber.trim()) return;
      setStep(2); // move to information provided by us
    } else {
      completeResidentOnboarding({
        societyId,
        towerWing,
        flatNumber,
        phone,
        fullName,
      });
    }
  };

  return (
    <div
      className="resident-onboarding"
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 'min(580px, 95vw)',
          width: '100%',
          padding: '24px 18px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid rgba(255,255,255,0.15)',
          background: '#fff',
          boxSizing: 'border-box',
        }}
      >
        {/* Step Indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '14px',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              Step {step} of 2 • Resident Onboarding
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
              {step === 1 ? 'Verify Your Society Residence' : 'Welcome to Greenfield Heights!'}
            </h2>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textDecoration: 'underline',
              minHeight: '44px',
              minWidth: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Cancel & Sign Out
          </button>
        </div>

        {/* STEP 1: INFORMATION TAKEN FROM RESIDENT */}
        {step === 1 && (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              To ensure services are delivered right to your doorstep, please provide your exact
              flat and community details:
            </p>

            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Yash Khandagale"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Contact Phone Number (For pickup/delivery calls)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Select Your Residential Society</label>
              <AppSelect
                label="Residential society"
                value={societyId}
                onChange={setSocietyId}
                options={societies.map((soc) => ({
                  value: soc.id,
                  label: soc.name,
                  hint: `${soc.totalFlats.toLocaleString()} flats — ${soc.addressLine}`,
                }))}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label className="form-label">Tower / Wing / Block</label>
                <AppSelect
                  label="Tower / wing / block"
                  value={towerWing}
                  onChange={setTowerWing}
                  options={[
                    { value: 'Tower A', label: 'Tower A (Oak Block)' },
                    { value: 'Tower B', label: 'Tower B (Pine Block)' },
                    { value: 'Tower C', label: 'Tower C (Maple Block)' },
                    { value: 'Tower D', label: 'Tower D (Cedar Block)' },
                    { value: 'Row House / Villa', label: 'Row House / Villa' },
                  ]}
                />
              </div>
              <div>
                <label className="form-label">Flat / Unit Number</label>
                <input
                  type="text"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  placeholder="e.g. 402 or B-114"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '10px' }}
            >
              Review Society Perks & Complete <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: INFORMATION PROVIDED BY US TO RESIDENT */}
        {step === 2 && (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              style={{
                background: 'var(--primary-light)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-glow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--primary-hover)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <Sparkles size={18} />
                <span>
                  Confirmed Location: {towerWing} - {flatNumber}, {selectedSociety.name}
                </span>
              </div>
            </div>

            {/* Information & Perks Provided by Platform */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-emerald-light)',
                    color: 'var(--accent-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Tag size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    Welcome Gift: Flat ₹100 Off
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Use code <strong>WELCOME100</strong> on your first laundry pickup, meal
                    subscription, or deep clean order.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-blue-light)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    100% Escrow Payment Protection
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Your payment is held safely by Razorpay and released to the local provider only
                    after service completion.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-amber-light)',
                    color: 'var(--accent-amber)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    Society Security Gate Passes
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    All local providers have pre-cleared society gate passes and adhere to
                    morning/evening noise regulations.
                  </p>
                </div>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              <input
                type="checkbox"
                checked={acceptedGuidelines}
                onChange={(e) => setAcceptedGuidelines(e.target.checked)}
                required
              />
              <span>
                I agree to {selectedSociety.name} neighbor marketplace guidelines and fair usage.
              </span>
            </label>

            <div className="resident-onboarding-actions">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary resident-onboarding-back"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!acceptedGuidelines}
                className="btn btn-primary btn-lg resident-onboarding-next"
              >
                Enter Society Marketplace <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
