'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { UserRole } from '@/lib/types';
import {
  UserCheck,
  Wrench,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  MapPin,
  KeyRound,
} from 'lucide-react';

export default function AuthScreen() {
  const { login, loginWithGoogle, register } = useMarketplace();

  // Active Tab: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState<string>('resident@society.com');
  const [password, setPassword] = useState<string>('resident123');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Feedback & State
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [googleModalOpen, setGoogleModalOpen] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [googleNameInput, setGoogleNameInput] = useState<string>('');

  // Handle Tab Switch
  const handleRoleTabChange = (role: UserRole) => {
    setActiveRole(role);
    setIsRegistering(false);
    setErrorMessage('');

    if (role === 'CUSTOMER') {
      setEmail('resident@society.com');
      setPassword('resident123');
    } else if (role === 'PROVIDER') {
      setEmail('provider@laundry.com');
      setPassword('provider123');
    } else if (role === 'ADMIN') {
      setEmail('admin@hyperlocal.app');
      setPassword('admin123');
    }
  };

  // 1-Click Fast Fill for Testing
  const handleQuickFill = (
    accountType: 'resident' | 'provider_laundry' | 'provider_tiffin' | 'admin',
  ) => {
    setErrorMessage('');
    setIsRegistering(false);
    if (accountType === 'resident') {
      setActiveRole('CUSTOMER');
      setEmail('resident@society.com');
      setPassword('resident123');
    } else if (accountType === 'provider_laundry') {
      setActiveRole('PROVIDER');
      setEmail('provider@laundry.com');
      setPassword('provider123');
    } else if (accountType === 'provider_tiffin') {
      setActiveRole('PROVIDER');
      setEmail('provider@tiffin.com');
      setPassword('provider123');
    } else if (accountType === 'admin') {
      setActiveRole('ADMIN');
      setEmail('admin@hyperlocal.app');
      setPassword('admin123');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isRegistering) {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      const res = register({
        email,
        password,
        fullName,
        phone,
        role: activeRole,
      });
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } else {
      const res = login(email, password);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    }
  };

  const handleGoogleSignInTrigger = (emailVal?: string, nameVal?: string) => {
    setGoogleModalOpen(false);
    loginWithGoogle(
      activeRole === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER',
      emailVal ||
        (activeRole === 'CUSTOMER' ? 'rahul.google@gmail.com' : 'rajesh.google@gmail.com'),
      nameVal || (activeRole === 'CUSTOMER' ? 'Yash Khandagale' : 'Rajesh Kumar'),
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      {/* ===== LEFT HERO PANEL ===== */}
      <div
        style={{
          flex: '0 0 48%',
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 48px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #042f2e 0%, #0f172a 40%, #1e1a35 80%, #0f172a 100%)',
        }}
        className="auth-hero"
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: '0 0 20px rgba(13,148,136,0.4)',
            }}
          >
            L
          </div>
          <div>
            <div
              style={{
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: '-0.02em',
              }}
            >
              LocalNest
            </div>
            <div
              style={{
                color: '#5eead4',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Society Marketplace
            </div>
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '0.6rem', marginLeft: '4px' }}>
            Beta
          </span>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(13,148,136,0.15)',
              border: '1px solid rgba(13,148,136,0.3)',
              padding: '4px 12px',
              borderRadius: '30px',
              marginBottom: '20px',
            }}
          >
            <MapPin size={12} color="#5eead4" />
            <span style={{ fontSize: '0.72rem', color: '#5eead4', fontWeight: 700 }}>
              GREENFIELD HEIGHTS PILOT
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}
          >
            Your Society,
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #14b8a6, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Now Fully Serviced
            </span>
          </h1>

          <p
            style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: 1.65,
              marginBottom: '32px',
              maxWidth: '380px',
            }}
          >
            One platform for trusted laundry, tiffin, cleaning, repairs and more — delivered inside
            your gated community with secure escrow payments.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                icon: '🔐',
                title: 'Escrow-Protected Payments',
                desc: '100% refund if service is cancelled',
              },
              {
                icon: '✅',
                title: 'Society-Verified Providers',
                desc: 'Background-checked, community-rated',
              },
              { icon: '⚡', title: 'On-Demand Dispatch', desc: 'Uber-style real-time booking' },
              {
                icon: '📦',
                title: 'Smart Subscriptions',
                desc: 'Daily tiffin, weekly laundry — auto-managed',
              },
            ].map((feat) => (
              <div
                key={feat.title}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {feat.icon}
                </div>
                <div>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.88rem' }}>
                    {feat.title}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '1px' }}>
                    {feat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            padding: '20px 0',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {[
            { value: '2,180+', label: 'Orders Fulfilled' },
            { value: '6', label: 'Service Types' },
            { value: '100%', label: 'Escrow Protected' },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  color: '#14b8a6',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {s.value}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT AUTH PANEL ===== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          overflowY: 'auto',
          minHeight: '100vh',
        }}
      >
        {/* Mobile-only logo (shown when hero panel is hidden) */}
        <div
          className="auth-mobile-logo"
          style={{
            textAlign: 'center',
            marginBottom: '24px',
            display: 'none',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255,255,255,0.08)',
              padding: '6px 16px',
              borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.12)',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              L
            </div>
            <span
              style={{
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.05rem',
                letterSpacing: '-0.02em',
              }}
            >
              LocalNest
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              Pilot Society
            </span>
          </div>
          <h1
            style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}
          >
            Hyperlocal Services Marketplace
          </h1>
        </div>

        {/* Main Authentication Card */}
        <div
          className="card"
          style={{
            maxWidth: 'min(480px, 100%)',
            width: '100%',
            padding: '28px 24px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid rgba(255,255,255,0.15)',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        >
          {/* Role Selector Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-subtle)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleTabChange('CUSTOMER')}
              className={`btn btn-sm ${activeRole === 'CUSTOMER' ? 'btn-primary' : ''}`}
              style={{
                flex: 1,
                borderRadius: '8px',
                fontSize: '0.78rem',
                padding: '8px 4px',
                color: activeRole === 'CUSTOMER' ? '#fff' : 'var(--text-muted)',
                minHeight: '38px',
                minWidth: 0,
                justifyContent: 'center',
              }}
            >
              <UserCheck size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Resident
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('PROVIDER')}
              className={`btn btn-sm ${activeRole === 'PROVIDER' ? 'btn-primary' : ''}`}
              style={{
                flex: 1,
                borderRadius: '8px',
                fontSize: '0.78rem',
                padding: '8px 4px',
                color: activeRole === 'PROVIDER' ? '#fff' : 'var(--text-muted)',
                minHeight: '38px',
                minWidth: 0,
                justifyContent: 'center',
              }}
            >
              <Wrench size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Provider
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('ADMIN')}
              className={`btn btn-sm ${activeRole === 'ADMIN' ? 'btn-primary' : ''}`}
              style={{
                flex: 1,
                borderRadius: '8px',
                fontSize: '0.78rem',
                padding: '8px 4px',
                color: activeRole === 'ADMIN' ? '#fff' : 'var(--text-muted)',
                minHeight: '38px',
                minWidth: 0,
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Admin
              </span>
            </button>
          </div>

          {/* Title for Selected Persona */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {activeRole === 'CUSTOMER' &&
                (isRegistering ? 'Register as Society Resident' : 'Resident Sign In')}
              {activeRole === 'PROVIDER' &&
                (isRegistering ? 'Join as Local Provider' : 'Service Provider Sign In')}
              {activeRole === 'ADMIN' && 'Platform Admin Sign In'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeRole === 'CUSTOMER' &&
                'Book verified society services and manage recurring daily needs.'}
              {activeRole === 'PROVIDER' &&
                'Manage society service orders, recurring fulfillment, and earnings.'}
              {activeRole === 'ADMIN' &&
                'Verify providers, monitor platform GMV, disputes, and take-rate rules.'}
            </p>
          </div>

          {/* Google OAuth Sign-in Button (For Resident & Provider) */}
          {activeRole !== 'ADMIN' && (
            <div style={{ marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(true)}
                className="btn btn-secondary btn-full"
                style={{
                  padding: '11px',
                  border: '1.5px solid var(--border-light)',
                  background: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Google G SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  or with email
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
              </div>
            </div>
          )}

          {/* Email & Password Form */}
          <form
            onSubmit={handleEmailSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {isRegistering && (
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder={
                    activeRole === 'CUSTOMER' ? 'e.g. Yash Khandagale' : 'e.g. Rajesh Kumar'
                  }
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            )}

            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {isRegistering && (
              <div>
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  background: 'var(--accent-rose-light)',
                  color: 'var(--accent-rose)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '4px' }}
            >
              {isRegistering ? 'Complete Registration' : 'Sign In'} <ArrowRight size={16} />
            </button>

            {/* Toggle Register/Login (Not for admin) */}
            {activeRole !== 'ADMIN' && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                {isRegistering ? (
                  <>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        setErrorMessage('');
                      }}
                      style={{ color: 'var(--primary)', fontWeight: 700 }}
                    >
                      Sign In instead
                    </button>
                  </>
                ) : (
                  <>
                    New to {activeRole === 'CUSTOMER' ? 'the society' : 'the marketplace'}?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setErrorMessage('');
                      }}
                      style={{ color: 'var(--primary)', fontWeight: 700 }}
                    >
                      Create an account
                    </button>
                  </>
                )}
              </div>
            )}
          </form>

          {/* 1-Click Test Accounts Tray */}
          <div
            style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px dashed var(--border-light)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}
            >
              <KeyRound size={13} color="var(--primary)" />
              <span>TEST LOGINS (CLICK TO AUTO-FILL):</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '6px',
              }}
            >
              <button
                type="button"
                onClick={() => handleQuickFill('resident')}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.72rem',
                  padding: '6px 8px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  minHeight: '38px',
                  minWidth: 0,
                }}
              >
                🏡 <strong>Resident</strong> (Flat A-402)
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('provider_laundry')}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.72rem',
                  padding: '6px 8px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  minHeight: '38px',
                  minWidth: 0,
                }}
              >
                🧺 <strong>Raj Laundry</strong>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('provider_tiffin')}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.72rem',
                  padding: '6px 8px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  minHeight: '38px',
                  minWidth: 0,
                }}
              >
                🍱 <strong>FreshBite Tiffin</strong>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.72rem',
                  padding: '6px 8px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  minHeight: '38px',
                  minWidth: 0,
                }}
              >
                🛡️ <strong>Platform Admin</strong>
              </button>
            </div>

            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginTop: '8px',
                textAlign: 'center',
              }}
            >
              All sample passwords: <code>resident123</code> / <code>provider123</code> /{' '}
              <code>admin123</code>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sign-in Interactive Modal Simulation */}
      {googleModalOpen && (
        <div className="modal-overlay" onClick={() => setGoogleModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px' }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Choose a Google Account</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  to continue to LocalNest ({activeRole})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
              <div
                onClick={() =>
                  handleGoogleSignInTrigger(
                    activeRole === 'CUSTOMER' ? 'rahul.sharma@gmail.com' : 'rajesh.kumar@gmail.com',
                    activeRole === 'CUSTOMER' ? 'Yash Khandagale' : 'Rajesh Kumar',
                  )
                }
                className="card card-hover"
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#4285F4',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {activeRole === 'CUSTOMER' ? 'R' : 'R'}
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {activeRole === 'CUSTOMER' ? 'Yash Khandagale' : 'Rajesh Kumar'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {activeRole === 'CUSTOMER'
                      ? 'rahul.sharma@gmail.com'
                      : 'rajesh.kumar@gmail.com'}
                  </div>
                </div>
              </div>

              {/* Or enter another Google email */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                <div
                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}
                >
                  Or test with new Google identity:
                </div>
                <input
                  type="text"
                  placeholder="Your Name (e.g. Priya Nair)"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '6px', fontSize: '0.85rem', padding: '8px 12px' }}
                />
                <input
                  type="email"
                  placeholder="Google email (e.g. priya@gmail.com)"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '10px', fontSize: '0.85rem', padding: '8px 12px' }}
                />
                <button
                  type="button"
                  onClick={() => handleGoogleSignInTrigger(googleEmailInput, googleNameInput)}
                  className="btn btn-primary btn-full btn-sm"
                >
                  Continue with this Account
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
