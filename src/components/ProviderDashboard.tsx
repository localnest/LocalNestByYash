'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { Service, PricingModel, OrderStatus } from '@/lib/types';
import { 
  DollarSign, PackageCheck, Repeat, Star, 
  Calendar, Check, X, Plus, Clock, 
  MapPin, CheckCircle, ShieldCheck, AlertCircle 
} from 'lucide-react';

export default function ProviderDashboard() {
  const { 
    providers, 
    activeProviderId, 
    orders, 
    services, 
    subscriptions, 
    commissionRules,
    updateOrderStatus, 
    addService,
    selectedSociety 
  } = useMarketplace();

  // Find active provider
  const provider = providers.find(p => p.id === activeProviderId) || providers[0];

  // Active Provider's orders & subscriptions
  const providerOrders = orders.filter(o => o.providerId === provider.id);
  const providerSubscriptions = subscriptions.filter(s => s.providerId === provider.id);
  const providerServices = services.filter(s => s.providerId === provider.id);

  // Financial aggregates
  const completedOrders = providerOrders.filter(o => o.status === 'COMPLETED');
  const totalGrossEarnings = completedOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalCommissionPaid = completedOrders.reduce((acc, o) => acc + o.platformCommission, 0);
  const netEarnings = completedOrders.reduce((acc, o) => acc + o.providerEarnings, 0);

  // Tab State: 'overview' | 'orders' | 'subscriptions' | 'services' | 'earnings'
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'subscriptions' | 'services' | 'earnings'>('overview');

  // New Service Modal State
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');
  const [newPricingModel, setNewPricingModel] = useState<PricingModel>('FIXED');
  const [newBasePrice, setNewBasePrice] = useState<number>(350);
  const [newUnitName, setNewUnitName] = useState<string>('per service');
  const [isSubscriptionSupported, setIsSubscriptionSupported] = useState<boolean>(false);

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

  return (
    <div style={{ paddingBottom: '60px' }}>
      
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{provider.businessName}</h1>
                <span className={`badge ${provider.status === 'VERIFIED' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                  {provider.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span>{provider.categoryName}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={13} color="var(--primary)" />
                  Serving {selectedSociety.name}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'orders', label: `Orders (${providerOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length} active)` },
              { id: 'subscriptions', label: `Recurring Subscriptions (${providerSubscriptions.length})` },
              { id: 'services', label: `My Services (${providerServices.length})` },
              { id: 'earnings', label: 'Earnings & Commission' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px', fontSize: '0.8rem' }}
                >
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
            
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>NET PAYOUT EARNINGS</span>
                  <DollarSign size={18} color="var(--accent-emerald)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-emerald)' }}>
                  ₹{netEarnings.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Gross GMV: ₹{totalGrossEarnings.toFixed(2)} • Take-rate: 10%
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
                  Monthly Recurring Revenue: ₹{providerSubscriptions.reduce((acc, s) => acc + s.monthlyPrice, 0).toLocaleString()}
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>SOCIETY REPUTATION</span>
                  <Star size={18} color="#f59e0b" fill="#f59e0b" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
                  {provider.rating > 0 ? `${provider.rating} / 5.0` : 'New'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Based on {provider.reviewCount} verified resident reviews
                </div>
              </div>
            </div>

            {/* Quick Pending Requests Alert */}
            {providerOrders.filter(o => o.status === 'PENDING').length > 0 && (
              <div style={{ background: 'var(--accent-amber-light)', border: '1px solid var(--accent-amber)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={22} color="var(--accent-amber)" />
                  <div>
                    <strong>You have {providerOrders.filter(o => o.status === 'PENDING').length} new booking request(s) awaiting your action!</strong>
                    <div style={{ fontSize: '0.8rem', color: '#78350f' }}>Please accept or schedule promptly to maintain your high reliability score.</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('orders')} className="btn btn-dark btn-sm">
                  View Requests
                </button>
              </div>
            )}

            {/* Upcoming Schedule Today */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
                Today's Fulfillment Schedule in {selectedSociety.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {providerOrders.filter(o => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS').map(order => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.customerName} ({order.customerFlat})</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Slot: {order.scheduledSlot} • Service: {order.serviceName}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {order.status === 'SCHEDULED' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                          className="btn btn-secondary btn-sm"
                        >
                          Start Service
                        </button>
                      )}
                      {order.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                          className="btn btn-primary btn-sm"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {providerOrders.filter(o => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS').length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '0.85rem' }}>
                    No pending orders scheduled for today. New requests will appear here immediately.
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
                  Accept incoming requests, manage scheduling, and mark completed jobs.
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
                        <span className="badge badge-blue">{order.status.replace('_', ' ')}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                        Customer: <strong>{order.customerName}</strong> ({order.customerFlat}) • Phone: {order.customerPhone}
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
                        Your Net Payout: ₹{order.providerEarnings}
                      </span>
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <div style={{ margin: '10px 0', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Resident Note:</strong> "{order.specialInstructions}"
                    </div>
                  )}

                  {/* Provider Order Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '10px' }}>
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--accent-rose)' }}
                        >
                          <X size={14} /> Reject Request
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
                Society residents subscribed to your recurring delivery or maintenance plans.
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
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                      Mark Delivered for Today
                    </button>
                  </div>
                </div>
              ))}
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
        {/* EARNINGS & COMMISSION LEDGER */}
        {/* ============================================================== */}
        {activeTab === 'earnings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Financial Ledger & Platform Commission</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Transparent transaction records with breakdown of Gross Amount, Platform Commission %, and Net Bank Transfer.
              </p>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Order #</th>
                    <th style={{ padding: '12px 16px' }}>Resident Flat</th>
                    <th style={{ padding: '12px 16px' }}>Gross GMV</th>
                    <th style={{ padding: '12px 16px' }}>Platform Take Rate</th>
                    <th style={{ padding: '12px 16px' }}>Net Provider Payout</th>
                    <th style={{ padding: '12px 16px' }}>Payout Status</th>
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
                          Settled to Bank
                        </span>
                      </td>
                    </tr>
                  ))}
                  {completedOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No completed orders yet. Completed orders will appear in your payout ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="modal-overlay" onClick={() => setShowAddServiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New Service Offering</h3>
              <button onClick={() => setShowAddServiceModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

    </div>
  );
}
