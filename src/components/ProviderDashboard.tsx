'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMarketplace } from '@/lib/store';
import { Service, PricingModel, OrderStatus, Order, CoverageMode } from '@/lib/types';
import { getCoveredSocieties, calculateHaversineDistance, BENGALURU_LOCALITIES } from '@/lib/geo';
import { 
  DollarSign, PackageCheck, Repeat, Star, 
  Calendar, Check, X, Plus, Clock, 
  MapPin, CheckCircle, ShieldCheck, AlertCircle,
  FileSpreadsheet, Printer, ArrowDownToLine,
  Sliders, Palmtree, Coffee, CheckCircle2, User, MessageCircle, Send, Navigation
} from 'lucide-react';

export default function ProviderDashboard() {
  const { 
    providers, 
    activeProviderId, 
    orders, 
    services, 
    subscriptions, 
    payouts,
    reviews,
    respondToReview,
    commissionRules,
    updateOrderStatus, 
    updateProviderAvailability,
    updateProviderServiceArea,
    societies,
    requestPayout,
    addService,
    sendChatMessage,
    getOrderMessages,
    currentUser,
    language,
    setLanguage,
    t,
  } = useMarketplace();

  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Find active provider
  const provider = providers.find(p => p.id === activeProviderId) || providers[0];

  // Active Provider's orders & subscriptions
  const providerOrders = orders.filter(o => o.providerId === provider.id);
  const providerSubscriptions = subscriptions.filter(s => s.providerId === provider.id);
  const providerServices = services.filter(s => s.providerId === provider.id);
  const providerPayouts = payouts.filter(p => p.providerId === provider.id);

  // Financial aggregates
  const completedOrders = providerOrders.filter(o => o.status === 'COMPLETED');
  const totalGrossEarnings = completedOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalCommissionPaid = completedOrders.reduce((acc, o) => acc + o.platformCommission, 0);
  const totalEarned = completedOrders.reduce((acc, o) => acc + o.providerEarnings, 0);
  const totalWithdrawn = providerPayouts.reduce((acc, p) => acc + p.amount, 0);
  const withdrawableBalance = Math.max(0, totalEarned - totalWithdrawn);

  // Reviews & Reputation aggregates
  const myReviews = reviews.filter(r => r.providerId === provider.id);
  const dynamicRating = myReviews.length > 0 
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
    : (provider.rating || 5.0).toString();

  // Review reply state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replyError, setReplyError] = useState<string>('');

  // Tab State: 'overview' | 'orders' | 'manifest' | 'subscriptions' | 'services' | 'earnings' | 'reviews'
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'manifest' | 'subscriptions' | 'services' | 'earnings' | 'reviews'>('overview');

  // New Service Modal State
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');
  const [newPricingModel, setNewPricingModel] = useState<PricingModel>('FIXED');
  const [newBasePrice, setNewBasePrice] = useState<number>(350);
  const [newUnitName, setNewUnitName] = useState<string>('per service');
  const [isSubscriptionSupported, setIsSubscriptionSupported] = useState<boolean>(false);

  // Feature 10: Reject Order With Reason Modal State
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectionReasonOption, setRejectionReasonOption] = useState<string>('Capacity full / high booking volume today');
  const [customRejectionText, setCustomRejectionText] = useState<string>('');

  // Covered societies
  const coveredSocietiesList = getCoveredSocieties(provider, societies);

  // Service Area & Distance Modal State
  const [showServiceAreaModal, setShowServiceAreaModal] = useState<boolean>(false);
  const initialLocalityIdx = BENGALURU_LOCALITIES.findIndex(l => l.label === provider.baseLocation?.label);
  const [areaLocalityIdx, setAreaLocalityIdx] = useState<number>(initialLocalityIdx >= 0 ? initialLocalityIdx : 0);
  const [areaCoverageMode, setAreaCoverageMode] = useState<CoverageMode>(provider.coverageMode || 'RADIUS');
  const [areaMaxDistance, setAreaMaxDistance] = useState<number>(provider.maxServiceDistanceKm || 8);
  const [areaExcludedSocieties, setAreaExcludedSocieties] = useState<string[]>(provider.excludedSocietyIds || []);
  const [areaManualSocieties, setAreaManualSocieties] = useState<string[]>(provider.supportedSocieties || [societies[0]?.id || 'soc-1']);
  const [areaDailyCap, setAreaDailyCap] = useState<number>(provider.maxOrdersPerDay || 8);
  const [areaEnableTravel, setAreaEnableTravel] = useState<boolean>(Boolean(provider.travelChargePerKm && provider.travelChargePerKm > 0));
  const [areaFreeRadius, setAreaFreeRadius] = useState<number>(provider.freeServiceRadiusKm || 3);
  const [areaChargePerKm, setAreaChargePerKm] = useState<number>(provider.travelChargePerKm || 15);
  const [areaMaxCap, setAreaMaxCap] = useState<number>(provider.maxTravelCharge || 150);
  const [areaShopName, setAreaShopName] = useState<string>(provider.businessName || '');
  const [areaShopAddress, setAreaShopAddress] = useState<string>(provider.baseLocation?.label ? `${provider.baseLocation.label}, Bengaluru` : '');

  // Feature 9 & 13: Working Hours & Vacation Mode Modal State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState<boolean>(false);
  const [workStart, setWorkStart] = useState<string>(provider.workingHours?.start || '08:00 AM');
  const [workEnd, setWorkEnd] = useState<string>(provider.workingHours?.end || '08:00 PM');
  const [selectedDaysOff, setSelectedDaysOff] = useState<string[]>(provider.workingHours?.daysOff || ['Sunday']);
  const [isVacation, setIsVacation] = useState<boolean>(provider.isVacationMode || false);
  const [vacationNote, setVacationNote] = useState<string>(provider.vacationReason || 'Taking a short personal break. Resuming orders soon.');

  // Feature 11: Payout Request Modal State
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(withdrawableBalance > 0 ? withdrawableBalance : 1000);
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK_NEFT'>('UPI');
  const [payoutDetails, setPayoutDetails] = useState<string>('provider@okhdfcbank');

  // Feature 12: Delivery Sheet Checked IDs
  const [checkedManifestIds, setCheckedManifestIds] = useState<string[]>([]);

  // Daily Manifest Items (Scheduled orders + active subscriptions)
  const scheduledOrdersForManifest = providerOrders
    .filter(o => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS' || o.status === 'ACCEPTED')
    .map(o => ({
      id: o.id,
      type: 'ORDER' as const,
      customerName: o.customerName,
      customerFlat: o.customerFlat,
      customerPhone: o.customerPhone,
      serviceName: o.serviceName,
      slot: o.scheduledSlot,
      specialInstructions: o.specialInstructions || '',
      status: o.status,
    }));

  const subscriptionsForManifest = providerSubscriptions
    .filter(s => s.status === 'ACTIVE')
    .map(s => ({
      id: s.id,
      type: 'SUBSCRIPTION' as const,
      customerName: s.customerName,
      customerFlat: s.customerFlat,
      customerPhone: '+91 98765 43210',
      serviceName: `${s.serviceName} (${s.frequency})`,
      slot: s.scheduledTimeSlot,
      specialInstructions: 'Daily recurring doorstep delivery',
      status: 'SCHEDULED' as OrderStatus,
    }));

  const allManifestItems = [...scheduledOrdersForManifest, ...subscriptionsForManifest].sort((a, b) => {
    return a.customerFlat.localeCompare(b.customerFlat);
  });

  const toggleManifestCheck = (id: string) => {
    setCheckedManifestIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    addService({
      providerId: provider.id,
      categoryId: provider.categoryId,
      name: newServiceName,
      description: newServiceDesc,
      pricingModel: newPricingModel,
      basePrice: Number(newBasePrice),
      unitName: newUnitName,
      isSubscriptionSupported,
      isActive: true,
    });

    setShowAddServiceModal(false);
    setNewServiceName('');
    setNewServiceDesc('');
  };

  // Submit Rejection
  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToReject) return;
    const finalReason = rejectionReasonOption === 'Other' && customRejectionText.trim()
      ? customRejectionText.trim()
      : rejectionReasonOption;

    updateOrderStatus(orderToReject.id, 'REJECTED', undefined, finalReason);
    setOrderToReject(null);
    setCustomRejectionText('');
  };

  // Save Availability & Vacation
  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    updateProviderAvailability(
      provider.id,
      {
        start: workStart,
        end: workEnd,
        daysOff: selectedDaysOff,
      },
      isVacation,
      isVacation ? vacationNote : undefined
    );
    setShowAvailabilityModal(false);
  };

  // Submit Payout Request
  const handleRequestPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0) return;
    requestPayout(provider.id, Number(payoutAmount), payoutMethod, payoutDetails);
    setShowPayoutModal(false);
  };

  const toggleDayOff = (day: string) => {
    setSelectedDaysOff(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div style={{ paddingBottom: '70px' }}>
      
      {/* Provider Header Banner */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border-light)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src={provider.avatarUrl || 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120'} 
              alt={provider.businessName}
              style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{provider.businessName}</h1>
                <span className={`badge ${provider.status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                  {provider.status}
                </span>

                {/* Feature 9 & 13: Live Vacation & Availability Badge */}
                {provider.isVacationMode ? (
                  <span className="badge badge-amber" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Palmtree size={12} /> Vacation Mode (Paused)
                  </span>
                ) : (
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Open ({provider.workingHours?.start || '8 AM'} - {provider.workingHours?.end || '8 PM'})
                  </span>
                )}
                <span className="badge badge-blue" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> Covers {coveredSocietiesList.length} societies within {provider.maxServiceDistanceKm || 10} km
                </span>
                {provider.maxOrdersPerDay ? (
                  <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                    Cap: {provider.maxOrdersPerDay} orders/day
                  </span>
                ) : null}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span>{provider.categoryName}</span>
                <span>•</span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'help' }}
                  title={coveredSocietiesList.length > 0
                    ? `Serving: ${coveredSocietiesList.map(s => s.name).join(', ')}`
                    : 'No coverage configured yet'}
                >
                  <MapPin size={13} color="var(--primary)" />
                  {coveredSocietiesList.length > 0
                    ? `Covers ${coveredSocietiesList.length} ${coveredSocietiesList.length === 1 ? 'society' : 'societies'}${provider.coverageMode === 'RADIUS' ? ` · ${provider.maxServiceDistanceKm ?? 8} km radius` : ''}`
                    : 'No societies covered'}
                </span>
                <span>•</span>
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  <Sliders size={13} /> Edit Hours & Vacation
                </button>
                <span>•</span>
                <button
                  onClick={() => setShowServiceAreaModal(true)}
                  style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  <Navigation size={13} /> Edit Service Area & Travel
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="scrollable-tabs" style={{ maxWidth: '100%', minWidth: 0 }}>
            {[
              { id: 'overview', label: t.navOverview },
              { id: 'orders', label: `${t.navProviderOrders} (${providerOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED').length} active)` },
              { id: 'manifest', label: `${t.navManifest} (${allManifestItems.length})`, icon: FileSpreadsheet },
              { id: 'subscriptions', label: `${t.navProviderSubs} (${providerSubscriptions.length})` },
              { id: 'services', label: `${t.navProviderServices} (${providerServices.length})` },
              { id: 'earnings', label: `${t.navEarnings} (₹${withdrawableBalance.toLocaleString()})` },
              { id: 'reviews', label: `${t.navProviderReviews} (${myReviews.length})`, icon: Star },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px', fontSize: '0.8rem', flexShrink: 0, whiteSpace: 'nowrap', minHeight: '36px' }}
                >
                  {TabIcon && <TabIcon size={13} />}
                  {tab.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      <div className="container" style={{ marginTop: '24px' }}>
        
        {/* ============================================================== */}
        {/* OVERVIEW TAB */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Vacation Alert Banner if Active */}
            {provider.isVacationMode && (
              <div style={{ background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Palmtree size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>
                      Vacation Mode is Currently ACTIVE
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: '#b45309', margin: '2px 0 0' }}>
                      "{provider.vacationReason || 'Not accepting new orders'}" — Residents are informed and booking is paused.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="btn btn-dark btn-sm"
                >
                  Resume Taking Bookings
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AVAILABLE PAYOUT</span>
                  <DollarSign size={18} color="var(--accent-emerald)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-emerald)' }}>
                  ₹{withdrawableBalance.toLocaleString()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lifetime: ₹{totalEarned.toLocaleString()}</span>
                  <button 
                    onClick={() => { setActiveTab('earnings'); setShowPayoutModal(true); }}
                    className="btn btn-primary btn-sm" 
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>COMPLETED ORDERS</span>
                  <PackageCheck size={18} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
                  {provider.completedOrders}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  {provider.onTimeRate}% on-time completion rate
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE SUBSCRIPTIONS</span>
                  <Repeat size={18} color="var(--accent-blue)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
                  {providerSubscriptions.filter(s => s.status === 'ACTIVE').length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  MRR: ₹{providerSubscriptions.reduce((acc, s) => acc + s.monthlyPrice, 0).toLocaleString()} /mo
                </div>
              </div>

              <div 
                className="card card-hover" 
                onClick={() => setActiveTab('reviews')}
                style={{ cursor: 'pointer', border: '1px solid var(--border-light)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>SOCIETY REPUTATION</span>
                  <Star size={18} color="#f59e0b" fill="#f59e0b" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#b45309' }}>
                  ★ {dynamicRating} / 5.0
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
                  {myReviews.length} verified resident reviews →
                </div>
              </div>
            </div>

            {/* Quick Pending Requests Alert */}
            {providerOrders.filter(o => o.status === 'PENDING').length > 0 && (
              <div style={{ background: 'var(--accent-amber-light)', border: '1px solid var(--accent-amber)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={22} color="var(--accent-amber)" />
                  <div>
                    <strong>You have {providerOrders.filter(o => o.status === 'PENDING').length} new booking request(s) awaiting your action!</strong>
                    <div style={{ fontSize: '0.8rem', color: '#78350f' }}>Please accept or decline promptly with a clear reason to maintain your 98%+ reliability score.</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('orders')} className="btn btn-dark btn-sm">
                  View Requests
                </button>
              </div>
            )}

            {/* Today's Schedule & Quick Manifest Widget */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Today's Fulfillment Schedule
                    {coveredSocietiesList.length === 1
                      ? ` in ${coveredSocietiesList[0].name}`
                      : coveredSocietiesList.length > 1
                        ? ` across ${coveredSocietiesList.length} Societies`
                        : ''}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {allManifestItems.length} deliveries & scheduled visits planned
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('manifest')}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileSpreadsheet size={14} /> Open Full Delivery Sheet
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allManifestItems.slice(0, 4).map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.customerFlat}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>• {item.customerName}</span>
                        <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>{item.type}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Slot: <strong>{item.slot}</strong> • Service: {item.serviceName}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleManifestCheck(item.id)}
                      className={`btn btn-sm ${checkedManifestIds.includes(item.id) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      {checkedManifestIds.includes(item.id) ? '✓ Completed' : 'Mark Done'}
                    </button>
                  </div>
                ))}

                {allManifestItems.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '0.85rem' }}>
                    No pending orders or subscriptions scheduled for today. New requests will appear here automatically.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* ORDERS MANAGEMENT TAB */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Orders Pipeline & Management</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Accept incoming requests, provide cancellation/rejection reasons, and confirm fulfillment.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {providerOrders.map(order => (
                <div key={order.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Order #{order.orderNumber}</span>
                        <span className={`badge ${
                          order.status === 'COMPLETED' ? 'badge-emerald' : 
                          order.status === 'REJECTED' || order.status === 'CANCELLED' ? 'badge-rose' : 
                          order.status === 'PENDING' ? 'badge-amber' : 'badge-blue'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                        Customer: <strong>{order.customerName}</strong> ({order.customerFlat})
                        <button
                          onClick={() => { setChatOrderId(order.id); setChatInput(''); setChatError(''); }}
                          style={{ marginLeft: '8px', background: 'none', border: '1px solid var(--primary)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MessageCircle size={12} /> Chat
                        </button>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Service: {order.serviceName} • Model: {order.pricingModel} • Qty: {order.itemQuantity}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                        Total: ₹{order.totalAmount}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        Your Net Payout: ₹{order.providerEarnings.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <div style={{ margin: '10px 0', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Resident Note:</strong> "{order.specialInstructions}"
                    </div>
                  )}

                  {/* Feature 10: Display Rejection Reason if Rejected */}
                  {order.status === 'REJECTED' && order.rejectionReason && (
                    <div style={{ margin: '10px 0', background: '#ffe4e6', border: '1px solid #fecdd3', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#be123c' }}>
                      <strong>Decline Reason Provided:</strong> "{order.rejectionReason}" (100% Escrow Refunded to Customer)
                    </div>
                  )}

                  {/* Provider Order Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setOrderToReject(order)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--accent-rose)' }}
                        >
                          <X size={14} /> Decline with Reason
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                          className="btn btn-primary btn-sm"
                        >
                          <Check size={14} /> Accept Request
                        </button>
                      </>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'SCHEDULED')}
                        className="btn btn-primary btn-sm"
                      >
                        <Calendar size={14} /> Schedule for {order.scheduledDate}
                      </button>
                    )}

                    {order.status === 'SCHEDULED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                        className="btn btn-secondary btn-sm"
                      >
                        <Clock size={14} /> Mark In Progress
                      </button>
                    )}

                    {order.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} /> Confirm Service Completed
                      </button>
                    )}

                    {order.status === 'COMPLETED' && (
                      <span className="badge badge-emerald">
                        ✓ Completed & Disbursed
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {providerOrders.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <PackageCheck size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>No customer orders received yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* FEATURE 12: BULK DELIVERY SHEET / MANIFEST TAB */}
        {/* ============================================================== */}
        {activeTab === 'manifest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Daily Gate & Tower Delivery Sheet</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Sorted sequentially by Tower & Flat for fast, error-free doorstep fulfillment.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={14} /> Print Manifest
                </button>
              </div>
            </div>

            {/* Manifest Progress Summary */}
            <div className="card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ color: 'var(--primary-hover)', fontSize: '0.95rem' }}>
                    {checkedManifestIds.length} of {allManifestItems.length} Doorsteps Fulfilled Today
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: '#115e59' }}>
                    Greenfield Heights Security Checkpoint Pass Active
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
                  {allManifestItems.length > 0 ? Math.round((checkedManifestIds.length / allManifestItems.length) * 100) : 0}% Done
                </div>
              </div>
            </div>

            {/* Manifest Table */}
            <div className="card table-responsive" style={{ padding: 0, overflowX: 'auto', minWidth: 0, maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 14px', width: '48px' }}>Done</th>
                    <th style={{ padding: '12px 14px' }}>Flat / Tower</th>
                    <th style={{ padding: '12px 14px' }}>Resident Name</th>
                    <th style={{ padding: '12px 14px' }}>Service & Plan</th>
                    <th style={{ padding: '12px 14px' }}>Preferred Slot</th>
                    <th style={{ padding: '12px 14px' }}>Delivery Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {allManifestItems.map(item => {
                    const isDone = checkedManifestIds.includes(item.id);
                    return (
                      <tr 
                        key={item.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border-light)',
                          background: isDone ? 'rgba(209, 250, 229, 0.3)' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '12px 14px', minWidth: '48px' }}>
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleManifestCheck(item.id)}
                            style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--primary)' }}>
                          {item.customerFlat}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{item.customerName}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Use in-app chat</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div>{item.serviceName}</div>
                          <span className="badge badge-slate" style={{ fontSize: '0.62rem' }}>{item.type}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          {item.slot}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.specialInstructions || 'Direct doorstep handover'}
                        </td>
                      </tr>
                    );
                  })}

                  {allManifestItems.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No delivery tasks scheduled for today. New orders will automatically populate here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* RECURRING SUBSCRIPTIONS FULFILLMENT TAB */}
        {/* ============================================================== */}
        {activeTab === 'subscriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Recurring Resident Subscriptions</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Society residents subscribed to your recurring daily tiffin, laundry pickup, or car wash plans.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {providerSubscriptions.map(sub => (
                <div key={sub.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                        {sub.frequency.replace('_', ' ')}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>{sub.customerName}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.customerFlat}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{sub.monthlyPrice}/mo
                    </div>
                  </div>

                  <div style={{ margin: '12px 0', background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div>Time Slot: <strong>{sub.scheduledTimeSlot}</strong></div>
                    <div>Next Fulfillment: <strong>{sub.nextServiceDate}</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => toggleManifestCheck(sub.id)}
                      className={`btn btn-sm ${checkedManifestIds.includes(sub.id) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {checkedManifestIds.includes(sub.id) ? '✓ Delivered Today' : 'Mark Delivered for Today'}
                    </button>
                  </div>
                </div>
              ))}

              {providerSubscriptions.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  <Repeat size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>No active subscriptions yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SERVICES & PRICING CATALOG TAB */}
        {/* ============================================================== */}
        {activeTab === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Your Service Offerings</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Configure your pricing models: Fixed, Hourly, Per-Item, Subscriptions, or Inspection.
                </p>
              </div>
              <button 
                onClick={() => setShowAddServiceModal(true)} 
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} /> Add New Service
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {providerServices.map(service => (
                <div key={service.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                        Model: {service.pricingModel.replace('_', ' ')}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>{service.name}</h4>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      ₹{service.basePrice} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/{service.unitName}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '10px 0' }}>
                    {service.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '10px', fontSize: '0.75rem' }}>
                    <span style={{ color: service.isActive ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
                      ● {service.isActive ? 'Active on Marketplace' : 'Paused'}
                    </span>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                      Edit Pricing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* FEATURE 11: EARNINGS & PAYOUT WITHDRAWAL LEDGER */}
        {/* ============================================================== */}
        {activeTab === 'earnings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Financial Ledger & Bank Payouts</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Transparent net earnings after 10% platform take-rate with on-demand UPI / NEFT bank withdrawals.
                </p>
              </div>

              <button
                onClick={() => setShowPayoutModal(true)}
                className="btn btn-primary"
                disabled={withdrawableBalance <= 0}
              >
                <ArrowDownToLine size={16} /> Request Bank Payout (₹{withdrawableBalance.toLocaleString()})
              </button>
            </div>

            {/* Payout Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="card" style={{ background: 'var(--bg-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GROSS GMV BILLED</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>₹{totalGrossEarnings.toFixed(2)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across {completedOrders.length} completed orders</div>
              </div>

              <div className="card" style={{ background: 'var(--bg-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLATFORM COMMISSION (10%)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--accent-amber)' }}>-₹{totalCommissionPaid.toFixed(2)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Includes Razorpay PG & escrow fees</div>
              </div>

              <div className="card" style={{ background: 'var(--bg-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL WITHDRAWN TO BANK</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>₹{totalWithdrawn.toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{providerPayouts.length} past transfers</div>
              </div>

              <div className="card" style={{ background: '#ecfdf5', borderColor: 'var(--accent-emerald)' }}>
                <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700 }}>AVAILABLE FOR WITHDRAWAL</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--accent-emerald)' }}>₹{withdrawableBalance.toFixed(2)}</div>
                <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>Direct UPI / NEFT transfer</div>
              </div>
            </div>

            {/* Payout History Ledger */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Bank Transfer History</h3>
              <div className="card table-responsive" style={{ padding: 0, overflowX: 'auto', minWidth: 0, maxWidth: '100%' }}>
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 16px' }}>Reference #</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>Method</th>
                      <th style={{ padding: '12px 16px' }}>Account / UPI Details</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerPayouts.map(pay => (
                      <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{pay.referenceId}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{pay.amount.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>{pay.method}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{pay.accountDetails}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {new Date(pay.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                            {pay.status === 'COMPLETED' ? 'Settled to Account' : 'Processing (Within 2 hrs)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {providerPayouts.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No past withdrawals yet. When you request a payout, transaction records will appear here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Completed Orders Detailed Breakdown */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Itemized Order Earnings</h3>
              <div className="card table-responsive" style={{ padding: 0, overflowX: 'auto', minWidth: 0, maxWidth: '100%' }}>
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 16px' }}>Order #</th>
                      <th style={{ padding: '12px 16px' }}>Resident Flat</th>
                      <th style={{ padding: '12px 16px' }}>Gross GMV</th>
                      <th style={{ padding: '12px 16px' }}>Platform Take Rate</th>
                      <th style={{ padding: '12px 16px' }}>Net Provider Payout</th>
                      <th style={{ padding: '12px 16px' }}>Disbursement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{order.orderNumber}</td>
                        <td style={{ padding: '12px 16px' }}>{order.customerFlat}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>₹{order.subtotal.toFixed(2)}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--accent-amber)' }}>
                          {order.commissionPercentage}% (-₹{order.platformCommission.toFixed(2)})
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                          ₹{order.providerEarnings.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                            Settled in Escrow
                          </span>
                        </td>
                      </tr>
                    ))}
                    {completedOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No completed orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* REVIEWS & RATINGS TAB */}
        {/* ============================================================== */}
        {activeTab === 'reviews' && (() => {
          const totalReviewsCount = myReviews.length;
          const fiveStarCount = myReviews.filter(r => r.rating === 5).length;
          const fiveStarPct = totalReviewsCount > 0 ? Math.round((fiveStarCount / totalReviewsCount) * 100) : 100;
          const respondedCount = myReviews.filter(r => Boolean(r.providerResponse)).length;
          const responsePct = totalReviewsCount > 0 ? Math.round((respondedCount / totalReviewsCount) * 100) : 0;

          // Praise tags aggregation
          const tagCounts: Record<string, number> = {};
          myReviews.forEach(r => {
            r.tags?.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          });
          const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

          const handleSendReply = (reviewId: string) => {
            if (!replyText.trim()) {
              setReplyError('Please enter a response message.');
              return;
            }
            const res = respondToReview(reviewId, replyText.trim());
            if (res.success) {
              setReplyingReviewId(null);
              setReplyText('');
              setReplyError('');
            } else {
              setReplyError(res.message);
            }
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Resident Reviews & Society Reputation</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Verified feedback from gated society residents who booked your services. Higher ratings boost your visibility in society listings.
                </p>
              </div>

              {/* Top Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>OVERALL RATING</span>
                    <Star size={18} fill="#f59e0b" color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#b45309', marginTop: '6px' }}>
                    ★ {dynamicRating} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 5.0</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '2px', fontWeight: 600 }}>
                    Top Rated in {provider.categoryName}
                  </div>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>TOTAL REVIEWS</span>
                    <ShieldCheck size={18} color="var(--accent-emerald)" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '6px' }}>
                    {totalReviewsCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    100% Verified Purchases
                  </div>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>5-STAR SATISFACTION</span>
                    <Star size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
                    {fiveStarPct}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {fiveStarCount} of {totalReviewsCount} rated 5 stars
                  </div>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>RESPONSE RATE</span>
                    <MessageCircle size={18} color="var(--primary)" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginTop: '6px' }}>
                    {responsePct}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {respondedCount} reviews replied to
                  </div>
                </div>
              </div>

              {/* Praise Badges Earned */}
              {sortedTags.length > 0 && (
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={15} fill="#f59e0b" color="#f59e0b" /> Praise Badges Earned From Neighbors
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {sortedTags.map(([tag, count]) => (
                      <div 
                        key={tag}
                        style={{
                          background: 'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(16,185,129,0.08) 100%)',
                          border: '1.5px solid rgba(13,148,136,0.25)',
                          borderRadius: '24px',
                          padding: '6px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#0f766e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{tag}</span>
                        <span style={{ 
                          background: '#0f766e', 
                          color: '#fff', 
                          borderRadius: '10px', 
                          padding: '1px 6px', 
                          fontSize: '0.7rem' 
                        }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>
                  Resident Testimonials ({myReviews.length})
                </h3>

                {myReviews.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Star size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>No Resident Reviews Yet</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      Complete pending bookings to receive verified ratings from society residents.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {myReviews.map(rev => {
                      const initial = rev.customerName?.charAt(0).toUpperCase() || 'R';
                      const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      const isReplying = replyingReviewId === rev.id;

                      return (
                        <div 
                          key={rev.id} 
                          className="card" 
                          style={{ padding: '18px 20px', border: '1px solid var(--border-light)' }}
                        >
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ 
                                width: '38px', 
                                height: '38px', 
                                borderRadius: '50%', 
                                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', 
                                color: '#fff', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontWeight: 800, 
                                fontSize: '0.9rem' 
                              }}>
                                {initial}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '0.95rem' }}>{rev.customerName}</strong>
                                  {rev.customerFlat && (
                                    <span style={{ fontSize: '0.74rem', background: 'var(--bg-subtle)', color: 'var(--text-main)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                      {rev.customerFlat}
                                    </span>
                                  )}
                                  <span style={{ color: 'var(--accent-emerald)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                                    <ShieldCheck size={13} /> Verified Order
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  📍 {rev.societyName || 'Greenfield Heights'} • {formattedDate}
                                </div>
                              </div>
                            </div>

                            {/* Stars */}
                            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star 
                                  key={s} 
                                  size={16} 
                                  fill={s <= rev.rating ? '#f59e0b' : 'none'} 
                                  color="#f59e0b" 
                                />
                              ))}
                            </div>
                          </div>

                          {/* Service Title */}
                          {rev.serviceName && (
                            <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                              Service: {rev.serviceName}
                            </div>
                          )}

                          {/* Tags */}
                          {rev.tags && rev.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                              {rev.tags.map(t => (
                                <span 
                                  key={t} 
                                  style={{ 
                                    fontSize: '0.72rem', 
                                    background: '#f8fafc', 
                                    border: '1px solid #e2e8f0', 
                                    padding: '3px 8px', 
                                    borderRadius: '14px',
                                    color: '#334155',
                                    fontWeight: 600
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Comment */}
                          <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.55, marginTop: '10px', margin: '10px 0 0' }}>
                            "{rev.comment}"
                          </p>

                          {/* Existing Provider Response */}
                          {rev.providerResponse && (
                            <div style={{ 
                              marginTop: '14px', 
                              background: 'var(--bg-subtle)', 
                              borderLeft: '3px solid var(--primary)', 
                              padding: '10px 14px', 
                              borderRadius: '0 8px 8px 0',
                              fontSize: '0.82rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  💬 Your Response ({provider.businessName})
                                </strong>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {new Date(rev.providerResponse.respondedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <p style={{ margin: 0, color: '#334155', lineHeight: 1.45 }}>
                                {rev.providerResponse.comment}
                              </p>
                            </div>
                          )}

                          {/* Reply Action / Form */}
                          {!rev.providerResponse && (
                            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                              {!isReplying ? (
                                <button
                                  onClick={() => {
                                    setReplyingReviewId(rev.id);
                                    setReplyText('');
                                    setReplyError('');
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                  <MessageCircle size={13} /> Reply to Resident
                                </button>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                                  <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                    Write a polite response to {rev.customerName}:
                                  </label>
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => {
                                      setReplyText(e.target.value);
                                      setReplyError('');
                                    }}
                                    rows={2}
                                    className="form-input"
                                    placeholder="Thank you for your feedback! We look forward to serving your household again..."
                                    style={{ fontSize: '0.82rem' }}
                                  />
                                  {replyError && (
                                    <div style={{ color: 'var(--accent-rose)', fontSize: '0.75rem' }}>{replyError}</div>
                                  )}
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleSendReply(rev.id)}
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.78rem' }}
                                    >
                                      Publish Reply
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingReviewId(null);
                                        setReplyText('');
                                        setReplyError('');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.78rem' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })()}


      </div>

      {/* Feature 10: Decline Order Modal */}
      {orderToReject && (
        <div className="modal-overlay" onClick={() => setOrderToReject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(480px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-rose)' }}>Decline Booking Request</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Order #{orderToReject.orderNumber} • {orderToReject.customerName} ({orderToReject.customerFlat})
                </div>
              </div>
              <button 
                onClick={() => setOrderToReject(null)} 
                style={{ color: 'var(--text-muted)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Close decline modal"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Please provide a clear reason. The resident will be notified immediately and their payment escrow will be 100% refunded.
            </p>

            <form onSubmit={handleConfirmRejection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Select Reason for Declining</label>
                <select
                  value={rejectionReasonOption}
                  onChange={(e) => setRejectionReasonOption(e.target.value)}
                  className="form-input"
                >
                  <option value="Capacity full / high booking volume today">Capacity full / high booking volume today</option>
                  <option value="Equipment or machinery under scheduled maintenance">Equipment or machinery under scheduled maintenance</option>
                  <option value="Requested time slot is outside our operational hours">Requested time slot is outside our operational hours</option>
                  <option value="Resident flat address inaccessible or outside service wing">Resident flat address inaccessible or outside service wing</option>
                  <option value="On emergency leave / holiday">On emergency leave / holiday</option>
                  <option value="Other">Other reason (describe below)...</option>
                </select>
              </div>

              {rejectionReasonOption === 'Other' && (
                <div>
                  <label className="form-label">Describe Specific Reason</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Our delivery van had a flat tire this afternoon..."
                    value={customRejectionText}
                    onChange={(e) => setCustomRejectionText(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setOrderToReject(null)}
                  className="btn btn-secondary btn-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  style={{ background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 9 & 13: Availability & Vacation Mode Modal */}
      {showAvailabilityModal && (
        <div className="modal-overlay" onClick={() => setShowAvailabilityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(520px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Operating Hours & Vacation Mode</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Control when society residents can book your services
                </div>
              </div>
              <button 
                onClick={() => setShowAvailabilityModal(false)} 
                style={{ color: 'var(--text-muted)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Close availability modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAvailability} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Vacation Mode Toggle */}
              <div style={{ background: isVacation ? '#fef3c7' : 'var(--bg-subtle)', border: `1.5px solid ${isVacation ? '#f59e0b' : 'var(--border-light)'}`, borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Palmtree size={22} color={isVacation ? '#b45309' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isVacation ? '#92400e' : 'var(--text-main)' }}>
                        Vacation / Pause Mode
                      </div>
                      <div style={{ fontSize: '0.78rem', color: isVacation ? '#b45309' : 'var(--text-muted)' }}>
                        Temporarily pause new customer bookings without cancelling recurring subscriptions.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isVacation}
                    onChange={(e) => setIsVacation(e.target.checked)}
                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>

                {isVacation && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #fde68a' }}>
                    <label className="form-label" style={{ color: '#92400e' }}>Customer Notice</label>
                    <input
                      type="text"
                      value={vacationNote}
                      onChange={(e) => setVacationNote(e.target.value)}
                      placeholder="e.g. Taking leave for Diwali holidays. Reopening on Tuesday."
                      className="form-input"
                      style={{ background: '#fff' }}
                      required={isVacation}
                    />
                  </div>
                )}
              </div>

              {/* Working Hours Settings */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Daily Working Hours</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label className="form-label">Opening Time</label>
                    <select
                      value={workStart}
                      onChange={(e) => setWorkStart(e.target.value)}
                      className="form-input"
                    >
                      <option value="06:00 AM">06:00 AM (Early)</option>
                      <option value="07:00 AM">07:00 AM</option>
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Closing Time</label>
                    <select
                      value={workEnd}
                      onChange={(e) => setWorkEnd(e.target.value)}
                      className="form-input"
                    >
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                      <option value="08:00 PM">08:00 PM</option>
                      <option value="09:00 PM">09:00 PM</option>
                      <option value="10:00 PM">10:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Weekly Off Days */}
              <div>
                <label className="form-label">Designated Weekly Off Days</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const isOff = selectedDaysOff.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOff(day)}
                        className={`btn btn-sm ${isOff ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '20px' }}
                      >
                        {day} {isOff ? '✓ Off' : ''}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Residents will not be able to book service slots on designated off days.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAvailabilityModal(false)}
                  className="btn btn-secondary btn-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                >
                  Save Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Feature 11: Request Payout Withdrawal Modal */}
      {showPayoutModal && (
        <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(480px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Request Bank Payout</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Direct transfer from platform escrow to your account
                </div>
              </div>
              <button 
                onClick={() => setShowPayoutModal(false)} 
                style={{ color: 'var(--text-muted)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Close payout modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestPayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available Balance:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{withdrawableBalance.toLocaleString()}</span>
              </div>

              <div>
                <label className="form-label">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  min={100}
                  max={withdrawableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Payout Method</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setPayoutMethod('UPI'); setPayoutDetails('provider@okhdfcbank'); }}
                    className={`btn btn-sm ${payoutMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: '1 1 140px', minHeight: '44px' }}
                  >
                    UPI Transfer (Instant)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPayoutMethod('BANK_NEFT'); setPayoutDetails('HDFC Bank - A/C 9928192849 (IFSC: HDFC000124)'); }}
                    className={`btn btn-sm ${payoutMethod === 'BANK_NEFT' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: '1 1 140px', minHeight: '44px' }}
                  >
                    NEFT / IMPS Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">{payoutMethod === 'UPI' ? 'UPI ID (VPA)' : 'Bank Account Details & IFSC'}</label>
                <input
                  type="text"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={payoutMethod === 'UPI' ? 'e.g. mobile@upi or name@okaxis' : 'e.g. A/C 123456789, IFSC: SBIN0001234'}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="btn btn-secondary btn-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                >
                  Confirm & Transfer ₹{payoutAmount.toLocaleString()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="modal-overlay" onClick={() => setShowAddServiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(520px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Service Offering</h3>
              <button 
                onClick={() => setShowAddServiceModal(false)} 
                style={{ color: 'var(--text-muted)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Close add service modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Service Title</label>
                <input
                  type="text"
                  placeholder="e.g. Express Steam Pressing or Sofa Shampooing"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Pricing Model</label>
                <select
                  value={newPricingModel}
                  onChange={(e) => setNewPricingModel(e.target.value as PricingModel)}
                  className="form-input"
                >
                  <option value="FIXED">Fixed Price (e.g. ₹500/cleaning)</option>
                  <option value="HOURLY">Hourly Rate (e.g. ₹300/hr)</option>
                  <option value="PER_ITEM">Per Item (e.g. ₹40/shirt)</option>
                  <option value="SUBSCRIPTION">Monthly Subscription (e.g. ₹3,000/mo)</option>
                  <option value="INSPECTION_VARIABLE">Inspection + Variable (e.g. ₹299 checkup)</option>
                  <option value="CUSTOM_QUOTATION">Custom Free Quotation</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label">Base Price (₹)</label>
                  <input
                    type="number"
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Unit Description</label>
                  <input
                    type="text"
                    placeholder="e.g. per piece, per hour, per flat"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description & What's Included</label>
                <textarea
                  rows={3}
                  placeholder="Explain what is covered for the society residents..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '8px' }}>
                Publish Service to Marketplace
              </button>
            </form>
          </div>
        </div>
      )}


      {/* In-App Chat Modal */}
      {chatOrderId && (() => {
        const chatOrder = orders.find(o => o.id === chatOrderId);
        const messages = getOrderMessages(chatOrderId);
        const handleSend = () => {
          if (!chatInput.trim()) return;
          const res = sendChatMessage(chatOrderId, chatInput.trim());
          if (res.blocked || !res.success) { setChatError(res.message); } else { setChatError(''); }
          setChatInput('');
        };
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', width: '480px', maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Chat — {chatOrder?.customerName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order {chatOrder?.orderNumber}</div>
                </div>
                <button onClick={() => setChatOrderId(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>{'x'}</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '32px' }}>No messages yet. Start the conversation safely inside LocalNest.</div>
                )}
                {messages.map(m => {
                  const isMe = m.senderId === currentUser?.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '72%', background: isMe ? 'var(--primary)' : 'var(--card-hover)', color: isMe ? '#fff' : 'var(--text-main)', borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px', padding: '8px 14px', fontSize: '0.85rem' }}>
                        {m.text}
                        <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {chatError && (
                <div style={{ padding: '6px 16px', background: '#fff3cd', color: '#856404', fontSize: '0.78rem' }}>
                  🛡️ {chatError}
                </div>
              )}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                <input
                  value={chatInput}
                  onChange={e => { setChatInput(e.target.value); setChatError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  style={{ flex: 1, borderRadius: '8px', border: '1px solid var(--border)', padding: '8px 12px', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.87rem' }}
                />
                <button onClick={handleSend} style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#fff', cursor: 'pointer' }}>
                  <Send size={15} />
                </button>
              </div>
              <div style={{ padding: '6px 16px 10px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                🔒 Keep all communication inside LocalNest. Sharing contact details is not allowed.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================================================================
          EDIT SERVICE AREA & TRAVEL CHARGE MODAL
          (was referenced but never rendered — now wired up)
          ================================================================ */}
      {showServiceAreaModal && (() => {
        const currentLocality = BENGALURU_LOCALITIES[areaLocalityIdx] || BENGALURU_LOCALITIES[0];
        const societiesWithDist = societies.map(soc => {
          if (!soc.latitude || !soc.longitude) return { society: soc, distance: null, inRange: false, isExcluded: areaExcludedSocieties.includes(soc.id) };
          const dist = calculateHaversineDistance(currentLocality.latitude, currentLocality.longitude, soc.latitude, soc.longitude);
          const inRange = dist <= areaMaxDistance;
          const isExcluded = areaExcludedSocieties.includes(soc.id);
          return { society: soc, distance: Math.round(dist * 10) / 10, inRange, isExcluded, isCovered: inRange && !isExcluded };
        });

        const toggleExclude = (id: string) => setAreaExcludedSocieties(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
        const toggleManual = (id: string) => {
          if (areaCoverageMode === 'SELECTED_SOCIETIES') {
            const exists = areaManualSocieties.includes(id);
            if (!exists) setAreaManualSocieties(prev => [...prev, id]);
            else if (areaManualSocieties.length > 1) setAreaManualSocieties(prev => prev.filter(x => x !== id));
          }
        };

        const handleSave = () => {
          const derivedSupported = areaCoverageMode === 'RADIUS'
            ? societiesWithDist.filter(s => s.inRange && !s.isExcluded).map(s => s.society.id)
            : areaManualSocieties;
          updateProviderServiceArea(provider.id, {
            baseLocation: { label: currentLocality.label, pincode: currentLocality.pincode, latitude: currentLocality.latitude, longitude: currentLocality.longitude },
            maxServiceDistanceKm: areaMaxDistance,
            coverageMode: areaCoverageMode,
            excludedSocietyIds: areaExcludedSocieties,
            supportedSocieties: derivedSupported,
            maxOrdersPerDay: areaDailyCap,
            freeServiceRadiusKm: areaEnableTravel ? areaFreeRadius : undefined,
            travelChargePerKm: areaEnableTravel ? areaChargePerKm : undefined,
            maxTravelCharge: areaEnableTravel ? areaMaxCap : undefined,
          });
          setShowServiceAreaModal(false);
        };

        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowServiceAreaModal(false); }}
          >
            <div style={{ background: 'var(--bg-surface, #ffffff)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 'min(560px, 95vw)', maxHeight: '90dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)' }}>
              {/* Modal Header */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={18} color="var(--primary)" /> Edit Service Area &amp; Travel
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Changes apply immediately to new bookings
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close service area modal"
                  onClick={() => setShowServiceAreaModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body — scrollable */}
              <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '0' }}>

                {/* ── STEP 1: Shop Location ─────────────────────────── */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                    }}>1</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Your Shop / Operating Location</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: 'clamp(8px, 3vw, 28px)' }}>
                    <div>
                      <label className="form-label">Shop / Business Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={areaShopName}
                        onChange={e => setAreaShopName(e.target.value)}
                        placeholder="e.g. Rajan Plumbing Works"
                      />
                    </div>
                    <div>
                      <label className="form-label">Area / Locality <span style={{ color: 'var(--accent-rose)', fontSize: '0.72rem' }}>*</span></label>
                      <select value={areaLocalityIdx} onChange={e => setAreaLocalityIdx(Number(e.target.value))} className="form-input">
                        {BENGALURU_LOCALITIES.map((loc, idx) => (
                          <option key={loc.label} value={idx}>{loc.label} · PIN {loc.pincode}</option>
                        ))}
                      </select>
                      <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        📍 {currentLocality.latitude.toFixed(4)}° N, {currentLocality.longitude.toFixed(4)}° E
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Landmark / Street Address <span style={{ color: 'var(--text-subtle)', fontSize: '0.72rem' }}>(optional)</span></label>
                      <input
                        type="text"
                        className="form-input"
                        value={areaShopAddress}
                        onChange={e => setAreaShopAddress(e.target.value)}
                        placeholder="e.g. Near Total Mall, Sarjapur Road"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-light)', marginBottom: '20px' }} />

                {/* ── STEP 2: Coverage Mode + Radius ────────────────── */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                    }}>2</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>How Far Can You Travel?</div>
                  </div>
                  <div style={{ paddingLeft: 'clamp(8px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Mode toggle */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setAreaCoverageMode('RADIUS')}
                        className={`btn btn-sm ${areaCoverageMode === 'RADIUS' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: '1 1 160px', minHeight: '44px' }}>
                        <Sliders size={13} /> Radius from Shop
                      </button>
                      <button type="button" onClick={() => setAreaCoverageMode('SELECTED_SOCIETIES')}
                        className={`btn btn-sm ${areaCoverageMode === 'SELECTED_SOCIETIES' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: '1 1 160px', minHeight: '44px' }}>
                        <MapPin size={13} /> Pick Societies Manually
                      </button>
                    </div>

                    {areaCoverageMode === 'RADIUS' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <label className="form-label" style={{ margin: 0 }}>Max travel distance from your shop:</label>
                          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', lineHeight: 1 }}>{areaMaxDistance} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>km</span></span>
                        </div>
                        <input
                          type="range" min="1" max="25" step="1" value={areaMaxDistance}
                          onChange={e => setAreaMaxDistance(Number(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', height: '6px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                          <span>1 km</span><span>~5 min drive</span><span>25 km</span>
                        </div>
                        {/* Travel surcharge inline */}
                        <div style={{ marginTop: '14px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                            <input type="checkbox" checked={areaEnableTravel} onChange={e => setAreaEnableTravel(e.target.checked)} />
                            Charge travel fee for distant locations
                          </label>
                          {areaEnableTravel && (
                            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.72rem' }}>Free within (km)</label>
                                <input type="number" min="0" max="15" value={areaFreeRadius}
                                  onChange={e => setAreaFreeRadius(Number(e.target.value))} className="form-input" style={{ padding: '6px' }} />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.72rem' }}>₹ / km after</label>
                                <input type="number" min="5" max="100" value={areaChargePerKm}
                                  onChange={e => setAreaChargePerKm(Number(e.target.value))} className="form-input" style={{ padding: '6px' }} />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.72rem' }}>Max cap (₹)</label>
                                <input type="number" min="20" max="500" value={areaMaxCap}
                                  onChange={e => setAreaMaxCap(Number(e.target.value))} className="form-input" style={{ padding: '6px' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {areaCoverageMode === 'SELECTED_SOCIETIES' && (
                      <div>
                        <label className="form-label">Pick the societies you serve:</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {societies.map(soc => {
                            const isChecked = areaManualSocieties.includes(soc.id);
                            return (
                              <button key={soc.id} type="button" onClick={() => toggleManual(soc.id)}
                                className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '0.78rem', borderRadius: '20px', minHeight: '36px' }}>
                                <MapPin size={11} /> {soc.name}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                            <input type="checkbox" checked={areaEnableTravel} onChange={e => setAreaEnableTravel(e.target.checked)} />
                            Charge travel fee for distant societies
                          </label>
                          {areaEnableTravel && (
                            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.72rem' }}>Free within (km)</label>
                                <input type="number" min="0" max="15" value={areaFreeRadius}
                                  onChange={e => setAreaFreeRadius(Number(e.target.value))} className="form-input" style={{ padding: '6px' }} />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.72rem' }}>₹ / km after</label>
                                <input type="number" min="5" max="100" value={areaChargePerKm}
                                  onChange={e => setAreaChargePerKm(Number(e.target.value))} className="form-input" style={{ padding: '6px' }} />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.72rem' }}>Max cap (₹)</label>
                                <input type="number" min="20" max="500" value={areaMaxCap}
                                  onChange={e => setAreaMaxCap(Number(e.target.value))} className="form-input" style={{ padding: '6px' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-light)', marginBottom: '20px' }} />

                {/* ── STEP 3: Coverage Preview (Radius mode only) ──── */}
                {areaCoverageMode === 'RADIUS' && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'var(--primary)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                      }}>3</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        Coverage Preview
                        <span style={{ marginLeft: '8px', fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {societiesWithDist.filter(s => s.inRange && !s.isExcluded).length} of {societies.length} societies covered
                        </span>
                      </div>
                    </div>
                    <div style={{ paddingLeft: 'clamp(8px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                      {societiesWithDist
                        .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
                        .map(({ society, distance, inRange, isExcluded }) => (
                          <div key={society.id} style={{
                            padding: '8px 12px', borderRadius: '8px',
                            border: `1px solid ${inRange && !isExcluded ? 'rgba(13,148,136,0.25)' : 'var(--border-light)'}`,
                            background: inRange && !isExcluded ? 'rgba(13,148,136,0.05)' : 'var(--bg-subtle)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            opacity: inRange ? 1 : 0.55
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                background: inRange && !isExcluded ? 'var(--primary)' : 'var(--text-subtle)'
                              }} />
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{society.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {society.locality || society.city}
                                  {distance !== null ? ` · ${distance} km from your shop` : ''}
                                </div>
                              </div>
                            </div>
                            <div>
                              {inRange ? (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer', userSelect: 'none' }}>
                                  <input type="checkbox" checked={isExcluded} onChange={() => toggleExclude(society.id)} />
                                  <span style={{ color: isExcluded ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                                    {isExcluded ? 'Excluded' : 'Exclude'}
                                  </span>
                                </label>
                              ) : (
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>out of range</span>
                              )}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Daily Order Cap */}
                <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Daily Order Booking Limit</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Blocks new bookings once you hit capacity.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="number" min="1" max="50" value={areaDailyCap}
                      onChange={e => setAreaDailyCap(Number(e.target.value))}
                      className="form-input" style={{ width: '72px', padding: '6px', textAlign: 'center' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>orders/day</span>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={() => setShowServiceAreaModal(false)} className="btn btn-secondary btn-sm" style={{ minHeight: '44px' }}>
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}>
                  <CheckCircle size={14} /> Save Service Area
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
