'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { Service, Provider, Order } from '@/lib/types';
import BookingModal from './BookingModal';
import ReviewModal from './ReviewModal';
import ComplaintModal from './ComplaintModal';
import { 
  Home, Compass, Clock, RefreshCw, Tag, 
  HelpCircle, Search, Star, ShieldCheck, MapPin, 
  Calendar, Check, AlertCircle, Sparkles, Shirt, 
  UtensilsCrossed, Car, Zap, Snowflake, ArrowRight, 
  ChevronRight, Pause, Play, CheckCircle2, Phone,
  Bell, Megaphone, Wrench, X
} from 'lucide-react';

export default function CustomerPortal() {
  const { 
    currentUser,
    selectedSociety,
    categories, 
    providers, 
    services, 
    orders, 
    subscriptions, 
    coupons, 
    reviews, 
    complaints,
    notices,
    updateSubscriptionStatus,
    cancelOrder 
  } = useMarketplace();

  // Active Tab: 'home' | 'explore' | 'orders' | 'subscriptions' | 'offers' | 'support'
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'orders' | 'subscriptions' | 'offers' | 'support'>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Modals
  const [bookingService, setBookingService] = useState<{ service: Service; provider: Provider } | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [complaintOrder, setComplaintOrder] = useState<Order | null>(null);
  const [viewingProvider, setViewingProvider] = useState<Provider | null>(null);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);

  // Filter providers based on search, category and society
  const filteredProviders = providers.filter(p => {
    // Check society support
    const servesSociety = p.supportedSocieties.includes(selectedSociety.id);
    if (!servesSociety) return false;

    // Verified toggle
    if (verifiedOnly && p.status !== 'VERIFIED') return false;

    // Category filter
    if (selectedCategorySlug !== 'all') {
      const cat = categories.find(c => c.slug === selectedCategorySlug);
      if (cat && p.categoryId !== cat.id) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.businessName.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCat = p.categoryName?.toLowerCase().includes(q);
      // check if any service matches
      const matchSrv = services.some(s => s.providerId === p.id && (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)));
      return matchName || matchDesc || matchCat || matchSrv;
    }

    return true;
  });

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'laundry': return <Shirt size={20} />;
      case 'tiffin': return <UtensilsCrossed size={20} />;
      case 'cleaning': return <Sparkles size={20} />;
      case 'car-wash': return <Car size={20} />;
      case 'electrician': return <Zap size={20} />;
      case 'ac-service': return <Snowflake size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  const getStatusBadge = (status: Order['status']) => {
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
      case 'DISPUTED':
        return <span className="badge badge-rose">Disputed</span>;
      default:
        return <span className="badge badge-slate">{status}</span>;
    }
  };

  // Filter notices for this resident's society
  const societyNotices = notices.filter(n =>
    n.isActive &&
    !dismissedNoticeIds.includes(n.id) &&
    (n.societyId === 'ALL' || n.societyId === selectedSociety.id)
  );

  const getNoticeAccentColor = (type: string, priority: string) => {
    if (priority === 'URGENT') return { bg: '#fff1f2', border: '#fca5a5', icon: '#ef4444' };
    switch(type) {
      case 'MAINTENANCE': return { bg: '#fffbeb', border: '#fcd34d', icon: '#d97706' };
      case 'ALERT': return { bg: '#fff1f2', border: '#fca5a5', icon: '#ef4444' };
      case 'SERVICE_UPDATE': return { bg: '#eff6ff', border: '#93c5fd', icon: '#2563eb' };
      default: return { bg: '#f0fdfa', border: '#5eead4', icon: '#0d9488' };
    }
  };

  const getNoticeIcon = (type: string) => {
    switch(type) {
      case 'MAINTENANCE': return <Wrench size={15} />;
      case 'ALERT': return <AlertCircle size={15} />;
      case 'SERVICE_UPDATE': return <RefreshCw size={15} />;
      default: return <Megaphone size={15} />;
    }
  };

  return (
    <div style={{ paddingBottom: '90px', minHeight: '100vh' }}>
      
      {/* Customer Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border-light)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                Good day, {currentUser?.fullName || 'Neighbor'} 👋
              </h1>
              {currentUser?.flatNumber && (
                <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                  {currentUser.flatNumber}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={14} color="var(--primary)" />
              {selectedSociety.name} ({selectedSociety.totalFlats.toLocaleString()} Flats Pilot)
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <div style={{ display: 'flex', gap: '6px' }} className="desktop-tabs">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'explore', label: 'Explore Services', icon: Compass },
              { id: 'orders', label: `My Orders (${orders.length})`, icon: Clock },
              { id: 'subscriptions', label: `Subscriptions (${subscriptions.filter(s => s.status === 'ACTIVE').length})`, icon: RefreshCw },
              { id: 'offers', label: 'Offers', icon: Tag },
              { id: 'support', label: 'Support & Tickets', icon: HelpCircle },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="container" style={{ marginTop: '20px' }}>

        {/* ============================================================== */}
        {/* TAB 1: HOME */}
        {/* ============================================================== */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Search Banner */}
            <div style={{ 
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
              color: '#fff', 
              borderRadius: 'var(--radius-lg)', 
              padding: '28px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
                <span className="badge badge-emerald" style={{ marginBottom: '10px' }}>
                  Society Verified Marketplace
                </span>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: '8px' }}>
                  What do you need done today?
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '18px' }}>
                  Book trusted neighborhood laundry, home cleaning, daily tiffin or emergency repairs right inside {selectedSociety.name}.
                </p>

                {/* Instant Search Bar */}
                <div style={{ display: 'flex', background: '#fff', borderRadius: 'var(--radius-md)', padding: '6px 10px', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-lg)' }}>
                  <Search size={20} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search 'laundry', 'tiffin', 'AC service', 'Raj Cleaners'..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveTab('explore');
                    }}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: 'var(--text-main)' }}
                  />
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="btn btn-primary btn-sm"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Society Notices Board */}
            {societyNotices.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Bell size={16} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Society Notices</h3>
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>{societyNotices.length} new</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {societyNotices.map(notice => {
                    const accent = getNoticeAccentColor(notice.type, notice.priority);
                    return (
                      <div
                        key={notice.id}
                        style={{
                          background: accent.bg,
                          border: `1px solid ${accent.border}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px', background: accent.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent.icon }}>
                          {getNoticeIcon(notice.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{notice.title}</span>
                            {notice.priority === 'URGENT' && (
                              <span className="badge badge-rose" style={{ fontSize: '0.6rem' }}>URGENT</span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>{notice.content}</p>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', display: 'flex', gap: '10px' }}>
                            <span>📍 {notice.societyName === 'All Societies' ? selectedSociety.name : notice.societyName}</span>
                            <span>{new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setDismissedNoticeIds(prev => [...prev, notice.id])}
                          title="Dismiss notice"
                          style={{ flexShrink: 0, color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Categories Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Popular Near You</h3>
                <button 
                  onClick={() => { setSelectedCategorySlug('all'); setActiveTab('explore'); }}
                  style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategorySlug(cat.slug);
                      setActiveTab('explore');
                    }}
                    className="card card-hover"
                    style={{ 
                      padding: '16px 12px', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: 'var(--primary-light)', 
                      color: 'var(--primary)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {getCategoryIcon(cat.slug)}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {cat.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Subscriptions Spotlight Widget */}
            {subscriptions.filter(s => s.status === 'ACTIVE').length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Active Subscriptions</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('subscriptions')}
                    style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    Manage
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {subscriptions.filter(s => s.status === 'ACTIVE').map(sub => (
                    <div key={sub.id} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', marginBottom: '4px' }}>
                            {sub.frequency.replace('_', ' ')}
                          </span>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.serviceName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>by {sub.providerName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{sub.monthlyPrice}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>/month</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-light)', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Clock size={13} /> Next Delivery: <strong>Tomorrow ({sub.scheduledTimeSlot})</strong>
                        </div>
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'PAUSED')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        >
                          <Pause size={12} /> Pause
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Providers Near You */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Verified Providers Serving {selectedSociety.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Only authentic providers with background verification and genuine completed orders.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className="btn btn-secondary btn-sm"
                >
                  See All Providers
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredProviders.slice(0, 4).map(provider => {
                  const provServices = services.filter(s => s.providerId === provider.id && s.isActive);
                  return (
                    <div key={provider.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {/* Provider Header */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <img 
                            src={provider.avatarUrl || 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120'} 
                            alt={provider.businessName}
                            style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{provider.businessName}</h4>
                              {provider.status === 'VERIFIED' && (
                                <ShieldCheck size={16} color="var(--accent-emerald)" />
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{provider.categoryName}</div>
                            
                            {/* Reliability Metrics */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.78rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#f59e0b' }}>
                                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                {provider.rating > 0 ? provider.rating : 'New'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {provider.completedOrders > 0 ? `${provider.completedOrders.toLocaleString()} completed` : 'New provider'}
                              </span>
                              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                                {provider.onTimeRate}% on-time
                              </span>
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.4 }}>
                          {provider.description}
                        </p>

                        {/* Starting Price & Service tags */}
                        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Starting from</span>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                                ₹{provider.startingPrice} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/{provider.startingPriceUnit}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setViewingProvider(provider)}
                              className="btn btn-secondary btn-sm"
                            >
                              View Services & Reviews
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Primary Service Booking CTA */}
                      {provServices.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <button
                            onClick={() => setBookingService({ service: provServices[0], provider })}
                            className="btn btn-primary btn-full btn-sm"
                          >
                            Book {provServices[0].name.split('/')[0]} <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pilot Society Guarantee Banner */}
            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-glow)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-hover)' }}>
                    LocalNest 100% Society Trust Guarantee
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#115e59', maxWidth: '580px' }}>
                    Payments are held safely by the platform until your service is fulfilled. If any service is delayed or unsatisfactory, our dedicated society mediator resolves or refunds promptly.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('offers')}
                className="btn btn-primary btn-sm"
              >
                Use Code WELCOME100
              </button>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: EXPLORE SERVICES & PROVIDER COMPARISON */}
        {/* ============================================================== */}
        {activeTab === 'explore' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header & Filter Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Explore Local Providers</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Transparent prices, pricing models, and genuine ratings from verified {selectedSociety.name} neighbors.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', cursor: 'pointer', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  <span>Verified Providers Only</span>
                </label>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                onClick={() => setSelectedCategorySlug('all')}
                className={`btn btn-sm ${selectedCategorySlug === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '20px' }}
              >
                All Categories ({providers.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`btn btn-sm ${selectedCategorySlug === cat.slug ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '20px', whiteSpace: 'nowrap' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Provider Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredProviders.map(provider => {
                const provServices = services.filter(s => s.providerId === provider.id && s.isActive);
                const provReviews = reviews.filter(r => r.providerId === provider.id);
                return (
                  <div key={provider.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <img 
                          src={provider.avatarUrl || 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120'} 
                          alt={provider.businessName}
                          style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{provider.businessName}</h3>
                            {provider.status === 'VERIFIED' && (
                              <ShieldCheck size={18} color="var(--accent-emerald)" />
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{provider.categoryName}</div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#f59e0b' }}>
                              <Star size={14} fill="#f59e0b" color="#f59e0b" />
                              {provider.rating > 0 ? provider.rating : 'New'}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              ({provider.reviewCount} reviews)
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              • {provider.completedOrders > 0 ? `${provider.completedOrders} orders` : 'New provider'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                        {provider.description}
                      </p>

                      {/* Services List with Dynamic Pricing Badges */}
                      <div style={{ marginTop: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Available Services & Pricing Models:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {provServices.map(srv => (
                            <div key={srv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>{srv.name}</span>
                                <span className="badge badge-slate" style={{ fontSize: '0.62rem', marginLeft: '6px', padding: '1px 5px' }}>
                                  {srv.pricingModel.replace('_', ' ')}
                                </span>
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                {srv.pricingModel === 'CUSTOM_QUOTATION' ? 'Free Quote' : `₹${srv.basePrice} / ${srv.unitName}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Verified Review Snippet */}
                      {provReviews.length > 0 && (
                        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', borderLeft: '3px solid var(--accent-emerald)', paddingLeft: '8px' }}>
                          "{provReviews[0].comment.slice(0, 110)}..."
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                            — {provReviews[0].customerName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Booking Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => setViewingProvider(provider)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Profile & Rates
                      </button>
                      {provServices.length > 0 && (
                        <button
                          onClick={() => setBookingService({ service: provServices[0], provider })}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ORDERS & TRACKING */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Order History & Live Tracking</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  State machine order lifecycle with transparent escrow protection.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 16px' }}>
                <Clock size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3>No orders placed yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Explore verified providers inside {selectedSociety.name} and book your first service!
                </p>
                <button onClick={() => setActiveTab('explore')} className="btn btn-primary">
                  Explore Services
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => {
                  const hasReviewed = reviews.some(r => r.orderId === order.id);
                  const isCompleted = order.status === 'COMPLETED';
                  const isCancellable = order.status === 'PENDING' || order.status === 'ACCEPTED';

                  return (
                    <div key={order.id} className="card" style={{ padding: '20px' }}>
                      {/* Top Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{order.providerName}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Order #{order.orderNumber} • {order.serviceName}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                            ₹{order.totalAmount}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                            ✓ Razorpay Escrow Paid
                          </span>
                        </div>
                      </div>

                      {/* Schedule & Address Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', margin: '14px 0', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.825rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SCHEDULED FOR</div>
                          <strong>{order.scheduledDate} ({order.scheduledSlot})</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DELIVERY LOCATION</div>
                          <strong>{order.deliveryAddress}</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>PRICING MODEL</div>
                          <strong>{order.pricingModel.replace('_', ' ')} (Qty: {order.itemQuantity})</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>COMMISSION / BREAKDOWN</div>
                          <span>Platform Fee: ₹{order.platformFee} {order.discountAmount > 0 ? `• Saved: ₹${order.discountAmount}` : ''}</span>
                        </div>
                      </div>

                      {/* State Machine Visual Progression */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '2px', background: 'var(--border-light)', zIndex: 0 }}></div>
                        {[
                          { state: 'PENDING', label: 'Requested' },
                          { state: 'ACCEPTED', label: 'Accepted' },
                          { state: 'SCHEDULED', label: 'Scheduled' },
                          { state: 'IN_PROGRESS', label: 'In Progress' },
                          { state: 'COMPLETED', label: 'Completed' },
                        ].map((step, idx) => {
                          const stateOrder = ['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];
                          const currentIdx = stateOrder.indexOf(order.status);
                          const stepIdx = stateOrder.indexOf(step.state);
                          const isDone = currentIdx >= stepIdx && order.status !== 'CANCELLED' && order.status !== 'DISPUTED';
                          const isCurrent = order.status === step.state;

                          return (
                            <div key={step.state} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, position: 'relative' }}>
                              <div style={{ 
                                width: '26px', 
                                height: '26px', 
                                borderRadius: '50%', 
                                background: isDone ? 'var(--primary)' : 'var(--bg-subtle)', 
                                border: isCurrent ? '2px solid var(--primary-hover)' : '1px solid var(--border-light)',
                                color: isDone ? '#fff' : 'var(--text-muted)',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                {isDone ? '✓' : idx + 1}
                              </div>
                              <span style={{ fontSize: '0.68rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' }}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', flexWrap: 'wrap' }}>
                        {isCancellable && (
                          <button
                            onClick={() => cancelOrder(order.id, 'Resident requested cancellation')}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--accent-rose)' }}
                          >
                            Cancel Booking
                          </button>
                        )}

                        <button
                          onClick={() => setComplaintOrder(order)}
                          className="btn btn-secondary btn-sm"
                        >
                          Raise Dispute / Support
                        </button>

                        {isCompleted && !hasReviewed && (
                          <button
                            onClick={() => setReviewOrder(order)}
                            className="btn btn-primary btn-sm"
                          >
                            <Star size={14} /> Rate & Review Provider
                          </button>
                        )}

                        {isCompleted && hasReviewed && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                            ✓ Review Submitted
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SUBSCRIPTIONS */}
        {/* ============================================================== */}
        {activeTab === 'subscriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Recurring Household Subscriptions</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage daily tiffins, morning car washes, and weekly deep cleaning. No hidden fees, cancel anytime.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {subscriptions.map(sub => {
                const isActive = sub.status === 'ACTIVE';
                return (
                  <div key={sub.id} className="card" style={{ padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className={`badge ${isActive ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                          {sub.status} • {sub.frequency.replace('_', ' ')}
                        </span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px' }}>{sub.serviceName}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {sub.providerName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>₹{sub.monthlyPrice}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>per month</span>
                      </div>
                    </div>

                    <div style={{ margin: '16px 0', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Delivery Time Slot:</span>
                        <strong>{sub.scheduledTimeSlot}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Next Service Date:</span>
                        <strong>{sub.nextServiceDate}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Next Monthly Renewal:</span>
                        <span>{sub.renewalDate}</span>
                      </div>
                    </div>

                    {/* Subscription Actions */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                      {isActive ? (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'PAUSED')}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <Pause size={14} /> Pause Delivery
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'ACTIVE')}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <Play size={14} /> Resume Delivery
                        </button>
                      )}

                      <button
                        onClick={() => updateSubscriptionStatus(sub.id, 'CANCELLED')}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--accent-rose)' }}
                      >
                        Cancel Plan
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: OFFERS & COUPONS */}
        {/* ============================================================== */}
        {activeTab === 'offers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Offers & Society Discounts</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Exclusive discounts negotiated for residents of {selectedSociety.name}.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {coupons.filter(c => c.isActive).map(coupon => (
                <div key={coupon.id} className="card" style={{ borderLeft: '4px solid var(--primary)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.68rem', marginBottom: '4px' }}>
                        {coupon.discountType.replace('_', ' ')}
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{coupon.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {coupon.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ background: 'var(--bg-subtle)', border: '1.5px dashed var(--primary)', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                      {coupon.code}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(coupon.code);
                        setActiveTab('explore');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Use Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: SUPPORT & COMPLAINTS */}
        {/* ============================================================== */}
        {activeTab === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Society Resident Support & Disputes</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Track complaints and refunds with guaranteed platform mediation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {complaints.map(comp => (
                <div key={comp.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className={`badge ${comp.status === 'RESOLVED' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                        {comp.status}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>Ticket #{comp.ticketNumber}</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Provider: {comp.providerName} • Order #{comp.orderNumber}
                      </div>
                    </div>
                  </div>

                  <div style={{ margin: '12px 0', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                    <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '4px' }}>
                      Category: {comp.category}
                    </strong>
                    <p style={{ color: 'var(--text-muted)' }}>{comp.description}</p>
                  </div>

                  {comp.resolution && (
                    <div style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600 }}>
                      Resolution: {comp.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Support Hotline Info */}
            <div className="card" style={{ background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Phone size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Local Society Operations Desk</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Direct support for {selectedSociety.name}: Available daily 8:00 AM – 9:00 PM for on-site mediation.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Provider Details View Drawer/Modal */}
      {viewingProvider && (
        <div className="modal-overlay" onClick={() => setViewingProvider(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <img 
                  src={viewingProvider.avatarUrl} 
                  alt={viewingProvider.businessName}
                  style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{viewingProvider.businessName}</h2>
                    {viewingProvider.status === 'VERIFIED' && <ShieldCheck size={18} color="var(--accent-emerald)" />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewingProvider.categoryName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>★ {viewingProvider.rating}</span>
                    <span>• {viewingProvider.completedOrders} orders completed</span>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>• {viewingProvider.onTimeRate}% on-time</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingProvider(null)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
              {viewingProvider.description}
            </p>

            {/* Provider's Services with Dynamic Booking Buttons */}
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Services & Pricing:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {services.filter(s => s.providerId === viewingProvider.id && s.isActive).map(service => (
                <div key={service.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{service.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{service.description.slice(0, 70)}...</div>
                    <span className="badge badge-slate" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                      Model: {service.pricingModel.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                      {service.pricingModel === 'CUSTOM_QUOTATION' ? 'Free Quote' : `₹${service.basePrice}`}
                    </div>
                    <button
                      onClick={() => {
                        setViewingProvider(null);
                        setBookingService({ service, provider: viewingProvider });
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '4px' }}
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Verified Reviews */}
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Society Resident Reviews:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {reviews.filter(r => r.providerId === viewingProvider.id).map(rev => (
                <div key={rev.id} style={{ background: '#fff', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{rev.customerName}</strong>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(rev.rating)}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{rev.comment}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Booking Modal */}
      {bookingService && (
        <BookingModal
          service={bookingService.service}
          provider={bookingService.provider}
          onClose={() => setBookingService(null)}
          onSuccess={() => {
            setBookingService(null);
            setActiveTab('orders');
          }}
        />
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
        />
      )}

      {/* Dispute / Complaint Modal */}
      {complaintOrder && (
        <ComplaintModal
          order={complaintOrder}
          onClose={() => setComplaintOrder(null)}
        />
      )}

      {/* Bottom Navigation for Mobile / Tablet */}
      <nav className="mobile-nav">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'explore', label: 'Explore', icon: Compass },
          { id: 'orders', label: 'Orders', icon: Clock },
          { id: 'subscriptions', label: 'Recurring', icon: RefreshCw },
          { id: 'offers', label: 'Offers', icon: Tag },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
