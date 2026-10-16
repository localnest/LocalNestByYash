'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { DiscountType, CoverageMode, Provider, Complaint } from '@/lib/types';
import { useNotification } from '@/features/notifications/notificationContext';
import {
  BarChart3,
  ShieldCheck,
  Percent,
  Tag,
  AlertTriangle,
  Building,
  RefreshCw,
  Megaphone,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import AdminDispatchWorkbench from './AdminDispatchWorkbench';
import {
  AdminOverviewTab,
  AdminProvidersTab,
  AdminCommissionTab,
  AdminCouponsTab,
  AdminDisputesTab,
  AdminSocietiesTab,
  AdminNoticesTab,
  AdminLeakageTab,
  AdminCoverageTab,
} from './admin';

export default function AdminPanel() {
  const {
    societies,
    providers,
    orders,
    subscriptions,
    coupons,
    commissionRules,
    complaints,
    notices,
    updateProviderStatus,
    updateCommissionRule,
    createCoupon,
    toggleCouponActive,
    updateComplaintStatus,
    addSociety,
    createNotice,
    deactivateNotice,
    chatMessages,
    updateProviderServiceArea,
    serviceRequests,
    categories,
    markFlaggedReviewed,
    platformFeeRules,
    updatePlatformFeeRules,
  } = useMarketplace();
  const { notify } = useNotification();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'providers'
    | 'commission'
    | 'coupons'
    | 'disputes'
    | 'societies'
    | 'notices'
    | 'leakage'
    | 'coverage'
    | 'dispatch'
  >('overview');

  // New Coupon Form State
  const [showAddCouponModal, setShowAddCouponModal] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponTitle, setCouponTitle] = useState<string>('');
  const [couponDesc, setCouponDesc] = useState<string>('');
  const [discountType, setDiscountType] = useState<DiscountType>('FLAT');
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [minOrderValue, setMinOrderValue] = useState<number>(400);
  const [maxDiscount] = useState<number>(100);
  const [usageLimit, setUsageLimit] = useState<number>(200);

  // New Society Modal State
  const [showAddSocietyModal, setShowAddSocietyModal] = useState<boolean>(false);
  const [newSocName, setNewSocName] = useState<string>('');
  const [newSocAddress, setNewSocAddress] = useState<string>('');
  const [newSocFlats, setNewSocFlats] = useState<number>(1200);
  const [newSocCity] = useState<string>('Bengaluru');
  const [newSocPincode, setNewSocPincode] = useState<string>('560066');

  // Feature 16: Dispute Resolution State
  // Admin Provider Coverage Override State
  const [editingCoverageProv, setEditingCoverageProv] = useState<Provider | null>(null);
  const [overrideRadius, setOverrideRadius] = useState<number>(10);
  const [overrideMode, setOverrideMode] = useState<CoverageMode>('RADIUS');
  const [overrideDailyCap, setOverrideDailyCap] = useState<number>(10);

  const [mediatingComplaint, setMediatingComplaint] = useState<Complaint | null>(null);
  const [mediationResolutionType, setMediationResolutionType] = useState<
    'FULL_REFUND' | 'PARTIAL_REFUND' | 'FREE_REWORK' | 'MEDIATED_DISMISSED'
  >('FULL_REFUND');
  const [customResolutionText, setCustomResolutionText] = useState<string>(
    'Full refund approved from platform escrow.',
  );
  const [internalAdminNote, setInternalAdminNote] = useState<string>(
    'Reviewed resident complaint details and confirmed validity.',
  );
  const [customRefundAmount, setCustomRefundAmount] = useState<number>(0);

  const handleOpenMediation = (comp: Complaint) => {
    setMediatingComplaint(comp);
    const matchedOrder = orders.find(
      (o) => o.id === comp.orderId || o.orderNumber === comp.orderNumber,
    );
    const defaultAmount = matchedOrder?.totalAmount || 350;
    setCustomRefundAmount(defaultAmount);
    setMediationResolutionType('FULL_REFUND');
    setCustomResolutionText(
      `Dispute investigated by Society Admin. Full refund of ₹${defaultAmount} approved from escrow and reversed to resident payment source.`,
    );
    setInternalAdminNote(
      `Verified with resident ${comp.customerName} and provider ${comp.providerName}. Service dispute settled with platform escrow reversal.`,
    );
  };

  const handleResolveDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediatingComplaint) return;

    updateComplaintStatus(
      mediatingComplaint.id,
      'RESOLVED',
      customResolutionText,
      internalAdminNote,
      mediationResolutionType,
      mediationResolutionType === 'FULL_REFUND' || mediationResolutionType === 'PARTIAL_REFUND'
        ? customRefundAmount
        : 0,
    );

    setMediatingComplaint(null);
    notify.success(
      `Dispute #${mediatingComplaint.id.slice(-6).toUpperCase()} resolved. ${customResolutionText}`,
      { title: 'Dispute Resolved' },
    );
  };

  // Compute Platform Metrics
  const totalGmv = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const platformRevenue = orders.reduce((sum, o) => sum + o.platformCommission, 0);
  const recurringGmv = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.monthlyPrice, 0);
  const pendingProvidersCount = providers.filter(
    (p) => p.status === 'PENDING' || p.status === 'UNDER_REVIEW',
  ).length;
  const openComplaintsCount = complaints.filter(
    (c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW',
  ).length;

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    createCoupon({
      code: couponCode.trim().toUpperCase(),
      title: couponTitle,
      description: couponDesc,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      maxDiscount: discountType === 'PERCENTAGE' ? Number(maxDiscount) : undefined,
      usageLimit: Number(usageLimit),
      perUserLimit: 1,
      isActive: true,
    });

    setShowAddCouponModal(false);
    setCouponCode('');
    setCouponTitle('');
    setCouponDesc('');
    notify.success(`Coupon "${couponCode.trim().toUpperCase()}" created and is now live.`, {
      title: 'Coupon Created',
    });
  };

  const handleCreateSocietySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocName.trim()) return;

    addSociety({
      communityId: 'comm-expansion',
      name: newSocName,
      addressLine: newSocAddress,
      city: newSocCity,
      pincode: newSocPincode,
      latitude: 12.9716,
      longitude: 77.5946,
      totalFlats: Number(newSocFlats),
      isActive: true,
    });

    setShowAddSocietyModal(false);
    setNewSocName('');
    setNewSocAddress('');
    notify.success(`Society "${newSocName}" onboarded to the platform.`, {
      title: 'Society Added',
    });
  };

  return (
    <div style={{ paddingBottom: '70px' }}>
      {/* Admin Panel Header */}
      <div
        style={{
          background: '#0f172a',
          color: '#fff',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
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
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
              >
                A
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                Platform Operations Hub
              </h1>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                Chief Administrator
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              Monitoring {societies.length} societies •{' '}
              {societies.reduce((sum, s) => sum + s.totalFlats, 0).toLocaleString()} connected
              residential flats
            </p>
          </div>

          {/* Admin Navigation Pills */}
          <div
            className="scrollable-tabs"
            style={{
              display: 'flex',
              gap: '6px',
              maxWidth: '100%',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {[
              { id: 'overview', label: 'Overview & GMV', icon: BarChart3 },
              {
                id: 'providers',
                label: `Provider Queue (${pendingProvidersCount})`,
                icon: ShieldCheck,
              },
              { id: 'commission', label: 'Take Rates & Rules', icon: Percent },
              { id: 'coupons', label: 'Coupons & Promos', icon: Tag },
              { id: 'disputes', label: `Disputes (${openComplaintsCount})`, icon: AlertTriangle },
              { id: 'societies', label: 'Societies & Expansion', icon: Building },
              {
                id: 'notices',
                label: `Notices (${notices.filter((n) => n.isActive).length})`,
                icon: Megaphone,
              },
              {
                id: 'leakage',
                label: `Leakage Alerts (${chatMessages.filter((m) => m.isFlagged && !m.flaggedReason?.startsWith('[REVIEWED]')).length})`,
                icon: AlertCircle,
              },
              { id: 'coverage', label: 'Supply Gap Matrix', icon: MapPin },
              { id: 'dispatch', label: 'Dispatch Ops', icon: RefreshCw },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Parameters<typeof setActiveTab>[0])}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-dark'}`}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    padding: '8px 14px',
                    flexShrink: 0,
                    minHeight: '44px',
                    whiteSpace: 'nowrap',
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

      <div className="container" style={{ marginTop: '24px' }}>
        {activeTab === 'dispatch' && <AdminDispatchWorkbench />}

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & GMV ANALYTICS */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <AdminOverviewTab
            orders={orders}
            subscriptions={subscriptions}
            totalGmv={totalGmv}
            recurringGmv={recurringGmv}
            platformRevenue={platformRevenue}
            openComplaintsCount={openComplaintsCount}
          />
        )}

        {activeTab === 'providers' && (
          <AdminProvidersTab
            providers={providers}
            societies={societies}
            onUpdateStatus={updateProviderStatus}
            onEditCoverage={(prov) => {
              setEditingCoverageProv(prov);
              setOverrideRadius(prov.maxServiceDistanceKm || 8);
              setOverrideMode(prov.coverageMode || 'RADIUS');
              setOverrideDailyCap(prov.maxOrdersPerDay || 8);
            }}
          />
        )}

        {activeTab === 'commission' && (
          <AdminCommissionTab
            commissionRules={commissionRules}
            updateCommissionRule={updateCommissionRule}
            platformFeeRules={platformFeeRules}
            updatePlatformFeeRules={updatePlatformFeeRules}
          />
        )}

        {activeTab === 'coupons' && (
          <AdminCouponsTab
            coupons={coupons}
            toggleCouponActive={toggleCouponActive}
            onAddCoupon={() => setShowAddCouponModal(true)}
          />
        )}

        {activeTab === 'disputes' && (
          <AdminDisputesTab
            complaints={complaints}
            onOpenMediation={handleOpenMediation}
            onQuickDismiss={(id) =>
              updateComplaintStatus(
                id,
                'RESOLVED',
                'Amicable resolution reached between resident and provider.',
                'Dismissed/settled directly.',
                'MEDIATED_DISMISSED',
              )
            }
          />
        )}

        {activeTab === 'societies' && (
          <AdminSocietiesTab
            societies={societies}
            providers={providers}
            onAddSociety={() => setShowAddSocietyModal(true)}
          />
        )}

        {activeTab === 'notices' && (
          <AdminNoticesTab
            notices={notices}
            societies={societies}
            onPostNotice={createNotice}
            deactivateNotice={deactivateNotice}
          />
        )}

        {activeTab === 'leakage' && (
          <AdminLeakageTab
            chatMessages={chatMessages}
            orders={orders}
            markFlaggedReviewed={markFlaggedReviewed}
          />
        )}

        {activeTab === 'coverage' && (
          <AdminCoverageTab
            societies={societies}
            categories={categories}
            providers={providers}
            serviceRequests={serviceRequests}
            onNavigateToProviders={() => setActiveTab('providers')}
          />
        )}
      </div>

      {/* Admin Coverage Override Modal */}
      {editingCoverageProv && (
        <div className="modal-overlay" onClick={() => setEditingCoverageProv(null)}>
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
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  Adjust Coverage: {editingCoverageProv.businessName}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Admin Operations Override
                </div>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setEditingCoverageProv(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProviderServiceArea(editingCoverageProv.id, {
                  maxServiceDistanceKm: Number(overrideRadius),
                  coverageMode: overrideMode,
                  maxOrdersPerDay: Number(overrideDailyCap),
                });
                setEditingCoverageProv(null);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label className="form-label">Coverage Mode</label>
                <select
                  value={overrideMode}
                  onChange={(e) => setOverrideMode(e.target.value as CoverageMode)}
                  className="form-input"
                >
                  <option value="RADIUS">Radius Mode</option>
                  <option value="SELECTED_SOCIETIES">Manual Selected Societies Mode</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  Max Travel Radius: <strong>{overrideRadius} km</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={overrideRadius}
                  onChange={(e) => setOverrideRadius(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label className="form-label">Daily Order Booking Limit</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={overrideDailyCap}
                  onChange={(e) => setOverrideDailyCap(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setEditingCoverageProv(null)}
                  className="btn btn-secondary"
                  style={{ flex: '1 1 120px', minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: '2 1 160px', minHeight: '44px' }}
                >
                  Save Coverage Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {showAddCouponModal && (
        <div className="modal-overlay" onClick={() => setShowAddCouponModal(false)}>
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
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create New Society Coupon</h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setShowAddCouponModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateCouponSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label className="form-label">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  placeholder="e.g. MONSOON20 or FESTIVE150"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Offer Headline</label>
                <input
                  type="text"
                  placeholder="e.g. 20% Off Weekend Cleaning"
                  value={couponTitle}
                  onChange={(e) => setCouponTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="form-label">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="form-input"
                  >
                    <option value="FLAT">Flat ₹ Discount</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIRST_ORDER">First Order Only</option>
                    <option value="SUBSCRIPTION">Monthly Subscription Discount</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Discount Value</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="form-label">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Usage Limit (Uses)</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description / Terms</label>
                <textarea
                  rows={2}
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  className="form-input"
                  placeholder="Explain terms clearly for residents..."
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: '6px', minHeight: '44px' }}
              >
                Deploy Coupon to Platform
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Society Modal */}
      {showAddSocietyModal && (
        <div className="modal-overlay" onClick={() => setShowAddSocietyModal(false)}>
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
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Onboard New Residential Society
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setShowAddSocietyModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateSocietySubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label className="form-label">Society Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prestige Shantiniketan"
                  value={newSocName}
                  onChange={(e) => setNewSocName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Address Line</label>
                <input
                  type="text"
                  placeholder="e.g. Whitefield Main Road"
                  value={newSocAddress}
                  onChange={(e) => setNewSocAddress(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                  gap: '10px',
                }}
              >
                <div>
                  <label className="form-label">Total Flats / Units</label>
                  <input
                    type="number"
                    value={newSocFlats}
                    onChange={(e) => setNewSocFlats(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    value={newSocPincode}
                    onChange={(e) => setNewSocPincode(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: '6px', minHeight: '44px' }}
              >
                Add Society to Multi-Society Network
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feature 16: Dispute Resolution Mediation Modal */}
      {mediatingComplaint && (
        <div className="modal-overlay" onClick={() => setMediatingComplaint(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 'min(580px, 95vw)', maxHeight: '90dvh', overflowY: 'auto' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <span
                  className="badge badge-rose"
                  style={{ fontSize: '0.7rem', marginBottom: '4px' }}
                >
                  Escrow Arbitration Desk
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Dispute Resolution #{mediatingComplaint.ticketNumber}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Order #{mediatingComplaint.orderNumber} • Resident:{' '}
                  {mediatingComplaint.customerName}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setMediatingComplaint(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Case Details Box */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.85rem',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Service Provider:</span>
                <strong>{mediatingComplaint.providerName}</strong>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Complaint Category:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>
                  {mediatingComplaint.category}
                </span>
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '8px',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  Resident Statement:
                </span>{' '}
                &ldquo;{mediatingComplaint.description}&rdquo;
              </div>
            </div>

            <form
              onSubmit={handleResolveDispute}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Choose Binding Arbitration Outcome
                </label>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}
                >
                  {[
                    {
                      id: 'FULL_REFUND',
                      label: '💳 100% Full Escrow Refund',
                      desc: 'Reverses payment to resident card; updates order to REFUNDED.',
                    },
                    {
                      id: 'PARTIAL_REFUND',
                      label: '🪙 Partial Escrow Refund (Custom Amount)',
                      desc: 'Reimburses resident partially, releases remaining balance to provider.',
                    },
                    {
                      id: 'FREE_REWORK',
                      label: '🔄 Free Provider Rework & Redelivery',
                      desc: 'Provider undertakes redelivery/fix with zero resident charge.',
                    },
                    {
                      id: 'MEDIATED_DISMISSED',
                      label: '⚖️ Dismiss Claim / Mutual Amicable Settlement',
                      desc: 'Both parties agree on service fulfillment; standard escrow clearance.',
                    },
                  ].map((option) => (
                    <label
                      key={option.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${mediationResolutionType === option.id ? 'var(--primary-600)' : 'var(--border-light)'}`,
                        background:
                          mediationResolutionType === option.id
                            ? 'rgba(79, 70, 229, 0.05)'
                            : 'var(--bg-card)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="mediationOutcome"
                        value={option.id}
                        checked={mediationResolutionType === option.id}
                        onChange={() =>
                          setMediationResolutionType(
                            option.id as
                              | 'FULL_REFUND'
                              | 'PARTIAL_REFUND'
                              | 'FREE_REWORK'
                              | 'MEDIATED_DISMISSED',
                          )
                        }
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{option.label}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {(mediationResolutionType === 'FULL_REFUND' ||
                mediationResolutionType === 'PARTIAL_REFUND') && (
                <div>
                  <label className="form-label">Escrow Refund Amount (₹)</label>
                  <input
                    type="number"
                    value={customRefundAmount}
                    onChange={(e) => setCustomRefundAmount(Number(e.target.value))}
                    min={1}
                    className="form-input"
                    required
                  />
                  <div
                    style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}
                  >
                    Refund is credited directly via Razorpay Gateway integration back to resident
                    source card/UPI.
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">
                  Public Resolution Statement (Sent to Resident & Provider)
                </label>
                <textarea
                  rows={2}
                  value={customResolutionText}
                  onChange={(e) => setCustomResolutionText(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Internal Operations Audit Note (Admin Paper Trail)
                </label>
                <input
                  type="text"
                  value={internalAdminNote}
                  onChange={(e) => setInternalAdminNote(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setMediatingComplaint(null)}
                  className="btn btn-secondary"
                  style={{ flex: '1 1 120px', minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: '2 1 180px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '44px',
                  }}
                >
                  <ShieldCheck size={16} /> Enforce Resolution & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
