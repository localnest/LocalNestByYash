'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { PricingModel, OrderStatus, Order, CoverageMode } from '@/lib/types';
import { getCoveredSocieties, calculateHaversineDistance, BENGALURU_LOCALITIES } from '@/lib/geo';
import { useNotification } from '@/features/notifications/notificationContext';
import {
  Star,
  X,
  MapPin,
  CheckCircle,
  FileSpreadsheet,
  Bell,
  Sliders,
  Palmtree,
  CheckCircle2,
  Send,
  Navigation,
} from 'lucide-react';
import ProviderDispatchWorkspace from './ProviderDispatchWorkspace';
import {
  ProviderOverviewTab,
  ProviderOrdersTab,
  ProviderManifestTab,
  ProviderSubscriptionsTab,
  ProviderServicesTab,
  ProviderEarningsTab,
  ProviderReviewsTab,
} from './provider';
import AppSelect from '@/components/ui/AppSelect';

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
    updateOrderStatus,
    updateProviderAvailability,
    updateProviderServiceArea,
    societies,
    requestPayout,
    addService,
    sendChatMessage,
    getOrderMessages,
    currentUser,
    t,
  } = useMarketplace();
  const { notify } = useNotification();

  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');

  // Find active provider
  const provider = providers.find((p) => p.id === activeProviderId) || providers[0];

  // Active Provider's orders & subscriptions
  const providerOrders = orders.filter((o) => o.providerId === provider.id);
  const providerSubscriptions = subscriptions.filter((s) => s.providerId === provider.id);
  const providerServices = services.filter((s) => s.providerId === provider.id);
  const providerPayouts = payouts.filter((p) => p.providerId === provider.id);

  // Financial aggregates
  const completedOrders = providerOrders.filter((o) => o.status === 'COMPLETED');
  const totalGrossEarnings = completedOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalCommissionPaid = completedOrders.reduce((acc, o) => acc + o.platformCommission, 0);
  const totalEarned = completedOrders.reduce((acc, o) => acc + o.providerEarnings, 0);
  const totalWithdrawn = providerPayouts.reduce((acc, p) => acc + p.amount, 0);
  const withdrawableBalance = Math.max(0, totalEarned - totalWithdrawn);

  // Reviews & Reputation aggregates
  const myReviews = reviews.filter((r) => r.providerId === provider.id);
  const dynamicRating =
    myReviews.length > 0
      ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
      : (provider.rating || 5.0).toString();

  // Tab State: 'overview' | 'orders' | 'manifest' | 'subscriptions' | 'services' | 'earnings' | 'reviews'
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'orders'
    | 'manifest'
    | 'subscriptions'
    | 'services'
    | 'earnings'
    | 'reviews'
    | 'dispatch'
  >('overview');

  // New Service Modal State
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');
  const [newPricingModel, setNewPricingModel] = useState<PricingModel>('FIXED');
  const [newBasePrice, setNewBasePrice] = useState<number>(350);
  const [newUnitName, setNewUnitName] = useState<string>('per service');
  const [isSubscriptionSupported] = useState<boolean>(false);

  // Feature 10: Reject Order With Reason Modal State
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectionReasonOption, setRejectionReasonOption] = useState<string>(
    'Capacity full / high booking volume today',
  );
  const [customRejectionText, setCustomRejectionText] = useState<string>('');

  // Covered societies
  const coveredSocietiesList = getCoveredSocieties(provider, societies);

  // Service Area & Distance Modal State
  const [showServiceAreaModal, setShowServiceAreaModal] = useState<boolean>(false);
  const initialLocalityIdx = BENGALURU_LOCALITIES.findIndex(
    (l) => l.label === provider.baseLocation?.label,
  );
  const [areaLocalityIdx, setAreaLocalityIdx] = useState<number>(
    initialLocalityIdx >= 0 ? initialLocalityIdx : 0,
  );
  const [areaCoverageMode, setAreaCoverageMode] = useState<CoverageMode>(
    provider.coverageMode || 'RADIUS',
  );
  const [areaMaxDistance, setAreaMaxDistance] = useState<number>(
    provider.maxServiceDistanceKm || 8,
  );
  const [areaExcludedSocieties, setAreaExcludedSocieties] = useState<string[]>(
    provider.excludedSocietyIds || [],
  );
  const [areaManualSocieties, setAreaManualSocieties] = useState<string[]>(
    provider.supportedSocieties || [societies[0]?.id || 'soc-1'],
  );
  const [areaDailyCap, setAreaDailyCap] = useState<number>(provider.maxOrdersPerDay || 8);
  const [areaEnableTravel, setAreaEnableTravel] = useState<boolean>(
    Boolean(provider.travelChargePerKm && provider.travelChargePerKm > 0),
  );
  const [areaFreeRadius, setAreaFreeRadius] = useState<number>(provider.freeServiceRadiusKm || 3);
  const [areaChargePerKm, setAreaChargePerKm] = useState<number>(provider.travelChargePerKm || 15);
  const [areaMaxCap, setAreaMaxCap] = useState<number>(provider.maxTravelCharge || 150);
  const [areaShopName, setAreaShopName] = useState<string>(provider.businessName || '');
  const [areaShopAddress, setAreaShopAddress] = useState<string>(
    provider.baseLocation?.label ? `${provider.baseLocation.label}, Bengaluru` : '',
  );

  // Feature 9 & 13: Working Hours & Vacation Mode Modal State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState<boolean>(false);
  const [workStart, setWorkStart] = useState<string>(provider.workingHours?.start || '08:00 AM');
  const [workEnd, setWorkEnd] = useState<string>(provider.workingHours?.end || '08:00 PM');
  const [selectedDaysOff, setSelectedDaysOff] = useState<string[]>(
    provider.workingHours?.daysOff || ['Sunday'],
  );
  const [isVacation, setIsVacation] = useState<boolean>(provider.isVacationMode || false);
  const [vacationNote, setVacationNote] = useState<string>(
    provider.vacationReason || 'Taking a short personal break. Resuming orders soon.',
  );

  // Feature 11: Payout Request Modal State
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(
    withdrawableBalance > 0 ? withdrawableBalance : 1000,
  );
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK_NEFT'>('UPI');
  const [payoutDetails, setPayoutDetails] = useState<string>('provider@okhdfcbank');

  // Feature 12: Delivery Sheet Checked IDs
  const [checkedManifestIds, setCheckedManifestIds] = useState<string[]>([]);

  // Daily Manifest Items (Scheduled orders + active subscriptions)
  const scheduledOrdersForManifest = providerOrders
    .filter(
      (o) => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS' || o.status === 'ACCEPTED',
    )
    .map((o) => ({
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
    .filter((s) => s.status === 'ACTIVE')
    .map((s) => ({
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

  const allManifestItems = [...scheduledOrdersForManifest, ...subscriptionsForManifest].sort(
    (a, b) => {
      return a.customerFlat.localeCompare(b.customerFlat);
    },
  );

  const toggleManifestCheck = (id: string) => {
    setCheckedManifestIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
    notify.success(`Service "${newServiceName}" has been added to your catalogue.`, {
      title: 'Service Added',
    });
  };

  // Submit Rejection
  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToReject) return;
    const finalReason =
      rejectionReasonOption === 'Other' && customRejectionText.trim()
        ? customRejectionText.trim()
        : rejectionReasonOption;

    updateOrderStatus(orderToReject.id, 'REJECTED', undefined, finalReason);
    setOrderToReject(null);
    setCustomRejectionText('');
    notify.info(
      `Order #${orderToReject.orderNumber} has been declined. The customer's escrow will be refunded in full.`,
      { title: 'Order Declined' },
    );
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
      isVacation ? vacationNote : undefined,
    );
    setShowAvailabilityModal(false);
    notify.success(
      isVacation
        ? 'Vacation mode enabled. New bookings are paused.'
        : 'Availability updated successfully. You are now accepting bookings.',
      { title: 'Availability Saved' },
    );
  };

  // Submit Payout Request
  const handleRequestPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0) return;
    requestPayout(provider.id, Number(payoutAmount), payoutMethod, payoutDetails);
    setShowPayoutModal(false);
    notify.success(
      `Payout request of ₹${payoutAmount} via ${payoutMethod} submitted. Processing in 1–2 business days.`,
      { title: 'Payout Requested' },
    );
  };

  const toggleDayOff = (day: string) => {
    setSelectedDaysOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div style={{ paddingBottom: '70px' }}>
      {/* Provider Header Banner */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--border-light)',
          padding: '20px 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={
                provider.avatarUrl ||
                'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120'
              }
              alt={provider.businessName}
              style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{provider.businessName}</h1>
                <span
                  className={`badge ${provider.status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`}
                  style={{ fontSize: '0.7rem' }}
                >
                  {provider.status}
                </span>

                {/* Feature 9 & 13: Live Vacation & Availability Badge */}
                {provider.isVacationMode ? (
                  <span
                    className="badge badge-amber"
                    style={{
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Palmtree size={12} /> Vacation Mode (Paused)
                  </span>
                ) : (
                  <span
                    className="badge badge-emerald"
                    style={{
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={12} /> Open ({provider.workingHours?.start || '8 AM'} -{' '}
                    {provider.workingHours?.end || '8 PM'})
                  </span>
                )}
                <span
                  className="badge badge-blue"
                  style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <MapPin size={12} /> Covers {coveredSocietiesList.length} societies within{' '}
                  {provider.maxServiceDistanceKm || 10} km
                </span>
                {provider.maxOrdersPerDay ? (
                  <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                    Cap: {provider.maxOrdersPerDay} orders/day
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  flexWrap: 'wrap',
                }}
              >
                <span>{provider.categoryName}</span>
                <span>•</span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'help' }}
                  title={
                    coveredSocietiesList.length > 0
                      ? `Serving: ${coveredSocietiesList.map((s) => s.name).join(', ')}`
                      : 'No coverage configured yet'
                  }
                >
                  <MapPin size={13} color="var(--primary)" />
                  {coveredSocietiesList.length > 0
                    ? `Covers ${coveredSocietiesList.length} ${coveredSocietiesList.length === 1 ? 'society' : 'societies'}${provider.coverageMode === 'RADIUS' ? ` · ${provider.maxServiceDistanceKm ?? 8} km radius` : ''}`
                    : 'No societies covered'}
                </span>
                <span>•</span>
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  <Sliders size={13} /> Edit Hours & Vacation
                </button>
                <span>•</span>
                <button
                  onClick={() => setShowServiceAreaModal(true)}
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
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
              {
                id: 'orders',
                label: `${t.navProviderOrders} (${providerOrders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED').length} active)`,
              },
              {
                id: 'manifest',
                label: `${t.navManifest} (${allManifestItems.length})`,
                icon: FileSpreadsheet,
              },
              {
                id: 'subscriptions',
                label: `${t.navProviderSubs} (${providerSubscriptions.length})`,
              },
              { id: 'services', label: `${t.navProviderServices} (${providerServices.length})` },
              {
                id: 'earnings',
                label: `${t.navEarnings} (₹${withdrawableBalance.toLocaleString()})`,
              },
              { id: 'reviews', label: `${t.navProviderReviews} (${myReviews.length})`, icon: Star },
              { id: 'dispatch', label: 'Job inbox & Billing', icon: Bell },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Parameters<typeof setActiveTab>[0])}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    minHeight: '36px',
                  }}
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
        {activeTab === 'dispatch' && <ProviderDispatchWorkspace />}

        {/* ============================================================== */}
        {/* OVERVIEW TAB */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <ProviderOverviewTab
            provider={provider}
            withdrawableBalance={withdrawableBalance}
            totalEarned={totalEarned}
            dynamicRating={dynamicRating}
            providerOrders={providerOrders}
            providerSubscriptions={providerSubscriptions}
            myReviews={myReviews}
            allManifestItems={allManifestItems}
            checkedManifestIds={checkedManifestIds}
            onToggleManifest={toggleManifestCheck}
            onGoToTab={(tab) => setActiveTab(tab as Parameters<typeof setActiveTab>[0])}
            onOpenAvailability={() => setShowAvailabilityModal(true)}
            onOpenPayout={() => setShowPayoutModal(true)}
          />
        )}

        {activeTab === 'orders' && (
          <ProviderOrdersTab
            providerOrders={providerOrders}
            onAccept={(id) => updateOrderStatus(id, 'ACCEPTED')}
            onSchedule={(id, date) => updateOrderStatus(id, 'SCHEDULED', date)}
            onProgress={(id) => updateOrderStatus(id, 'IN_PROGRESS')}
            onComplete={(id) => updateOrderStatus(id, 'COMPLETED')}
            onDecline={(order) => setOrderToReject(order)}
            onOpenChat={(id) => setChatOrderId(id)}
          />
        )}

        {activeTab === 'manifest' && (
          <ProviderManifestTab
            allManifestItems={allManifestItems}
            checkedManifestIds={checkedManifestIds}
            onToggleCheck={toggleManifestCheck}
          />
        )}

        {activeTab === 'subscriptions' && (
          <ProviderSubscriptionsTab
            providerSubscriptions={providerSubscriptions}
            checkedManifestIds={checkedManifestIds}
            onToggleCheck={toggleManifestCheck}
          />
        )}

        {activeTab === 'services' && (
          <ProviderServicesTab
            providerServices={providerServices}
            onAddService={() => setShowAddServiceModal(true)}
          />
        )}

        {activeTab === 'earnings' && (
          <ProviderEarningsTab
            withdrawableBalance={withdrawableBalance}
            totalGrossEarnings={totalGrossEarnings}
            totalCommissionPaid={totalCommissionPaid}
            totalWithdrawn={totalWithdrawn}
            completedOrders={completedOrders}
            providerPayouts={providerPayouts}
            onOpenPayout={() => setShowPayoutModal(true)}
          />
        )}

        {activeTab === 'reviews' && (
          <ProviderReviewsTab
            myReviews={myReviews}
            dynamicRating={Number(dynamicRating)}
            categoryName={provider.categoryName}
            businessName={provider.businessName}
            onRespondToReview={respondToReview}
          />
        )}
      </div>

      {/* Feature 10: Decline Order Modal */}
      {orderToReject && (
        <div className="modal-overlay" onClick={() => setOrderToReject(null)}>
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
                marginBottom: '14px',
                gap: '8px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                  Decline Booking Request
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Order #{orderToReject.orderNumber} • {orderToReject.customerName} (
                  {orderToReject.customerFlat})
                </div>
              </div>
              <button
                onClick={() => setOrderToReject(null)}
                style={{
                  color: 'var(--text-muted)',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Close decline modal"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Please provide a clear reason. The resident will be notified immediately and their
              payment escrow will be 100% refunded.
            </p>

            <form
              onSubmit={handleConfirmRejection}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label className="form-label">Select Reason for Declining</label>
                <AppSelect
                  label="Reason for declining"
                  value={rejectionReasonOption}
                  onChange={setRejectionReasonOption}
                  options={[
                    'Capacity full / high booking volume today',
                    'Equipment or machinery under scheduled maintenance',
                    'Requested time slot is outside our operational hours',
                    'Resident flat address inaccessible or outside service wing',
                    'On emergency leave / holiday',
                  ]
                    .map((reason) => ({ value: reason, label: reason }))
                    .concat({ value: 'Other', label: 'Other reason (describe below)...' })}
                />
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
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 'min(520px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}
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
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Operating Hours & Vacation Mode
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Control when society residents can book your services
                </div>
              </div>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                style={{
                  color: 'var(--text-muted)',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Close availability modal"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveAvailability}
              style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              {/* Vacation Mode Toggle */}
              <div
                style={{
                  background: isVacation ? '#fef3c7' : 'var(--bg-subtle)',
                  border: `1.5px solid ${isVacation ? '#f59e0b' : 'var(--border-light)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Palmtree size={22} color={isVacation ? '#b45309' : 'var(--text-muted)'} />
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: isVacation ? '#92400e' : 'var(--text-main)',
                        }}
                      >
                        Vacation / Pause Mode
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: isVacation ? '#b45309' : 'var(--text-muted)',
                        }}
                      >
                        Temporarily pause new customer bookings without cancelling recurring
                        subscriptions.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isVacation}
                    onChange={(e) => setIsVacation(e.target.checked)}
                    style={{
                      width: '22px',
                      height: '22px',
                      cursor: 'pointer',
                      accentColor: 'var(--primary)',
                    }}
                  />
                </div>

                {isVacation && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid #fde68a',
                    }}
                  >
                    <label className="form-label" style={{ color: '#92400e' }}>
                      Customer Notice
                    </label>
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
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>
                  Daily Working Hours
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label className="form-label">Opening Time</label>
                    <AppSelect
                      label="Work start time"
                      value={workStart}
                      onChange={setWorkStart}
                      options={[
                        { value: '06:00 AM', label: '06:00 AM (Early)' },
                        { value: '07:00 AM', label: '07:00 AM' },
                        { value: '08:00 AM', label: '08:00 AM' },
                        { value: '09:00 AM', label: '09:00 AM' },
                        { value: '10:00 AM', label: '10:00 AM' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="form-label">Closing Time</label>
                    <AppSelect
                      label="Work end time"
                      value={workEnd}
                      onChange={setWorkEnd}
                      options={['06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'].map(
                        (time) => ({ value: time, label: time }),
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Off Days */}
              <div>
                <label className="form-label">Designated Weekly Off Days</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ].map((day) => {
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
                <button type="submit" className="btn btn-primary btn-full">
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
                marginBottom: '14px',
                gap: '8px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Request Bank Payout</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Direct transfer from platform escrow to your account
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                style={{
                  color: 'var(--text-muted)',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Close payout modal"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleRequestPayoutSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Available Balance:
                </span>
                <span
                  style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}
                >
                  ₹{withdrawableBalance.toLocaleString()}
                </span>
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
                    onClick={() => {
                      setPayoutMethod('UPI');
                      setPayoutDetails('provider@okhdfcbank');
                    }}
                    className={`btn btn-sm ${payoutMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: '1 1 140px', minHeight: '44px' }}
                  >
                    UPI Transfer (Instant)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutMethod('BANK_NEFT');
                      setPayoutDetails('HDFC Bank - A/C 9928192849 (IFSC: HDFC000124)');
                    }}
                    className={`btn btn-sm ${payoutMethod === 'BANK_NEFT' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: '1 1 140px', minHeight: '44px' }}
                  >
                    NEFT / IMPS Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">
                  {payoutMethod === 'UPI' ? 'UPI ID (VPA)' : 'Bank Account Details & IFSC'}
                </label>
                <input
                  type="text"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={
                    payoutMethod === 'UPI'
                      ? 'e.g. mobile@upi or name@okaxis'
                      : 'e.g. A/C 123456789, IFSC: SBIN0001234'
                  }
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
                <button type="submit" className="btn btn-primary btn-full">
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
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 'min(520px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Service Offering</h3>
              <button
                onClick={() => setShowAddServiceModal(false)}
                style={{
                  color: 'var(--text-muted)',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Close add service modal"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateService}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
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
                <AppSelect
                  label="Pricing model"
                  value={newPricingModel}
                  onChange={(next) => setNewPricingModel(next as PricingModel)}
                  options={[
                    { value: 'FIXED', label: 'Fixed Price (e.g. ₹500/cleaning)' },
                    { value: 'HOURLY', label: 'Hourly Rate (e.g. ₹300/hr)' },
                    { value: 'PER_ITEM', label: 'Per Item (e.g. ₹40/shirt)' },
                    { value: 'SUBSCRIPTION', label: 'Monthly Subscription (e.g. ₹3,000/mo)' },
                    {
                      value: 'INSPECTION_VARIABLE',
                      label: 'Inspection + Variable (e.g. ₹299 checkup)',
                    },
                    { value: 'CUSTOM_QUOTATION', label: 'Custom Free Quotation' },
                  ]}
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
                <label className="form-label">Description &amp; What&apos;s Included</label>
                <textarea
                  rows={3}
                  placeholder="Explain what is covered for the society residents..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: '8px' }}
              >
                Publish Service to Marketplace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* In-App Chat Modal */}
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
              }}
            >
              <div
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '16px',
                  width: '480px',
                  maxWidth: '95vw',
                  maxHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>Chat — {chatOrder?.customerName}</div>
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
                    }}
                  >
                    {'x'}
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
                      No messages yet. Start the conversation safely inside LocalNest.
                    </div>
                  )}
                  {messages.map((m) => {
                    const isMe = m.senderId === currentUser?.id;
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
                            maxWidth: '72%',
                            background: isMe ? 'var(--primary)' : 'var(--card-hover)',
                            color: isMe ? '#fff' : 'var(--text-main)',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            padding: '8px 14px',
                            fontSize: '0.85rem',
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
                    🛡️ {chatError}
                  </div>
                )}
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '8px',
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
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      padding: '8px 12px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-main)',
                      fontSize: '0.87rem',
                    }}
                  />
                  <button
                    onClick={handleSend}
                    style={{
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={15} />
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
                  🔒 Keep all communication inside LocalNest. Sharing contact details is not
                  allowed.
                </div>
              </div>
            </div>
          );
        })()}

      {/* ================================================================
          EDIT SERVICE AREA & TRAVEL CHARGE MODAL
          (was referenced but never rendered — now wired up)
          ================================================================ */}
      {showServiceAreaModal &&
        (() => {
          const currentLocality = BENGALURU_LOCALITIES[areaLocalityIdx] || BENGALURU_LOCALITIES[0];
          const societiesWithDist = societies.map((soc) => {
            if (!soc.latitude || !soc.longitude)
              return {
                society: soc,
                distance: null,
                inRange: false,
                isExcluded: areaExcludedSocieties.includes(soc.id),
              };
            const dist = calculateHaversineDistance(
              currentLocality.latitude,
              currentLocality.longitude,
              soc.latitude,
              soc.longitude,
            );
            const inRange = dist <= areaMaxDistance;
            const isExcluded = areaExcludedSocieties.includes(soc.id);
            return {
              society: soc,
              distance: Math.round(dist * 10) / 10,
              inRange,
              isExcluded,
              isCovered: inRange && !isExcluded,
            };
          });

          const toggleExclude = (id: string) =>
            setAreaExcludedSocieties((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            );
          const toggleManual = (id: string) => {
            if (areaCoverageMode === 'SELECTED_SOCIETIES') {
              const exists = areaManualSocieties.includes(id);
              if (!exists) setAreaManualSocieties((prev) => [...prev, id]);
              else if (areaManualSocieties.length > 1)
                setAreaManualSocieties((prev) => prev.filter((x) => x !== id));
            }
          };

          const handleSave = () => {
            const derivedSupported =
              areaCoverageMode === 'RADIUS'
                ? societiesWithDist
                    .filter((s) => s.inRange && !s.isExcluded)
                    .map((s) => s.society.id)
                : areaManualSocieties;
            updateProviderServiceArea(provider.id, {
              baseLocation: {
                label: currentLocality.label,
                pincode: currentLocality.pincode,
                latitude: currentLocality.latitude,
                longitude: currentLocality.longitude,
              },
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
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowServiceAreaModal(false);
              }}
            >
              <div
                style={{
                  background: 'var(--bg-surface, #ffffff)',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: 'min(560px, 95vw)',
                  maxHeight: '90dvh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Navigation size={18} color="var(--primary)" /> Edit Service Area &amp; Travel
                    </div>
                    <div
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}
                    >
                      Changes apply immediately to new bookings
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close service area modal"
                    onClick={() => setShowServiceAreaModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body — scrollable */}
                <div
                  style={{
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                  }}
                >
                  {/* ── STEP 1: Shop Location ─────────────────────────── */}
                  <div style={{ marginBottom: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        1
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        Your Shop / Operating Location
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        paddingLeft: 'clamp(8px, 3vw, 28px)',
                      }}
                    >
                      <div>
                        <label className="form-label">Shop / Business Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={areaShopName}
                          onChange={(e) => setAreaShopName(e.target.value)}
                          placeholder="e.g. Rajan Plumbing Works"
                        />
                      </div>
                      <div>
                        <label className="form-label">
                          Area / Locality{' '}
                          <span style={{ color: 'var(--accent-rose)', fontSize: '0.72rem' }}>
                            *
                          </span>
                        </label>
                        <AppSelect
                          label="Locality"
                          value={String(areaLocalityIdx)}
                          onChange={(next) => setAreaLocalityIdx(Number(next))}
                          options={BENGALURU_LOCALITIES.map((loc, idx) => ({
                            value: String(idx),
                            label: `${loc.label} · PIN ${loc.pincode}`,
                          }))}
                        />
                        <div
                          style={{
                            fontSize: '0.71rem',
                            color: 'var(--text-muted)',
                            marginTop: '3px',
                          }}
                        >
                          📍 {currentLocality.latitude.toFixed(4)}° N,{' '}
                          {currentLocality.longitude.toFixed(4)}° E
                        </div>
                      </div>
                      <div>
                        <label className="form-label">
                          Landmark / Street Address{' '}
                          <span style={{ color: 'var(--text-subtle)', fontSize: '0.72rem' }}>
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={areaShopAddress}
                          onChange={(e) => setAreaShopAddress(e.target.value)}
                          placeholder="e.g. Near Total Mall, Sarjapur Road"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      height: '1px',
                      background: 'var(--border-light)',
                      marginBottom: '20px',
                    }}
                  />

                  {/* ── STEP 2: Coverage Mode + Radius ────────────────── */}
                  <div style={{ marginBottom: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        2
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        How Far Can You Travel?
                      </div>
                    </div>
                    <div
                      style={{
                        paddingLeft: 'clamp(8px, 3vw, 28px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      {/* Mode toggle */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setAreaCoverageMode('RADIUS')}
                          className={`btn btn-sm ${areaCoverageMode === 'RADIUS' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: '1 1 160px', minHeight: '44px' }}
                        >
                          <Sliders size={13} /> Radius from Shop
                        </button>
                        <button
                          type="button"
                          onClick={() => setAreaCoverageMode('SELECTED_SOCIETIES')}
                          className={`btn btn-sm ${areaCoverageMode === 'SELECTED_SOCIETIES' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: '1 1 160px', minHeight: '44px' }}
                        >
                          <MapPin size={13} /> Pick Societies Manually
                        </button>
                      </div>

                      {areaCoverageMode === 'RADIUS' && (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginBottom: '6px',
                            }}
                          >
                            <label className="form-label" style={{ margin: 0 }}>
                              Max travel distance from your shop:
                            </label>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '1.4rem',
                                color: 'var(--primary)',
                                lineHeight: 1,
                              }}
                            >
                              {areaMaxDistance}{' '}
                              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>km</span>
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="25"
                            step="1"
                            value={areaMaxDistance}
                            onChange={(e) => setAreaMaxDistance(Number(e.target.value))}
                            style={{
                              width: '100%',
                              accentColor: 'var(--primary)',
                              cursor: 'pointer',
                              height: '6px',
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.7rem',
                              color: 'var(--text-subtle)',
                              marginTop: '4px',
                            }}
                          >
                            <span>1 km</span>
                            <span>~5 min drive</span>
                            <span>25 km</span>
                          </div>
                          {/* Travel surcharge inline */}
                          <div
                            style={{
                              marginTop: '14px',
                              padding: '12px',
                              background: 'var(--bg-subtle)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={areaEnableTravel}
                                onChange={(e) => setAreaEnableTravel(e.target.checked)}
                              />
                              Charge travel fee for distant locations
                            </label>
                            {areaEnableTravel && (
                              <div
                                style={{
                                  marginTop: '10px',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                                  gap: '8px',
                                }}
                              >
                                <div>
                                  <label className="form-label" style={{ fontSize: '0.72rem' }}>
                                    Free within (km)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    value={areaFreeRadius}
                                    onChange={(e) => setAreaFreeRadius(Number(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '6px' }}
                                  />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontSize: '0.72rem' }}>
                                    ₹ / km after
                                  </label>
                                  <input
                                    type="number"
                                    min="5"
                                    max="100"
                                    value={areaChargePerKm}
                                    onChange={(e) => setAreaChargePerKm(Number(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '6px' }}
                                  />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontSize: '0.72rem' }}>
                                    Max cap (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="20"
                                    max="500"
                                    value={areaMaxCap}
                                    onChange={(e) => setAreaMaxCap(Number(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '6px' }}
                                  />
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
                            {societies.map((soc) => {
                              const isChecked = areaManualSocieties.includes(soc.id);
                              return (
                                <button
                                  key={soc.id}
                                  type="button"
                                  onClick={() => toggleManual(soc.id)}
                                  className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{
                                    fontSize: '0.78rem',
                                    borderRadius: '20px',
                                    minHeight: '36px',
                                  }}
                                >
                                  <MapPin size={11} /> {soc.name}
                                </button>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              marginTop: '10px',
                              padding: '10px',
                              background: 'var(--bg-subtle)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={areaEnableTravel}
                                onChange={(e) => setAreaEnableTravel(e.target.checked)}
                              />
                              Charge travel fee for distant societies
                            </label>
                            {areaEnableTravel && (
                              <div
                                style={{
                                  marginTop: '10px',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                                  gap: '8px',
                                }}
                              >
                                <div>
                                  <label className="form-label" style={{ fontSize: '0.72rem' }}>
                                    Free within (km)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    value={areaFreeRadius}
                                    onChange={(e) => setAreaFreeRadius(Number(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '6px' }}
                                  />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontSize: '0.72rem' }}>
                                    ₹ / km after
                                  </label>
                                  <input
                                    type="number"
                                    min="5"
                                    max="100"
                                    value={areaChargePerKm}
                                    onChange={(e) => setAreaChargePerKm(Number(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '6px' }}
                                  />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontSize: '0.72rem' }}>
                                    Max cap (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="20"
                                    max="500"
                                    value={areaMaxCap}
                                    onChange={(e) => setAreaMaxCap(Number(e.target.value))}
                                    className="form-input"
                                    style={{ padding: '6px' }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      height: '1px',
                      background: 'var(--border-light)',
                      marginBottom: '20px',
                    }}
                  />

                  {/* ── STEP 3: Coverage Preview (Radius mode only) ──── */}
                  {areaCoverageMode === 'RADIUS' && (
                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          3
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          Coverage Preview
                          <span
                            style={{
                              marginLeft: '8px',
                              fontWeight: 400,
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {societiesWithDist.filter((s) => s.inRange && !s.isExcluded).length} of{' '}
                            {societies.length} societies covered
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          paddingLeft: 'clamp(8px, 3vw, 28px)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          maxHeight: '220px',
                          overflowY: 'auto',
                        }}
                      >
                        {societiesWithDist
                          .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
                          .map(({ society, distance, inRange, isExcluded }) => (
                            <div
                              key={society.id}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${inRange && !isExcluded ? 'rgba(13,148,136,0.25)' : 'var(--border-light)'}`,
                                background:
                                  inRange && !isExcluded
                                    ? 'rgba(13,148,136,0.05)'
                                    : 'var(--bg-subtle)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                opacity: inRange ? 1 : 0.55,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    background:
                                      inRange && !isExcluded
                                        ? 'var(--primary)'
                                        : 'var(--text-subtle)',
                                  }}
                                />
                                <div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                                    {society.name}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {society.locality || society.city}
                                    {distance !== null ? ` · ${distance} km from your shop` : ''}
                                  </div>
                                </div>
                              </div>
                              <div>
                                {inRange ? (
                                  <label
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isExcluded}
                                      onChange={() => toggleExclude(society.id)}
                                    />
                                    <span
                                      style={{
                                        color: isExcluded
                                          ? 'var(--accent-rose)'
                                          : 'var(--text-muted)',
                                      }}
                                    >
                                      {isExcluded ? 'Excluded' : 'Exclude'}
                                    </span>
                                  </label>
                                ) : (
                                  <span
                                    style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}
                                  >
                                    out of range
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Order Cap */}
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                        Daily Order Booking Limit
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Blocks new bookings once you hit capacity.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={areaDailyCap}
                        onChange={(e) => setAreaDailyCap(Number(e.target.value))}
                        className="form-input"
                        style={{ width: '72px', padding: '6px', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        orders/day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setShowServiceAreaModal(false)}
                    className="btn btn-secondary btn-sm"
                    style={{ minHeight: '44px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}
                  >
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
