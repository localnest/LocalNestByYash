'use client';

import React, { useState, useEffect } from 'react';
import { useMarketplace } from '@/lib/store';
import { getCoveredSocieties } from '@/lib/geo';
import {
  LogOut,
  MapPin,
  Bell,
  X,
  ShieldCheck,
  User,
  Wrench,
  Navigation,
  Globe,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import { useScrollLock } from '@/lib/hooks/useScrollLock';

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('hg_dark_mode');
      if (stored !== null) return stored === 'true';
    } catch {}
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('hg_dark_mode', String(dark));
    } catch {}
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);
  return [dark, toggle];
}

export default function AppHeader() {
  const [dark, toggle] = useDarkMode();
  const {
    currentUser,
    selectedSociety,
    societies,
    setSelectedSociety,
    logout,
    notifications,
    dismissNotification,
    providers,
    activeProviderId,
    language,
    setLanguage,
    t,
  } = useMarketplace();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useScrollLock(isMobileMenuOpen, () => setIsMobileMenuOpen(false));

  if (!currentUser) return null;

  const activeProvider = providers.find((p) => p.id === activeProviderId);

  return (
    <>
      <header className="app-header-bar">
        <div
          className="container header-content-wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Logo & Society */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: 0,
            }}
          >
            <div className="brand-emblem-wrap">
              <div className="brand-emblem">L</div>
              <div>
                <div className="brand-title-text">
                  Local<span className="brand-title-accent">Nest</span>
                  <span className="brand-micro-pill">
                    <span className="pulse-dot-live" />
                    Pilot
                  </span>
                </div>
                <div className="brand-subtitle-text">Hyperlocal Society Marketplace</div>
              </div>
            </div>

            {/* Society Pill — varies by role (Desktop only; on mobile it is in the sidebar drawer) */}
            <div className="desktop-only">
              {currentUser.role === 'ADMIN' ? (
                /* Admin: full society switcher across all societies */
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 8px',
                    borderRadius: '20px',
                    maxWidth: '180px',
                    minWidth: 0,
                  }}
                >
                  <MapPin size={13} color="#14b8a6" style={{ flexShrink: 0 }} />
                  <select
                    value={selectedSociety.id}
                    onChange={(e) => {
                      const s = societies.find((soc) => soc.id === e.target.value);
                      if (s) setSelectedSociety(s);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                      maxWidth: '140px',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {societies.map((soc) => (
                      <option
                        key={soc.id}
                        value={soc.id}
                        style={{ color: '#0f172a', background: '#fff' }}
                      >
                        {soc.name} ({soc.totalFlats.toLocaleString()} flats)
                      </option>
                    ))}
                  </select>
                </div>
              ) : currentUser.role === 'PROVIDER' && activeProvider ? (
                /* Provider: show their actual service coverage footprint */
                (() => {
                  const covered = getCoveredSocieties(activeProvider, societies);
                  const radiusLabel =
                    activeProvider.coverageMode === 'RADIUS'
                      ? `${activeProvider.maxServiceDistanceKm ?? 8} km radius`
                      : 'Selected societies';
                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        cursor: 'default',
                        userSelect: 'none',
                        maxWidth: '220px',
                        minWidth: 0,
                      }}
                      title={covered.map((s) => s.name).join(', ') || 'No societies covered yet'}
                    >
                      <Navigation size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {covered.length > 0
                          ? `Covers ${covered.length} ${covered.length === 1 ? 'society' : 'societies'} · ${radiusLabel}`
                          : 'No coverage set'}
                      </span>
                    </div>
                  );
                })()
              ) : (
                /* Resident: static home-society label — they live in one place */
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    cursor: 'default',
                    userSelect: 'none',
                    maxWidth: '190px',
                    minWidth: 0,
                  }}
                  title={`You are registered at ${selectedSociety.name}`}
                >
                  <MapPin size={13} color="#14b8a6" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {selectedSociety.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="mobile-only header-btn-sleek"
            style={{
              borderRadius: '9999px',
              padding: '6px 14px',
              gap: '6px',
            }}
            aria-label="Open mobile menu"
          >
            <Menu size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 650 }}>Menu</span>
          </button>

          {/* Desktop User Session Info & Controls */}
          <div
            className="desktop-only"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'nowrap',
              minWidth: 0,
              justifyContent: 'flex-end',
            }}
          >
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="header-btn-sleek"
              style={{
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                padding: 0,
                justifyContent: 'center',
              }}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              className="header-btn-sleek"
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
              title="Select Language"
              aria-label="Select Language"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>

            <div className="header-user-card">
              {/* Role specific icon */}
              <div className="header-user-avatar-badge">
                {currentUser.role === 'CUSTOMER' && <User size={15} />}
                {currentUser.role === 'PROVIDER' && <Wrench size={15} />}
                {currentUser.role === 'ADMIN' && <ShieldCheck size={15} />}
              </div>

              <div style={{ textAlign: 'left', minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.role === 'PROVIDER' && activeProvider
                    ? activeProvider.businessName
                    : currentUser.fullName}
                </div>
                <div
                  className="header-user-meta"
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.role === 'CUSTOMER' && (currentUser.flatNumber || 'Resident')}
                  {currentUser.role === 'PROVIDER' &&
                    (activeProvider?.status === 'VERIFIED' ? 'Verified Provider' : 'Provider')}
                  {currentUser.role === 'ADMIN' && 'Admin'}
                </div>
              </div>
            </div>

            {/* Language Switcher — Only for Provider & Customer (Resident) - Desktop pill view */}
            {(currentUser.role === 'CUSTOMER' || currentUser.role === 'PROVIDER') && (
              <div
                className="desktop-only"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-subtle)',
                  borderRadius: '20px',
                  padding: '2px 4px',
                  border: '1px solid var(--border-light)',
                  flexShrink: 0,
                }}
                title={t.selectLanguage}
              >
                <Globe
                  size={13}
                  color="var(--primary)"
                  style={{ margin: '0 4px', flexShrink: 0 }}
                />
                {(['en', 'hi', 'mr'] as const).map((lang) => {
                  const isSelected = language === lang;
                  const label = lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'मराठी';
                  return (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      style={{
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 800 : 550,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="header-btn-sleek"
              style={{
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                background: 'rgba(239, 68, 68, 0.04)',
              }}
              title="Sign out of current account"
            >
              <LogOut size={14} />
              {t.signOut}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Sidebar) */}
      {isMobileMenuOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: '#fff',
                  }}
                >
                  L
                </div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  LocalNest
                </strong>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-body">
              {/* User Profile Card */}
              <div className="mobile-profile-card">
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {currentUser.role === 'CUSTOMER' && <User size={22} />}
                  {currentUser.role === 'PROVIDER' && <Wrench size={22} />}
                  {currentUser.role === 'ADMIN' && <ShieldCheck size={22} />}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontWeight: 750,
                      fontSize: '0.975rem',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentUser.role === 'PROVIDER' && activeProvider
                      ? activeProvider.businessName
                      : currentUser.fullName}
                  </div>
                  <div
                    style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}
                  >
                    {currentUser.role === 'CUSTOMER' && (currentUser.flatNumber || 'Resident')}
                    {currentUser.role === 'PROVIDER' &&
                      (activeProvider?.status === 'VERIFIED' ? 'Verified Provider' : 'Provider')}
                    {currentUser.role === 'ADMIN' && 'Administrator'}
                  </div>
                </div>
              </div>

              {/* Society / Coverage Section */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-label">
                  {currentUser.role === 'PROVIDER' ? 'Service Coverage' : 'Society Location'}
                </span>
                {currentUser.role === 'ADMIN' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <MapPin size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <select
                      value={selectedSociety.id}
                      onChange={(e) => {
                        const s = societies.find((soc) => soc.id === e.target.value);
                        if (s) setSelectedSociety(s);
                      }}
                      className="form-input"
                      style={{
                        padding: '4px 6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: 'none',
                        background: 'transparent',
                        minHeight: 'auto',
                      }}
                    >
                      {societies.map((soc) => (
                        <option key={soc.id} value={soc.id}>
                          {soc.name} ({soc.totalFlats.toLocaleString()} flats)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : currentUser.role === 'PROVIDER' && activeProvider ? (
                  (() => {
                    const covered = getCoveredSocieties(activeProvider, societies);
                    const radiusLabel =
                      activeProvider.coverageMode === 'RADIUS'
                        ? `${activeProvider.maxServiceDistanceKm ?? 8} km radius`
                        : 'Selected societies';
                    return (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '12px 14px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Navigation size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {covered.length > 0
                              ? `Covers ${covered.length} ${covered.length === 1 ? 'society' : 'societies'}`
                              : 'No coverage configured'}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Mode: {radiusLabel}
                          {covered.length > 0 && (
                            <div
                              style={{
                                marginTop: '4px',
                                fontSize: '0.76rem',
                                color: 'var(--text-subtle)',
                              }}
                            >
                              {covered.map((s) => s.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <MapPin size={16} color="var(--primary)" />
                    <span>{selectedSociety.name}</span>
                  </div>
                )}
              </div>

              {/* Appearance Mode */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-label">Theme Appearance</span>
                <button
                  onClick={toggle}
                  className="btn btn-secondary btn-full"
                  style={{
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    minHeight: '44px',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {dark ? <Sun size={17} /> : <Moon size={17} />}
                    {dark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                    Switch
                  </span>
                </button>
              </div>

              {/* Language Selector */}
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-label">Language</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(['en', 'hi', 'mr'] as const).map((lang) => {
                    const isSelected = language === lang;
                    const label = lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी';
                    return (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: isSelected ? 800 : 600,
                          minHeight: '40px',
                          justifyContent: 'center',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Logout Footer */}
            <div className="mobile-drawer-footer">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="btn btn-full"
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  minHeight: '46px',
                  fontWeight: 750,
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                }}
              >
                <LogOut size={16} />
                {t.signOut}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Notification Toast Banner */}
      {notifications.length > 0 && (
        <div className="floating-toast-alert">
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: '12px',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}
            >
              <Bell size={15} style={{ flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-word', fontSize: '0.825rem' }}>
                {notifications[0]}
              </span>
            </div>
            <button
              onClick={() => dismissNotification(0)}
              style={{
                color: '#fff',
                opacity: 0.85,
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                minHeight: '28px',
                minWidth: '28px',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.18)',
                border: 'none',
                borderRadius: '50%',
              }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
