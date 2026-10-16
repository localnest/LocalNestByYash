'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { Service, Provider, Order } from '@/lib/types';
import { isSocietyCovered, getDistanceToSociety } from '@/lib/geo';
import BookingModal from './BookingModal';
import ReviewModal from './ReviewModal';
import ComplaintModal from './ComplaintModal';
import ResidentDispatchCenter from './ResidentDispatchCenter';
import CancellationConfirmModal from './customer/CancellationConfirmModal';
import { useNotification } from '@/features/notifications/notificationContext';
import {
  Home,
  Compass,
  Clock,
  RefreshCw,
  Tag,
  HelpCircle,
  Search,
  Star,
  ShieldCheck,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
  Sparkles,
  Shirt,
  UtensilsCrossed,
  Car,
  Zap,
  Snowflake,
  ArrowRight,
  ChevronRight,
  Pause,
  Play,
  CheckCircle2,
  Phone,
  Bell,
  Megaphone,
  Wrench,
  X,
  Wallet,
  MessageCircle,
  Send,
  Gift,
  TrendingUp,
  ThumbsUp,
} from 'lucide-react';

export default function CustomerPortal() {
  const {
    currentUser,
    selectedSociety,
    societies,
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
    pauseSubscription,
    resumeSubscription,
    skipNextDelivery,
    cancelOrder,
    getWalletBalance,
    getWalletStreak,
    walletTransactions,
    createOrder,
    createServiceRequest,
    sendChatMessage,
    getOrderMessages,
    language,
    setLanguage,
    t,
  } = useMarketplace();

  // Active Tab: 'dispatch' | 'home' | 'explore' | 'orders' | 'subscriptions' | 'offers' | 'support' | 'wallet' | 'notices'
  const [activeTab, setActiveTab] = useState<
    | 'dispatch'
    | 'home'
    | 'explore'
    | 'orders'
    | 'subscriptions'
    | 'offers'
    | 'support'
    | 'wallet'
    | 'notices'
  >('dispatch');
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const { notify } = useNotification();

  // Modals
  const [bookingService, setBookingService] = useState<{
    service: Service;
    provider: Provider;
  } | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [complaintOrder, setComplaintOrder] = useState<Order | null>(null);
  const [cancellationOrder, setCancellationOrder] = useState<Order | null>(null);
  const [viewingProvider, setViewingProvider] = useState<Provider | null>(null);
  const [providerReviewFilter, setProviderReviewFilter] = useState<'ALL' | 'LOCAL'>('ALL');
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);

  // Demand request feedback state
  const [requestFeedback, setRequestFeedback] = useState<string>('');

  // Filter providers based on search, category and geographic coverage
  const filteredProviders = providers.filter((p) => {
    // Check geographic coverage
    const servesSociety = isSocietyCovered(p, selectedSociety, societies);
    if (!servesSociety) return false;

    // Verified toggle
    if (verifiedOnly && p.status !== 'VERIFIED') return false;

    // Category filter
    if (selectedCategorySlug !== 'all') {
      const cat = categories.find((c) => c.slug === selectedCategorySlug);
      if (cat && p.categoryId !== cat.id) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.businessName.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCat = p.categoryName?.toLowerCase().includes(q);
      // check if any service matches
      const matchSrv = services.some(
        (s) =>
          s.providerId === p.id &&
          (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)),
      );
      return matchName || matchDesc || matchCat || matchSrv;
    }

    return true;
  });

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'laundry':
        return <Shirt size={20} />;
      case 'tiffin':
        return <UtensilsCrossed size={20} />;
      case 'cleaning':
        return <Sparkles size={20} />;
      case 'car-wash':
        return <Car size={20} />;
      case 'electrician':
        return <Zap size={20} />;
      case 'ac-service':
        return <Snowflake size={20} />;
      default:
        return <Sparkles size={20} />;
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
      case 'REJECTED':
        return <span className="badge badge-rose">Declined by Provider (Refunded)</span>;
      case 'REFUNDED':
        return <span className="badge badge-emerald">Escrow Refunded ✓</span>;
      case 'DISPUTED':
        return <span className="badge badge-rose">Under Support Mediation</span>;
      default:
        return <span className="badge badge-slate">{status}</span>;
    }
  };

  // Filter notices for this resident's society
  const societyNotices = notices.filter(
    (n) =>
      n.isActive &&
      !dismissedNoticeIds.includes(n.id) &&
      (n.societyId === 'ALL' || n.societyId === selectedSociety.id),
  );

  const getNoticeAccentColor = (type: string, priority: string) => {
    if (priority === 'URGENT') return { bg: '#fff1f2', border: '#fca5a5', icon: '#ef4444' };
    switch (type) {
      case 'MAINTENANCE':
        return { bg: '#fffbeb', border: '#fcd34d', icon: '#d97706' };
      case 'ALERT':
        return { bg: '#fff1f2', border: '#fca5a5', icon: '#ef4444' };
      case 'SERVICE_UPDATE':
        return { bg: '#eff6ff', border: '#93c5fd', icon: '#2563eb' };
      default:
        return { bg: '#f0fdfa', border: '#5eead4', icon: '#0d9488' };
    }
  };

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'MAINTENANCE':
        return <Wrench size={15} />;
      case 'ALERT':
        return <AlertCircle size={15} />;
      case 'SERVICE_UPDATE':
        return <RefreshCw size={15} />;
      default:
        return <Megaphone size={15} />;
    }
  };

  return (
    <div style={{ paddingBottom: '90px', minHeight: '100vh' }}>
      {/* Customer Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--border-light)',
          padding: '16px 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
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
            <div
              style={{
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px',
              }}
            >
              <MapPin size={14} color="var(--primary)" />
              {selectedSociety.name} ({selectedSociety.totalFlats.toLocaleString()} Flats Pilot)
            </div>
          </div>

          {/* Desktop & Mobile Nav Tabs */}
          <div className="scrollable-tabs desktop-tabs" style={{ maxWidth: '100%', minWidth: 0 }}>
            {[
              { id: 'dispatch', label: '⚡ Service Dispatch', icon: Sparkles },
              { id: 'home', label: t.navHome, icon: Home },
              { id: 'explore', label: t.navExplore, icon: Compass },
              { id: 'orders', label: `${t.navOrders} (${orders.length})`, icon: Clock },
              {
                id: 'subscriptions',
                label: `${t.navSubscriptions} (${subscriptions.filter((s) => s.status === 'ACTIVE').length})`,
                icon: RefreshCw,
              },
              { id: 'offers', label: t.navOffers, icon: Tag },
              {
                id: 'notices',
                label: `${t.navNotices} (${notices.filter((n) => n.isActive && (n.societyId === 'ALL' || n.societyId === selectedSociety.id)).length})`,
                icon: Megaphone,
              },
              { id: 'support', label: t.navSupport, icon: HelpCircle },
              { id: 'wallet', label: t.navWallet, icon: Wallet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    minHeight: '36px',
                  }}
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
        {/* TAB 0: UBER-STYLE SERVICE DISPATCH */}
        {/* ============================================================== */}
        {activeTab === 'dispatch' && <ResidentDispatchCenter />}

        {/* ============================================================== */}
        {/* TAB 1: HOME */}
        {/* ============================================================== */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Search Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fff',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
                <span className="badge badge-emerald" style={{ marginBottom: '10px' }}>
                  Society Verified Marketplace
                </span>
                <h2
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.25,
                    marginBottom: '8px',
                  }}
                >
                  What do you need done today?
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '18px' }}>
                  Book trusted neighborhood laundry, home cleaning, daily tiffin or emergency
                  repairs right inside {selectedSociety.name}.
                </p>

                {/* Instant Search Bar */}
                <div
                  style={{
                    display: 'flex',
                    background: '#fff',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 10px',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <Search size={20} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search 'laundry', 'tiffin', 'AC service', 'Raj Cleaners'..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveTab('explore');
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                    }}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <Bell size={16} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Society Notices</h3>
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                    {societyNotices.length} new
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {societyNotices.map((notice) => {
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
                        <div
                          style={{
                            flexShrink: 0,
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: accent.border,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: accent.icon,
                          }}
                        >
                          {getNoticeIcon(notice.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                              marginBottom: '4px',
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                              {notice.title}
                            </span>
                            {notice.priority === 'URGENT' && (
                              <span className="badge badge-rose" style={{ fontSize: '0.6rem' }}>
                                URGENT
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: '0.82rem',
                              color: '#475569',
                              lineHeight: 1.55,
                              margin: 0,
                            }}
                          >
                            {notice.content}
                          </p>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#94a3b8',
                              marginTop: '6px',
                              display: 'flex',
                              gap: '10px',
                            }}
                          >
                            <span>
                              📍{' '}
                              {notice.societyName === 'All Societies'
                                ? selectedSociety.name
                                : notice.societyName}
                            </span>
                            <span>
                              {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setDismissedNoticeIds((prev) => [...prev, notice.id])}
                          title="Dismiss notice"
                          style={{
                            flexShrink: 0,
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Popular Near You</h3>
                <button
                  onClick={() => {
                    setSelectedCategorySlug('all');
                    setActiveTab('explore');
                  }}
                  style={{
                    color: 'var(--primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                }}
              >
                {categories.map((cat) => (
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
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getCategoryIcon(cat.slug)}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cat.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Subscriptions Spotlight Widget */}
            {subscriptions.filter((s) => s.status === 'ACTIVE').length > 0 && (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      Your Active Subscriptions
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    Manage
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: '12px',
                  }}
                >
                  {subscriptions
                    .filter((s) => s.status === 'ACTIVE')
                    .map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <span
                              className="badge badge-emerald"
                              style={{ fontSize: '0.68rem', marginBottom: '4px' }}
                            >
                              {sub.frequency.replace('_', ' ')}
                            </span>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {sub.serviceName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              by {sub.providerName}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                              ₹{sub.monthlyPrice}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                              }}
                            >
                              /month
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px dashed var(--border-light)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <Clock size={13} /> Next Delivery:{' '}
                            <strong>Tomorrow ({sub.scheduledTimeSlot})</strong>
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                    Verified Providers Serving {selectedSociety.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Only authentic providers with background verification and genuine completed
                    orders.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="btn btn-secondary btn-sm"
                >
                  See All Providers
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                  gap: '16px',
                }}
              >
                {filteredProviders.slice(0, 4).map((provider) => {
                  const provServices = services.filter(
                    (s) => s.providerId === provider.id && s.isActive,
                  );
                  const provReviews = reviews.filter((r) => r.providerId === provider.id);
                  return (
                    <div
                      key={provider.id}
                      className="card card-hover"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {/* Provider Header */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <img
                            src={
                              provider.avatarUrl ||
                              'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120'
                            }
                            alt={provider.businessName}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                                {provider.businessName}
                              </h4>
                              {provider.status === 'VERIFIED' && (
                                <ShieldCheck size={16} color="var(--accent-emerald)" />
                              )}
                              {provider.isVacationMode && (
                                <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                                  🏖️ On Vacation
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {provider.categoryName}
                            </div>

                            {/* Reliability Metrics & Hours */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '6px',
                                fontSize: '0.78rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontWeight: 700,
                                  color: '#f59e0b',
                                }}
                              >
                                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                {provider.rating > 0
                                  ? `${provider.rating} (${provReviews.length || provider.reviewCount})`
                                  : 'New'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {provider.completedOrders > 0
                                  ? `${provider.completedOrders.toLocaleString()} completed`
                                  : 'New provider'}
                              </span>
                              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                                {provider.onTimeRate}% on-time
                              </span>
                              {(() => {
                                const dist = getDistanceToSociety(provider, selectedSociety);
                                return dist !== null ? (
                                  <span
                                    className="badge badge-slate"
                                    style={{
                                      fontSize: '0.68rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                    }}
                                  >
                                    <MapPin size={10} /> {dist} km away
                                  </span>
                                ) : null;
                              })()}
                              {provider.travelChargePerKm ? (
                                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                                  🚗 Surcharge past {provider.freeServiceRadiusKm || 0}km
                                </span>
                              ) : null}
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                🕐 {provider.workingHours?.start || '8 AM'} -{' '}
                                {provider.workingHours?.end || '8 PM'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {provider.isVacationMode && (
                          <div
                            style={{
                              marginTop: '8px',
                              fontSize: '0.75rem',
                              color: '#b45309',
                              background: '#fef3c7',
                              padding: '6px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            "
                            {provider.vacationReason ||
                              'Currently taking a break. Resuming orders soon.'}
                            "
                          </div>
                        )}

                        <p
                          style={{
                            fontSize: '0.825rem',
                            color: 'var(--text-muted)',
                            marginTop: '10px',
                            lineHeight: 1.4,
                          }}
                        >
                          {provider.description}
                        </p>

                        {/* Verified Neighbor Review Snippet */}
                        {provReviews.length > 0 && (
                          <div
                            style={{
                              marginTop: '10px',
                              background: '#f8fafc',
                              borderLeft: '3px solid var(--accent-emerald)',
                              padding: '8px 10px',
                              borderRadius: '0 6px 6px 0',
                              fontSize: '0.78rem',
                            }}
                          >
                            <div
                              style={{
                                color: 'var(--text-main)',
                                fontStyle: 'italic',
                                lineHeight: 1.4,
                              }}
                            >
                              "{provReviews[0].comment.slice(0, 95)}..."
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '5px',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                — {provReviews[0].customerName}{' '}
                                {provReviews[0].customerFlat
                                  ? `(${provReviews[0].customerFlat})`
                                  : ''}
                              </span>
                              <span
                                style={{
                                  color: 'var(--accent-emerald)',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                <ShieldCheck size={11} /> Verified Neighbor
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Starting Price & Service tags */}
                        <div
                          style={{
                            marginTop: '14px',
                            paddingTop: '10px',
                            borderTop: '1px solid var(--border-light)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Starting from
                              </span>
                              <div
                                style={{
                                  fontWeight: 800,
                                  fontSize: '1.05rem',
                                  color: 'var(--primary)',
                                }}
                              >
                                ₹{provider.startingPrice}{' '}
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  /{provider.startingPriceUnit}
                                </span>
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
                            onClick={() =>
                              setBookingService({ service: provServices[0], provider })
                            }
                            className="btn btn-primary btn-full btn-sm"
                            style={{
                              background: provider.isVacationMode ? 'var(--bg-subtle)' : undefined,
                              color: provider.isVacationMode ? 'var(--text-muted)' : '#fff',
                              border: provider.isVacationMode
                                ? '1px solid var(--border-light)'
                                : undefined,
                            }}
                          >
                            {provider.isVacationMode
                              ? '🏖️ On Vacation (Booking Paused)'
                              : `Book ${provServices[0].name.split('/')[0]}`}{' '}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pilot Society Guarantee Banner */}
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-glow)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#fff',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-hover)' }}>
                    LocalNest 100% Society Trust Guarantee
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#115e59', maxWidth: '580px' }}>
                    Payments are held safely by the platform until your service is fulfilled. If any
                    service is delayed or unsatisfactory, our dedicated society mediator resolves or
                    refunds promptly.
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveTab('offers')} className="btn btn-primary btn-sm">
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Explore Local Providers</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Transparent prices, pricing models, and genuine ratings from verified{' '}
                  {selectedSociety.name} neighbors.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    background: '#fff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                  }}
                >
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
              {categories.map((cat) => (
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

            {/* Request Service Feedback */}
            {requestFeedback && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  color: '#047857',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{requestFeedback}</span>
              </div>
            )}

            {/* Provider Grid or Empty Demand State */}
            {filteredProviders.length === 0 ? (
              <div
                className="card"
                style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)' }}
              >
                <MapPin size={42} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  No Verified Providers in Your Area Yet
                </h3>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    maxWidth: '480px',
                    margin: '8px auto 18px',
                    lineHeight: 1.5,
                  }}
                >
                  We haven't launched coverage for{' '}
                  {selectedCategorySlug !== 'all'
                    ? categories.find((c) => c.slug === selectedCategorySlug)?.name
                    : 'this category'}{' '}
                  in {selectedSociety.name} yet. Request this service and our society operations
                  team will fast-track partner onboarding for your cluster.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const activeCat =
                      selectedCategorySlug !== 'all'
                        ? categories.find((c) => c.slug === selectedCategorySlug)
                        : categories[0];
                    if (activeCat) {
                      createServiceRequest({
                        societyId: selectedSociety.id,
                        societyName: selectedSociety.name,
                        categoryId: activeCat.id,
                        categoryName: activeCat.name,
                      });
                      setRequestFeedback(
                        `Demand registered for ${activeCat.name} in ${selectedSociety.name}! We will notify you when partners are verified.`,
                      );
                      setTimeout(() => setRequestFeedback(''), 4000);
                    }
                  }}
                  className="btn btn-primary btn-md"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Bell size={16} /> Notify Me / Request This Service
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                  gap: '16px',
                }}
              >
                {filteredProviders.map((provider) => {
                  const provServices = services.filter(
                    (s) => s.providerId === provider.id && s.isActive,
                  );
                  const provReviews = reviews.filter((r) => r.providerId === provider.id);
                  return (
                    <div
                      key={provider.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <img
                            src={
                              provider.avatarUrl ||
                              'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120'
                            }
                            alt={provider.businessName}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {provider.businessName}
                              </h3>
                              {provider.status === 'VERIFIED' && (
                                <ShieldCheck size={18} color="var(--accent-emerald)" />
                              )}
                              {provider.isVacationMode && (
                                <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                                  🏖️ On Vacation
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {provider.categoryName}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '6px',
                                fontSize: '0.78rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700,
                                  color: '#f59e0b',
                                }}
                              >
                                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                {provider.rating > 0 ? provider.rating : 'New'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                ({provider.reviewCount} reviews)
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                •{' '}
                                {provider.completedOrders > 0
                                  ? `${provider.completedOrders} orders`
                                  : 'New provider'}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                • 🕐 {provider.workingHours?.start || '8 AM'} -{' '}
                                {provider.workingHours?.end || '8 PM'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p
                          style={{
                            fontSize: '0.825rem',
                            color: 'var(--text-muted)',
                            marginTop: '12px',
                          }}
                        >
                          {provider.description}
                        </p>

                        {/* Services List with Dynamic Pricing Badges */}
                        <div
                          style={{
                            marginTop: '14px',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Available Services & Pricing Models:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {provServices.map((srv) => (
                              <div
                                key={srv.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 600 }}>{srv.name}</span>
                                  <span
                                    className="badge badge-slate"
                                    style={{
                                      fontSize: '0.62rem',
                                      marginLeft: '6px',
                                      padding: '1px 5px',
                                    }}
                                  >
                                    {srv.pricingModel.replace('_', ' ')}
                                  </span>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                  {srv.pricingModel === 'CUSTOM_QUOTATION'
                                    ? 'Free Quote'
                                    : `₹${srv.basePrice} / ${srv.unitName}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Verified Review Snippet */}
                        {provReviews.length > 0 && (
                          <div
                            style={{
                              marginTop: '12px',
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              fontStyle: 'italic',
                              borderLeft: '3px solid var(--accent-emerald)',
                              paddingLeft: '8px',
                            }}
                          >
                            "{provReviews[0].comment.slice(0, 110)}..."
                            <div
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: 'var(--text-main)',
                                marginTop: '2px',
                              }}
                            >
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
                            onClick={() =>
                              setBookingService({ service: provServices[0], provider })
                            }
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
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ORDERS & TRACKING */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  Order History & Live Tracking
                </h2>
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
                  Explore verified providers inside {selectedSociety.name} and book your first
                  service!
                </p>
                <button onClick={() => setActiveTab('explore')} className="btn btn-primary">
                  Explore Services
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map((order) => {
                  const hasReviewed = reviews.some((r) => r.orderId === order.id);
                  const isCompleted = order.status === 'COMPLETED';
                  const isCancellable = order.status === 'PENDING' || order.status === 'ACCEPTED';

                  return (
                    <div key={order.id} className="card" style={{ padding: '20px' }}>
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
                            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                              {order.providerName}
                            </span>
                            {getStatusBadge(order.status)}
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
                          <div
                            style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}
                          >
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
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            SCHEDULED FOR
                          </div>
                          <strong>
                            {order.scheduledDate} ({order.scheduledSlot})
                          </strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            DELIVERY LOCATION
                          </div>
                          <strong>{order.deliveryAddress}</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            PRICING MODEL
                          </div>
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

                      {/* Uber-Style Door OTP Passcode */}
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
                                Share this 4-digit code with the pro when they arrive at your flat
                                door
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

                      {/* Feature 2: State Machine Visual Progression */}
                      {order.status === 'REJECTED' ? (
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
                            <strong>Decline Reason:</strong> "
                            {order.rejectionReason ||
                              'Provider is currently at maximum capacity for today.'}
                            "
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
                            <CheckCircle2 size={14} /> 100% Escrow refund of ₹{order.totalAmount}{' '}
                            has been returned to your original payment method.
                          </div>
                          <div style={{ marginTop: '10px' }}>
                            <button
                              onClick={() => {
                                setSelectedCategorySlug('all');
                                setActiveTab('explore');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', background: '#fff' }}
                            >
                              Explore Alternative Providers →
                            </button>
                          </div>
                        </div>
                      ) : order.status === 'REFUNDED' ? (
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
                            The platform society mediation desk reviewed this ticket. Full order
                            payment of ₹{order.totalAmount} has been returned to your account.
                          </div>
                        </div>
                      ) : (
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
                            ></div>
                            {[
                              { state: 'PENDING', label: '1. Placed', desc: 'Escrow Paid' },
                              { state: 'ACCEPTED', label: '2. Accepted', desc: 'Provider Ready' },
                              {
                                state: 'SCHEDULED',
                                label: '3. Gate Pass',
                                desc: 'Security Cleared',
                              },
                              {
                                state: 'IN_PROGRESS',
                                label: '4. Active',
                                desc: 'Doorstep Service',
                              },
                              { state: 'COMPLETED', label: '5. Done', desc: 'Signed Off' },
                            ].map((step, idx) => {
                              const stateOrder = [
                                'PENDING',
                                'ACCEPTED',
                                'SCHEDULED',
                                'IN_PROGRESS',
                                'COMPLETED',
                              ];
                              const currentIdx = stateOrder.indexOf(order.status);
                              const stepIdx = stateOrder.indexOf(step.state);
                              const isDone =
                                currentIdx >= stepIdx &&
                                order.status !== 'CANCELLED' &&
                                order.status !== 'DISPUTED';
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
                                      border: isCurrent
                                        ? '2.5px solid #0f766e'
                                        : '1px solid var(--border-light)',
                                      boxShadow: isCurrent
                                        ? '0 0 10px rgba(13, 148, 136, 0.4)'
                                        : undefined,
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
                                Society Gate Pass:{' '}
                                <strong>GP-2026-{order.orderNumber.slice(-4)}</strong> generated for
                                delivery personnel.
                              </span>
                            </div>
                          )}
                        </div>
                      )}

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
                            onClick={() => setCancellationOrder(order)}
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

                        {/* Chat button — available for active/recent orders */}
                        {['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(
                          order.status,
                        ) && (
                          <button
                            onClick={() => {
                              setChatOrderId(order.id);
                              setChatInput('');
                              setChatError('');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                          >
                            <MessageCircle size={13} /> Chat
                          </button>
                        )}

                        {/* Book Again — quick re-booking for completed orders */}
                        {isCompleted &&
                          (() => {
                            const svc = services.find((s) => s.id === order.serviceId);
                            const prov = providers.find((p) => p.id === order.providerId);
                            if (!svc || !prov) return null;
                            return (
                              <button
                                onClick={() => setBookingService({ service: svc, provider: prov })}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                <RefreshCw size={13} /> Book Again
                              </button>
                            );
                          })()}

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
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  Recurring Household Subscriptions
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage daily tiffins, morning car washes, and weekly deep cleaning. No hidden
                  fees, cancel anytime.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '16px',
              }}
            >
              {subscriptions.map((sub) => {
                const isActive = sub.status === 'ACTIVE';
                return (
                  <div key={sub.id} className="card" style={{ padding: '22px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <span
                          className={`badge ${isActive ? 'badge-emerald' : 'badge-amber'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {sub.status} • {sub.frequency.replace('_', ' ')}
                        </span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px' }}>
                          {sub.serviceName}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          by {sub.providerName}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}
                        >
                          ₹{sub.monthlyPrice}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            display: 'block',
                          }}
                        >
                          per month
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        margin: '16px 0',
                        background: 'var(--bg-subtle)',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Delivery Time Slot:</span>
                        <strong>{sub.scheduledTimeSlot}</strong>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Next Service Date:</span>
                        <strong>{sub.nextServiceDate}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Next Monthly Renewal:</span>
                        <span>{sub.renewalDate}</span>
                      </div>
                    </div>

                    {/* Subscription Actions */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        borderTop: '1px solid var(--border-light)',
                        paddingTop: '14px',
                      }}
                    >
                      {isActive ? (
                        <>
                          <button
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 7);
                              pauseSubscription(sub.id, d.toISOString().split('T')[0]);
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            <Pause size={13} /> Pause 7 Days
                          </button>
                          <button
                            onClick={() => {
                              const nextDate =
                                sub.nextServiceDate || new Date().toISOString().split('T')[0];
                              skipNextDelivery(sub.id, nextDate);
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            Skip Next
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => resumeSubscription(sub.id)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <Play size={14} /> Resume Delivery
                          {sub.pausedUntil && (
                            <span style={{ fontSize: '0.7rem', marginLeft: '4px', opacity: 0.8 }}>
                              (paused until {new Date(sub.pausedUntil).toLocaleDateString()})
                            </span>
                          )}
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {coupons
                .filter((c) => c.isActive)
                .map((coupon) => (
                  <div
                    key={coupon.id}
                    className="card"
                    style={{ borderLeft: '4px solid var(--primary)', position: 'relative' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <span
                          className="badge badge-emerald"
                          style={{ fontSize: '0.68rem', marginBottom: '4px' }}
                        >
                          {coupon.discountType.replace('_', ' ')}
                        </span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{coupon.title}</h3>
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          {coupon.description}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '10px',
                        borderTop: '1px dashed var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1.5px dashed var(--primary)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: 'var(--primary)',
                          letterSpacing: '0.04em',
                        }}
                      >
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
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                Society Resident Support & Disputes
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Track complaints and refunds with guaranteed platform mediation.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {complaints.map((comp) => (
                <div key={comp.id} className="card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <span
                        className={`badge ${comp.status === 'RESOLVED' ? 'badge-emerald' : 'badge-amber'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {comp.status}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>
                        Ticket #{comp.ticketNumber}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Provider: {comp.providerName} • Order #{comp.orderNumber}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      margin: '12px 0',
                      background: 'var(--bg-subtle)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <strong
                      style={{ display: 'block', color: 'var(--text-main)', marginBottom: '4px' }}
                    >
                      Category: {comp.category}
                    </strong>
                    <p style={{ color: 'var(--text-muted)' }}>{comp.description}</p>
                  </div>

                  {comp.resolution && (
                    <div
                      style={{
                        background: 'var(--accent-emerald-light)',
                        color: 'var(--accent-emerald)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      Resolution: {comp.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Support Hotline Info */}
            <div
              className="card"
              style={{
                background: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <Phone size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  Local Society Operations Desk
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Direct support for {selectedSociety.name}: Available daily 8:00 AM – 9:00 PM for
                  on-site mediation.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Provider Details View Drawer/Modal */}
      {viewingProvider &&
        (() => {
          const provAllReviews = reviews.filter((r) => r.providerId === viewingProvider.id);
          const provLocalReviews = provAllReviews.filter(
            (r) =>
              !r.societyId ||
              r.societyId === selectedSociety.id ||
              r.societyName === selectedSociety.name,
          );
          const displayedReviews =
            providerReviewFilter === 'LOCAL' ? provLocalReviews : provAllReviews;

          // Compute dynamic rating stats
          const totalRevCount = provAllReviews.length;
          const avgScore =
            totalRevCount > 0
              ? (provAllReviews.reduce((sum, r) => sum + r.rating, 0) / totalRevCount).toFixed(1)
              : (viewingProvider.rating || 5.0).toString();

          const ratingDist = [5, 4, 3, 2, 1].map((stars) => {
            const count = provAllReviews.filter((r) => r.rating === stars).length;
            const pct = totalRevCount > 0 ? Math.round((count / totalRevCount) * 100) : 0;
            return { stars, count, pct };
          });

          // Collect top tags
          const allTags: Record<string, number> = {};
          provAllReviews.forEach((r) => {
            r.tags?.forEach((tag) => {
              allTags[tag] = (allTags[tag] || 0) + 1;
            });
          });
          const topTags = Object.entries(allTags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

          return (
            <div className="modal-overlay" onClick={() => setViewingProvider(null)}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--border-light)',
                    paddingBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img
                      src={viewingProvider.avatarUrl}
                      alt={viewingProvider.businessName}
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '14px',
                        objectFit: 'cover',
                        border: '2px solid var(--border-light)',
                      }}
                    />
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                          {viewingProvider.businessName}
                        </h2>
                        {viewingProvider.status === 'VERIFIED' && (
                          <span
                            className="badge badge-emerald"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.68rem',
                            }}
                          >
                            <ShieldCheck size={12} /> Verified Provider
                          </span>
                        )}
                        {viewingProvider.isVacationMode && (
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                            🏖️ Vacation Paused
                          </span>
                        )}
                      </div>
                      <div
                        style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}
                      >
                        {viewingProvider.categoryName}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginTop: '4px',
                          fontSize: '0.8rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Star size={14} fill="#f59e0b" color="#f59e0b" /> {avgScore}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          • {viewingProvider.completedOrders} orders
                        </span>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          • {viewingProvider.onTimeRate}% on-time
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          • 🕐 {viewingProvider.workingHours?.start || '8 AM'} -{' '}
                          {viewingProvider.workingHours?.end || '8 PM'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingProvider(null)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '18px',
                  }}
                >
                  {viewingProvider.description}
                </p>

                {/* Provider's Services with Dynamic Booking Buttons */}
                <div style={{ marginBottom: '22px' }}>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Wrench size={16} color="var(--primary)" /> Available Services & Society Rates
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {services
                      .filter((s) => s.providerId === viewingProvider.id && s.isActive)
                      .map((service) => (
                        <div
                          key={service.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--bg-subtle)',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <div style={{ flex: 1, marginRight: '12px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                              {service.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginTop: '2px',
                              }}
                            >
                              {service.description.slice(0, 85)}...
                            </div>
                            <span
                              className="badge badge-slate"
                              style={{ fontSize: '0.65rem', marginTop: '4px' }}
                            >
                              Model: {service.pricingModel.replace('_', ' ')}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div
                              style={{
                                fontWeight: 800,
                                color: 'var(--primary)',
                                fontSize: '1.05rem',
                              }}
                            >
                              {service.pricingModel === 'CUSTOM_QUOTATION'
                                ? 'Free Quote'
                                : `₹${service.basePrice}`}
                            </div>
                            <button
                              onClick={() => {
                                setViewingProvider(null);
                                setBookingService({ service, provider: viewingProvider });
                              }}
                              disabled={viewingProvider.isVacationMode}
                              className="btn btn-primary btn-sm"
                              style={{
                                marginTop: '4px',
                                opacity: viewingProvider.isVacationMode ? 0.6 : 1,
                              }}
                            >
                              {viewingProvider.isVacationMode ? 'Paused' : 'Book Slot'}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Verified Neighbor Reviews Section */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '18px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Star size={18} fill="#f59e0b" color="#f59e0b" /> Verified Neighbor Reviews
                      </h4>
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        Authentic ratings from verified flat owners who booked through LocalNest
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setProviderReviewFilter('LOCAL')}
                        className={`btn btn-sm ${providerReviewFilter === 'LOCAL' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '16px' }}
                      >
                        🏡 {selectedSociety.name} ({provLocalReviews.length})
                      </button>
                      <button
                        onClick={() => setProviderReviewFilter('ALL')}
                        className={`btn btn-sm ${providerReviewFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '16px' }}
                      >
                        🌐 All ({provAllReviews.length})
                      </button>
                    </div>
                  </div>

                  {/* Rating Overview Card */}
                  <div
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(13,148,136,0.05) 100%)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      marginBottom: '16px',
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr',
                      gap: '16px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Left: Big Score */}
                    <div
                      style={{
                        textAlign: 'center',
                        borderRight: '1px solid rgba(0,0,0,0.06)',
                        paddingRight: '12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '2.4rem',
                          fontWeight: 900,
                          color: '#b45309',
                          lineHeight: 1,
                        }}
                      >
                        {avgScore}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '2px',
                          margin: '4px 0',
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= Math.round(Number(avgScore)) ? '#f59e0b' : 'none'}
                            color="#f59e0b"
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {totalRevCount} verified rating{totalRevCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Right: Distribution Bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {ratingDist.map((item) => (
                        <div
                          key={item.stars}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.72rem',
                          }}
                        >
                          <span style={{ width: '22px', textAlign: 'right', fontWeight: 600 }}>
                            {item.stars}★
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: '7px',
                              background: '#e2e8f0',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${item.pct}%`,
                                height: '100%',
                                background: '#f59e0b',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              width: '28px',
                              color: 'var(--text-muted)',
                              fontSize: '0.68rem',
                            }}
                          >
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Praise Tags */}
                  {topTags.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}
                      >
                        Top Neighbor Praise:
                      </span>
                      {topTags.map(([tag, count]) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.72rem',
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {tag} <span style={{ opacity: 0.7 }}>({count})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reviews List */}
                  {displayedReviews.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '32px 16px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <Star size={32} color="var(--text-subtle)" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        No reviews yet for this filter
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                        }}
                      >
                        Be the first verified neighbor from {selectedSociety.name} to book and rate
                        this provider!
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {displayedReviews.map((rev) => {
                        const initial = rev.customerName?.charAt(0).toUpperCase() || 'R';
                        const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        });

                        return (
                          <div
                            key={rev.id}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '14px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            }}
                          >
                            {/* Reviewer Header */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {initial}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <strong
                                      style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}
                                    >
                                      {rev.customerName}
                                    </strong>
                                    {rev.customerFlat && (
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          background: '#f1f5f9',
                                          color: '#475569',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        {rev.customerFlat}
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        color: 'var(--accent-emerald)',
                                        fontSize: '0.68rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        fontWeight: 700,
                                      }}
                                    >
                                      <ShieldCheck size={12} /> Verified Purchase
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      color: 'var(--text-muted)',
                                      marginTop: '1px',
                                    }}
                                  >
                                    📍 {rev.societyName || selectedSociety.name} • {formattedDate}
                                  </div>
                                </div>
                              </div>

                              {/* Stars */}
                              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={13}
                                    fill={s <= rev.rating ? '#f59e0b' : 'none'}
                                    color="#f59e0b"
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Service Title */}
                            {rev.serviceName && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  fontSize: '0.74rem',
                                  color: 'var(--primary)',
                                  fontWeight: 600,
                                }}
                              >
                                Service Booked: {rev.serviceName}
                              </div>
                            )}

                            {/* Praise Tags */}
                            {rev.tags && rev.tags.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '5px',
                                  marginTop: '6px',
                                }}
                              >
                                {rev.tags.map((t) => (
                                  <span
                                    key={t}
                                    style={{
                                      fontSize: '0.7rem',
                                      background: '#f8fafc',
                                      border: '1px solid #e2e8f0',
                                      padding: '2px 7px',
                                      borderRadius: '12px',
                                      color: '#334155',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Comment Body */}
                            <p
                              style={{
                                color: 'var(--text-main)',
                                fontSize: '0.84rem',
                                lineHeight: 1.5,
                                marginTop: '8px',
                                margin: '8px 0 0',
                              }}
                            >
                              {rev.comment}
                            </p>

                            {/* Provider Response (if any) */}
                            {rev.providerResponse && (
                              <div
                                style={{
                                  marginTop: '10px',
                                  background: '#f8fafc',
                                  borderLeft: '3px solid var(--primary)',
                                  padding: '8px 12px',
                                  borderRadius: '0 6px 6px 0',
                                  fontSize: '0.78rem',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '3px',
                                  }}
                                >
                                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                    💬 Response from {viewingProvider.businessName}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    {new Date(rev.providerResponse.respondedAt).toLocaleDateString(
                                      'en-IN',
                                      { day: 'numeric', month: 'short' },
                                    )}
                                  </span>
                                </div>
                                <p style={{ margin: 0, color: '#334155', lineHeight: 1.4 }}>
                                  {rev.providerResponse.comment}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ============================================================== */}
      {/* TAB: NOTICE BOARD */}
      {/* ============================================================== */}
      {activeTab === 'notices' &&
        (() => {
          const myNotices = notices
            .filter(
              (n) => n.isActive && (n.societyId === 'ALL' || n.societyId === selectedSociety.id),
            )
            .sort((a, b) => {
              // Urgent first, then by date desc
              if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
              if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

          const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
            ANNOUNCEMENT: { color: '#1d4ed8', bg: '#dbeafe', icon: <Megaphone size={15} /> },
            MAINTENANCE: { color: '#92400e', bg: '#fef3c7', icon: <Wrench size={15} /> },
            ALERT: { color: '#be123c', bg: '#ffe4e6', icon: <AlertCircle size={15} /> },
            SERVICE_UPDATE: { color: '#065f46', bg: '#d1fae5', icon: <Bell size={15} /> },
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
              >
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Society Notice Board</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Official announcements for {selectedSociety.name}
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {myNotices.length} active notice{myNotices.length !== 1 ? 's' : ''}
                </span>
              </div>

              {myNotices.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <Bell size={40} color="var(--text-subtle)" style={{ marginBottom: '12px' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>
                    All Clear!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No active notices for your society right now.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myNotices.map((notice) => {
                    const cfg = typeConfig[notice.type] || typeConfig.ANNOUNCEMENT;
                    const isUrgent = notice.priority === 'URGENT';
                    const timeAgo = (() => {
                      const diff = Date.now() - new Date(notice.createdAt).getTime();
                      const h = Math.floor(diff / 3600000);
                      const d = Math.floor(h / 24);
                      if (d > 0) return `${d}d ago`;
                      if (h > 0) return `${h}h ago`;
                      return 'Just now';
                    })();

                    return (
                      <div
                        key={notice.id}
                        className="card"
                        style={{
                          padding: '18px 20px',
                          borderLeft: `4px solid ${isUrgent ? 'var(--accent-rose)' : cfg.color}`,
                          background: isUrgent ? '#fff8f8' : undefined,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                            }}
                          >
                            {/* Type badge */}
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                background: cfg.bg,
                                color: cfg.color,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              {cfg.icon}
                              {notice.type.replace('_', ' ')}
                            </span>
                            {isUrgent && (
                              <span
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  background: '#ffe4e6',
                                  color: 'var(--accent-rose)',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                }}
                              >
                                🔴 URGENT
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-subtle)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {timeAgo}
                          </div>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>
                            {notice.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.875rem',
                              color: 'var(--text-muted)',
                              lineHeight: 1.6,
                            }}
                          >
                            {notice.content}
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--text-subtle)',
                          }}
                        >
                          <span>
                            Posted by{' '}
                            <strong style={{ color: 'var(--text-muted)' }}>
                              {notice.authorName}
                            </strong>
                          </span>
                          <span>
                            {notice.societyId === 'ALL'
                              ? '📢 All Societies'
                              : `📍 ${notice.societyName}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      {/* ============================================================== */}
      {activeTab === 'wallet' &&
        currentUser &&
        (() => {
          const uid = currentUser.id;
          const balance = getWalletBalance(uid);
          const streak = getWalletStreak(uid);
          const txns = walletTransactions.filter((t) => t.userId === uid);
          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                paddingBottom: '24px',
              }}
            >
              {/* Balance Hero */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '16px',
                  padding: '28px',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '4px' }}>
                    LocalNest Credits Balance
                  </div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1 }}>
                    ₹{balance}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '8px' }}>
                    Use up to 20% of any order subtotal at checkout
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Order streak</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{streak.completedCount}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {streak.remaining} more for ₹50 bonus
                  </div>
                </div>
              </div>

              {/* Earn Rate Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  { icon: '🎯', title: 'Earn 3%', desc: 'On every completed order' },
                  { icon: '🏆', title: '₹50 Streak', desc: 'Every 5 completed orders' },
                  { icon: '💳', title: 'Redeem 20%', desc: 'Max per order subtotal' },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '14px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {item.title}
                    </div>
                    <div
                      style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}
                    >
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Transaction History */}
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>
                  Transaction History
                </h3>
                {txns.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px',
                      color: 'var(--text-muted)',
                      fontSize: '0.88rem',
                    }}
                  >
                    No transactions yet. Complete your first order to earn credits!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {txns.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            background:
                              t.type === 'EARNED' || (t.type === 'ADJUSTMENT' && t.amount > 0)
                                ? '#dcfce7'
                                : '#fee2e2',
                            flexShrink: 0,
                          }}
                        >
                          {t.type === 'EARNED'
                            ? '💰'
                            : t.type === 'REDEEMED'
                              ? '🛒'
                              : t.type === 'EXPIRED'
                                ? '⏰'
                                : '✨'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-main)',
                              fontWeight: 500,
                            }}
                          >
                            {t.note}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              marginTop: '2px',
                            }}
                          >
                            {new Date(t.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color:
                              t.type === 'EARNED' || (t.type === 'ADJUSTMENT' && t.amount > 0)
                                ? '#16a34a'
                                : '#dc2626',
                          }}
                        >
                          {t.type === 'EARNED' || (t.type === 'ADJUSTMENT' && t.amount > 0)
                            ? '+'
                            : '-'}
                          ₹{Math.abs(t.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* ─── Order Chat Modal (Resident Side) ───────────────────────────────── */}
      {chatOrderId &&
        (() => {
          const chatOrder = orders.find((o) => o.id === chatOrderId);
          const messages = getOrderMessages(chatOrderId);
          const handleSend = () => {
            if (!chatInput.trim()) return;
            const res = sendChatMessage(chatOrderId, chatInput.trim());
            if (res.blocked || !res.success) {
              setChatError(res.message);
            } else {
              setChatError('');
            }
            setChatInput('');
          };
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
              }}
            >
              <div
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '16px',
                  width: '480px',
                  maxWidth: '95vw',
                  maxHeight: '85dvh',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      Chat — {chatOrder?.providerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Order {chatOrder?.orderNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOrderId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.4rem',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {'×'}
                  </button>
                </div>
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    minHeight: '200px',
                  }}
                >
                  {messages.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        marginTop: '32px',
                      }}
                    >
                      No messages yet. Ask your provider a question!
                    </div>
                  )}
                  {messages.map((m) => {
                    const isMe = m.senderRole === 'CUSTOMER';
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '78%',
                            background: isMe ? 'var(--primary)' : 'var(--card-hover)',
                            color: isMe ? '#fff' : 'var(--text-main)',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            padding: '8px 14px',
                            fontSize: '0.85rem',
                            wordBreak: 'break-word',
                          }}
                        >
                          {m.text}
                          <div
                            style={{
                              fontSize: '0.65rem',
                              opacity: 0.6,
                              marginTop: '4px',
                              textAlign: 'right',
                            }}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {chatError && (
                  <div
                    style={{
                      padding: '6px 16px',
                      background: '#fff3cd',
                      color: '#856404',
                      fontSize: '0.78rem',
                    }}
                  >
                    {'🛡️'} {chatError}
                  </div>
                )}
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      setChatError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Message your provider..."
                    style={{
                      flex: 1,
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      padding: '10px 14px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '16px',
                      minHeight: '44px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleSend}
                    style={{
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      cursor: 'pointer',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div
                  style={{
                    padding: '6px 16px 10px',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Keep all communication inside LocalNest.
                </div>
              </div>
            </div>
          );
        })()}

      {/* Dynamic Booking Modal */}
      {bookingService && (
        <BookingModal
          service={bookingService.service}
          provider={bookingService.provider}
          onClose={() => setBookingService(null)}
          onSuccess={(orderNumber) => {
            setBookingService(null);
            setActiveTab('orders');
            notify.success(`Your booking has been confirmed and placed in escrow.`, {
              title: 'Booking Confirmed!',
              referenceId: orderNumber,
            });
          }}
        />
      )}

      {/* Review Modal */}
      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />}

      {/* Dispute / Complaint Modal */}
      {complaintOrder && (
        <ComplaintModal order={complaintOrder} onClose={() => setComplaintOrder(null)} />
      )}

      {/* Cancellation Confirm Modal */}
      <CancellationConfirmModal
        order={cancellationOrder}
        isOpen={cancellationOrder !== null}
        onClose={() => setCancellationOrder(null)}
        onConfirmCancel={(orderId, reason) => {
          cancelOrder(orderId, reason);
          const orderNum = cancellationOrder?.orderNumber;
          setCancellationOrder(null);
          notify.info(
            'Your booking has been cancelled. Any eligible refund will be processed within 3–5 business days.',
            { title: 'Booking Cancelled', referenceId: orderNum },
          );
        }}
      />

      {/* Bottom Navigation for Mobile / Tablet */}
      <nav className="mobile-nav">
        {[
          { id: 'home', label: t.navHome, icon: Home },
          { id: 'explore', label: t.navExplore, icon: Compass },
          { id: 'orders', label: t.navOrders, icon: Clock },
          { id: 'subscriptions', label: t.navSubscriptions, icon: RefreshCw },
          { id: 'offers', label: t.navOffers, icon: Tag },
        ].map((item) => {
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
