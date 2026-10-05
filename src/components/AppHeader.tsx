'use client';

import React from 'react';
import { useMarketplace } from '@/lib/store';
import { 
  Building2, LogOut, MapPin, Bell, 
  X, ShieldCheck, User, Wrench, ShieldAlert 
} from 'lucide-react';

export default function AppHeader() {
  const { 
    currentUser, 
    selectedSociety, 
    societies, 
    setSelectedSociety, 
    logout, 
    notifications, 
    dismissNotification,
    providers,
    activeProviderId 
  } = useMarketplace();

  if (!currentUser) return null;

  const activeProvider = providers.find(p => p.id === activeProviderId);

  return (
    <>
      <header className="glass-banner" style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Logo & Society */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)', 
                borderRadius: '8px', 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: '#fff'
              }}>
                L
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  LocalNest
                  <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    Pilot
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  Hyperlocal Society Marketplace
                </div>
              </div>
            </div>

            {/* Society Pill / Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
              <MapPin size={13} color="#14b8a6" />
              <select 
                value={selectedSociety.id}
                onChange={(e) => {
                  const s = societies.find(soc => soc.id === e.target.value);
                  if (s) setSelectedSociety(s);
                }}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '0.78rem', 
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {societies.map(soc => (
                  <option key={soc.id} value={soc.id} style={{ color: '#0f172a', background: '#fff' }}>
                    {soc.name} ({soc.totalFlats.toLocaleString()} flats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Session Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', padding: '5px 12px', borderRadius: '25px' }}>
              {/* Role specific icon */}
              {currentUser.role === 'CUSTOMER' && <User size={15} color="#14b8a6" />}
              {currentUser.role === 'PROVIDER' && <Wrench size={15} color="#f59e0b" />}
              {currentUser.role === 'ADMIN' && <ShieldCheck size={15} color="#38bdf8" />}

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  {currentUser.role === 'PROVIDER' && activeProvider 
                    ? activeProvider.businessName 
                    : currentUser.fullName}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {currentUser.role === 'CUSTOMER' && (currentUser.flatNumber || 'Resident')}
                  {currentUser.role === 'PROVIDER' && (activeProvider?.status === 'VERIFIED' ? 'Verified Provider' : 'Provider (Pending Review)')}
                  {currentUser.role === 'ADMIN' && 'Platform Admin'}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: '#fff', 
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '0.75rem',
                padding: '5px 10px',
                borderRadius: '8px'
              }}
              title="Sign out of current account"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Notification Toast Banner */}
      {notifications.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(90deg, #0f766e 0%, #0d9488 100%)', 
          color: '#fff', 
          padding: '7px 16px', 
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={14} />
              <span>{notifications[0]}</span>
            </div>
            <button 
              onClick={() => dismissNotification(0)}
              style={{ color: '#fff', opacity: 0.8, padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
