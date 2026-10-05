'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { ProviderStatus, DiscountType, NoticeType } from '@/lib/types';
import { 
  BarChart3, ShieldCheck, Percent, Tag, 
  AlertTriangle, Building, Check, 
  X, Plus, FileText, RefreshCw, DollarSign, 
  Users, CheckCircle2, Sliders, Bell, Megaphone, Wrench, AlertCircle, Eye, EyeOff
} from 'lucide-react';

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
    currentUser,
  } = useMarketplace();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'commission' | 'coupons' | 'disputes' | 'societies' | 'notices'>('overview');

  // New Coupon Form State
  const [showAddCouponModal, setShowAddCouponModal] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponTitle, setCouponTitle] = useState<string>('');
  const [couponDesc, setCouponDesc] = useState<string>('');
  const [discountType, setDiscountType] = useState<DiscountType>('FLAT');
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [minOrderValue, setMinOrderValue] = useState<number>(400);
  const [maxDiscount, setMaxDiscount] = useState<number>(100);
  const [usageLimit, setUsageLimit] = useState<number>(200);

  // New Society Modal State
  const [showAddSocietyModal, setShowAddSocietyModal] = useState<boolean>(false);
  const [newSocName, setNewSocName] = useState<string>('');
  const [newSocAddress, setNewSocAddress] = useState<string>('');
  const [newSocFlats, setNewSocFlats] = useState<number>(1200);
  const [newSocCity, setNewSocCity] = useState<string>('Bengaluru');
  const [newSocPincode, setNewSocPincode] = useState<string>('560066');

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState<string>('');
  const [noticeContent, setNoticeContent] = useState<string>('');
  const [noticeType, setNoticeType] = useState<NoticeType>('ANNOUNCEMENT');
  const [noticePriority, setNoticePriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [noticeSocietyId, setNoticeSocietyId] = useState<string>('ALL');
  const [noticeSuccess, setNoticeSuccess] = useState<string>('');

  // Compute Platform Metrics
  const totalGmv = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const platformRevenue = orders.reduce((sum, o) => sum + o.platformCommission, 0);
  const recurringGmv = subscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s.monthlyPrice, 0);
  const activeProvidersCount = providers.filter(p => p.status === 'VERIFIED').length;
  const pendingProvidersCount = providers.filter(p => p.status === 'PENDING' || p.status === 'UNDER_REVIEW').length;
  const openComplaintsCount = complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;
  const totalCompletedOrders = orders.filter(o => o.status === 'COMPLETED').length;

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
      totalFlats: Number(newSocFlats),
      isActive: true,
    });

    setShowAddSocietyModal(false);
    setNewSocName('');
    setNewSocAddress('');
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    const soc = societies.find(s => s.id === noticeSocietyId);
    const targetSocName = noticeSocietyId === 'ALL' ? 'All Societies' : (soc?.name || 'Unknown Society');

    createNotice({
      societyId: noticeSocietyId,
      societyName: targetSocName,
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      type: noticeType,
      priority: noticePriority,
      authorName: currentUser?.fullName || 'Platform Administrator',
    });

    setNoticeTitle('');
    setNoticeContent('');
    setNoticeSuccess(`Notice posted to ${targetSocName} successfully!`);
    setTimeout(() => setNoticeSuccess(''), 4000);
  };

  const getNoticeTypeIcon = (type: NoticeType) => {
    switch(type) {
      case 'MAINTENANCE': return <Wrench size={14} />;
      case 'ALERT': return <AlertCircle size={14} />;
      case 'SERVICE_UPDATE': return <RefreshCw size={14} />;
      default: return <Megaphone size={14} />;
    }
  };

  const getNoticeTypeBadge = (type: NoticeType) => {
    switch(type) {
      case 'MAINTENANCE': return <span className="badge badge-amber">{type.replace('_',' ')}</span>;
      case 'ALERT': return <span className="badge badge-rose">{type}</span>;
      case 'SERVICE_UPDATE': return <span className="badge badge-blue">SERVICE UPDATE</span>;
      default: return <span className="badge badge-slate">{type}</span>;
    }
  };

  return (
    <div style={{ paddingBottom: '70px' }}>
      
      {/* Admin Panel Header */}
      <div style={{ background: '#0f172a', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                A
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>Platform Operations Hub</h1>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                Chief Administrator
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              Monitoring {societies.length} societies • {societies.reduce((sum, s) => sum + s.totalFlats, 0).toLocaleString()} connected residential flats
            </p>
          </div>

          {/* Admin Navigation Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'overview', label: 'Overview & GMV', icon: BarChart3 },
              { id: 'providers', label: `Provider Queue (${pendingProvidersCount})`, icon: ShieldCheck },
              { id: 'commission', label: 'Take Rates & Rules', icon: Percent },
              { id: 'coupons', label: 'Coupons & Promos', icon: Tag },
              { id: 'disputes', label: `Disputes (${openComplaintsCount})`, icon: AlertTriangle },
              { id: 'societies', label: 'Societies & Expansion', icon: Building },
              { id: 'notices', label: `Notices (${notices.filter(n => n.isActive).length})`, icon: Megaphone },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-dark'}`}
                  style={{ borderRadius: '8px', fontSize: '0.78rem', padding: '6px 12px' }}
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
        
        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & GMV ANALYTICS */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Top Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>GROSS MERCHANDISE VALUE</span>
                  <DollarSign size={18} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
                  ₹{totalGmv.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  Across {orders.length} resident orders
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>MONTHLY RECURRING GMV</span>
                  <RefreshCw size={18} color="var(--accent-blue)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '8px' }}>
                  ₹{recurringGmv.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {subscriptions.filter(s => s.status === 'ACTIVE').length} active household subscriptions
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>PLATFORM COMMISSION REVENUE</span>
                  <Percent size={18} color="var(--accent-emerald)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '8px' }}>
                  ₹{platformRevenue.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Average platform take-rate: ~10.0%
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>MARKETPLACE TRUST SCORE</span>
                  <ShieldCheck size={18} color="#f59e0b" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
                  98.6%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  {openComplaintsCount === 0 ? '0 open disputes' : `${openComplaintsCount} ticket under mediation`}
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
                Recent Platform Orders
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px' }}>Order #</th>
                      <th style={{ padding: '10px 14px' }}>Society Flat</th>
                      <th style={{ padding: '10px 14px' }}>Service & Provider</th>
                      <th style={{ padding: '10px 14px' }}>Total Amount</th>
                      <th style={{ padding: '10px 14px' }}>Platform Cut</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{order.orderNumber}</td>
                        <td style={{ padding: '10px 14px' }}>{order.customerFlat}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div>{order.serviceName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {order.providerName}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>₹{order.totalAmount}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          ₹{order.platformCommission} ({order.commissionPercentage}%)
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PROVIDER VERIFICATION QUEUE */}
        {/* ============================================================== */}
        {activeTab === 'providers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Provider Verification & Quality Desk</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Approve, review documentation, or suspend provider accounts to safeguard resident trust.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {providers.map(prov => {
                const isPending = prov.status === 'PENDING' || prov.status === 'UNDER_REVIEW';
                const isVerified = prov.status === 'VERIFIED';
                return (
                  <div key={prov.id} className="card" style={{ borderLeft: isVerified ? '4px solid var(--accent-emerald)' : '4px solid var(--accent-amber)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className={`badge ${isVerified ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.68rem' }}>
                          {prov.status}
                        </span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>{prov.businessName}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {prov.phone}</div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '10px 0' }}>
                      {prov.description}
                    </p>

                    {/* Documents */}
                    <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: 'var(--radius-md)', margin: '10px 0', fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>DOCUMENTS SUBMITTED:</div>
                      {prov.documents && prov.documents.length > 0 ? (
                        prov.documents.map(d => (
                          <div key={d.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span>📄 {d.type}</span>
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Submitted</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>No digital ID docs uploaded yet.</div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                      {isPending && (
                        <>
                          <button
                            onClick={() => updateProviderStatus(prov.id, 'VERIFIED')}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                          >
                            <Check size={14} /> Verify & Approve
                          </button>
                          <button
                            onClick={() => updateProviderStatus(prov.id, 'REJECTED')}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--accent-rose)' }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}

                      {isVerified && (
                        <button
                          onClick={() => updateProviderStatus(prov.id, 'SUSPENDED')}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--accent-rose)', flex: 1 }}
                        >
                          Suspend Account
                        </button>
                      )}

                      {prov.status === 'SUSPENDED' && (
                        <button
                          onClick={() => updateProviderStatus(prov.id, 'VERIFIED')}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          Reactivate Provider
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
        {/* TAB 3: COMMISSION MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'commission' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Platform Take-Rate & Commission Rules</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Configure platform commissions without hardcoding. Supports default, category overrides, and service tiers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {commissionRules.map(rule => (
                <div key={rule.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      {rule.ruleType} TIER
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)' }}>
                      {rule.commissionPercentage}%
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '8px' }}>
                    {rule.targetName || 'Platform Default Take Rate'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {rule.notes}
                  </p>

                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Adjust Rate (%):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={rule.commissionPercentage}
                      onChange={(e) => updateCommissionRule(rule.id, Number(e.target.value))}
                      className="form-input"
                      style={{ width: '80px', padding: '6px 8px' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      ✓ Applied to live orders
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: DISCOUNTS & COUPON ENGINE */}
        {/* ============================================================== */}
        {activeTab === 'coupons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Discounts & Promotions Engine</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Manage server-validated coupons, first-order promotions, and society welcome vouchers.
                </p>
              </div>
              <button 
                onClick={() => setShowAddCouponModal(true)} 
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} /> Create Coupon
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {coupons.map(coupon => (
                <div key={coupon.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em', color: 'var(--primary)' }}>
                          {coupon.code}
                        </span>
                        <span className={`badge ${coupon.isActive ? 'badge-emerald' : 'badge-slate'}`} style={{ fontSize: '0.65rem' }}>
                          {coupon.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>{coupon.title}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        {coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'SUBSCRIPTION' 
                          ? `${coupon.discountValue}% OFF` 
                          : `₹${coupon.discountValue} OFF`}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0' }}>
                    {coupon.description}
                  </p>

                  <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Min Order: ₹{coupon.minOrderValue}</span>
                    <span>Used: {coupon.currentUsage} / {coupon.usageLimit || '∞'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '12px' }}>
                    <button
                      onClick={() => toggleCouponActive(coupon.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {coupon.isActive ? 'Disable Promo' : 'Enable Promo'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: DISPUTES & COMPLAINTS MEDIATION */}
        {/* ============================================================== */}
        {activeTab === 'disputes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Disputes & Escrow Mediation</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Safeguard society residents with escrow holds and transparent dispute resolution.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {complaints.map(comp => (
                <div key={comp.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Ticket #{comp.ticketNumber}</span>
                        <span className={`badge ${comp.status === 'RESOLVED' ? 'badge-emerald' : 'badge-rose'}`}>
                          {comp.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Resident: <strong>{comp.customerName}</strong> • Provider: <strong>{comp.providerName}</strong> • Order #{comp.orderNumber}
                      </div>
                    </div>
                  </div>

                  <div style={{ margin: '12px 0', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                      Reason: {comp.category}
                    </div>
                    <p style={{ color: 'var(--text-muted)' }}>{comp.description}</p>
                  </div>

                  {comp.adminNotes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <strong>Operations Log:</strong> {comp.adminNotes}
                    </div>
                  )}

                  {comp.status !== 'RESOLVED' ? (
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                      <button
                        onClick={() => updateComplaintStatus(comp.id, 'RESOLVED', 'Refund approved and credited back to resident Razorpay card.', 'Resolved by Admin mediator.')}
                        className="btn btn-primary btn-sm"
                      >
                        <Check size={14} /> Issue Full Refund & Resolve
                      </button>
                      <button
                        onClick={() => updateComplaintStatus(comp.id, 'RESOLVED', 'Garment replacement fulfilled by provider. Resident confirmed satisfactory delivery.', 'Resolved by provider delivery.')}
                        className="btn btn-secondary btn-sm"
                      >
                        Mark Mediated
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                      ✓ Resolution: {comp.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: MULTI-SOCIETY ARCHITECTURE & EXPANSION */}
        {/* ============================================================== */}
        {activeTab === 'societies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Multi-Society Scaling Network</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Expand from Greenfield Heights (1,790 flats pilot) to adjacent communities and cities.
                </p>
              </div>
              <button 
                onClick={() => setShowAddSocietyModal(true)} 
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} /> Onboard New Society
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {societies.map(soc => (
                <div key={soc.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                        Active Network Node
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px' }}>{soc.name}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{soc.addressLine}, {soc.city}</div>
                    </div>
                  </div>

                  <div style={{ margin: '14px 0', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Total Flats:</span>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{soc.totalFlats.toLocaleString()}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Providers Serving:</span>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {providers.filter(p => p.supportedSocieties.includes(soc.id)).length}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pincode: {soc.pincode}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: NOTICES & ANNOUNCEMENTS */}
        {/* ============================================================== */}
        {activeTab === 'notices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '24px', alignItems: 'start' }}>

              {/* Notices List (Left) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Notices</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notices.filter(n => n.isActive).length} active / {notices.length} total</span>
                </div>

                {notices.length === 0 && (
                  <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <Megaphone size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p>No notices posted yet. Use the form to post your first society notice.</p>
                  </div>
                )}

                {notices.map(notice => (
                  <div
                    key={notice.id}
                    className="card"
                    style={{
                      borderLeft: `3px solid ${notice.priority === 'URGENT' ? 'var(--accent-rose)' : notice.type === 'MAINTENANCE' ? 'var(--accent-amber)' : 'var(--primary)'}`,
                      opacity: notice.isActive ? 1 : 0.45,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          {getNoticeTypeBadge(notice.type)}
                          {notice.priority === 'URGENT' && (
                            <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>URGENT</span>
                          )}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            📍 {notice.societyId === 'ALL' ? 'All Societies' : notice.societyName}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{notice.title}</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '8px' }}>{notice.content}</p>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                          <span>By: {notice.authorName}</span>
                          <span>{new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deactivateNotice(notice.id)}
                        title={notice.isActive ? 'Deactivate notice' : 'Already inactive'}
                        disabled={!notice.isActive}
                        style={{
                          flexShrink: 0,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          background: notice.isActive ? '#fff' : 'var(--bg-subtle)',
                          color: notice.isActive ? 'var(--accent-rose)' : 'var(--text-muted)',
                          cursor: notice.isActive ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        {notice.isActive ? <><EyeOff size={12} /> Deactivate</> : <><Eye size={12} /> Inactive</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Post New Notice Form (Right) */}
              <div className="card" style={{ position: 'sticky', top: '80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Megaphone size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>Post New Notice</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visible to residents of the selected society</div>
                  </div>
                </div>

                {noticeSuccess && (
                  <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <CheckCircle2 size={15} /> {noticeSuccess}
                  </div>
                )}

                <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="form-label">Target Society</label>
                    <select
                      value={noticeSocietyId}
                      onChange={(e) => setNoticeSocietyId(e.target.value)}
                      className="form-input"
                    >
                      <option value="ALL">📢 All Societies (Platform-wide)</option>
                      {societies.map(soc => (
                        <option key={soc.id} value={soc.id}>📍 {soc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label">Notice Type</label>
                      <select
                        value={noticeType}
                        onChange={(e) => setNoticeType(e.target.value as NoticeType)}
                        className="form-input"
                      >
                        <option value="ANNOUNCEMENT">📢 Announcement</option>
                        <option value="MAINTENANCE">🔧 Maintenance</option>
                        <option value="ALERT">🚨 Alert</option>
                        <option value="SERVICE_UPDATE">🔄 Service Update</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Priority</label>
                      <select
                        value={noticePriority}
                        onChange={(e) => setNoticePriority(e.target.value as 'NORMAL' | 'URGENT')}
                        className="form-input"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">🔴 Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Notice Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Water supply disruption on Saturday morning"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Notice Content</label>
                    <textarea
                      placeholder="Write your notice message here. Be clear and informative for residents..."
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      className="form-input"
                      rows={4}
                      style={{ resize: 'vertical', minHeight: '90px' }}
                      required
                    />
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <Bell size={13} style={{ flexShrink: 0, marginTop: '1px' }} color="var(--primary)" />
                    Notices appear as a banner on the Home tab for residents, filtered to their registered society.
                  </div>

                  <button type="submit" className="btn btn-primary btn-full">
                    <Megaphone size={15} /> Post Notice
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add Coupon Modal */}
      {showAddCouponModal && (
        <div className="modal-overlay" onClick={() => setShowAddCouponModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create New Society Coupon</h3>
              <button onClick={() => setShowAddCouponModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '6px' }}>
                Deploy Coupon to Platform
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Society Modal */}
      {showAddSocietyModal && (
        <div className="modal-overlay" onClick={() => setShowAddSocietyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Onboard New Residential Society</h3>
              <button onClick={() => setShowAddSocietyModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateSocietySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '6px' }}>
                Add Society to Multi-Society Network
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
