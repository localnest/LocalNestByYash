'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { PricingModel, CoverageMode } from '@/lib/types';
import { BENGALURU_LOCALITIES, calculateHaversineDistance } from '@/lib/geo';
import { 
  Wrench, Building, ShieldCheck, DollarSign, 
  Clock, ArrowRight, ArrowLeft, CheckCircle2, FileText, 
  MapPin, AlertCircle, Percent, Sliders, Car, Navigation
} from 'lucide-react';

export default function ProviderOnboarding() {
  const { currentUser, categories, societies, completeProviderOnboarding, logout } = useMarketplace();

  // 3-step onboarding: 1=Profile, 2=Service Area & Travel, 3=Terms
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Business Profile & Primary Service
  const [businessName, setBusinessName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0].id);
  const [phone, setPhone] = useState<string>(currentUser?.phone || '');
  const [description, setDescription] = useState<string>('');
  const [serviceTitle, setServiceTitle] = useState<string>('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('FIXED');
  const [basePrice, setBasePrice] = useState<number>(300);
  const [unitName, setUnitName] = useState<string>('per service');
  const [documentType, setDocumentType] = useState<string>('Aadhaar / National ID');
  const [documentName, setDocumentName] = useState<string>('aadhaar_card_doc.pdf');

  // Step 2: Coverage & Location
  const [selectedLocalityIdx, setSelectedLocalityIdx] = useState<number>(0);
  const [coverageMode, setCoverageMode] = useState<CoverageMode>('RADIUS');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(8);
  const [excludedSocietyIds, setExcludedSocietyIds] = useState<string[]>([]);
  const [manualSocieties, setManualSocieties] = useState<string[]>([societies[0]?.id || 'soc-1']);
  const [maxOrdersPerDay, setMaxOrdersPerDay] = useState<number>(8);

  // Travel charges
  const [enableTravelCharge, setEnableTravelCharge] = useState<boolean>(false);
  const [freeRadiusKm, setFreeRadiusKm] = useState<number>(3);
  const [chargePerKm, setChargePerKm] = useState<number>(15);
  const [maxCharge, setMaxCharge] = useState<number>(150);

  // Step 3: Terms
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  // Current base location
  const currentLocality = BENGALURU_LOCALITIES[selectedLocalityIdx] || BENGALURU_LOCALITIES[0];

  // Calculate live coverage for RADIUS mode
  const societiesWithDistance = societies.map(soc => {
    const distance = calculateHaversineDistance(
      currentLocality.latitude,
      currentLocality.longitude,
      soc.latitude,
      soc.longitude
    );
    const inRange = distance <= maxDistanceKm;
    const isExcluded = excludedSocietyIds.includes(soc.id);
    return {
      society: soc,
      distance,
      inRange,
      isExcluded,
      isCovered: inRange && !isExcluded
    };
  });

  const toggleExcludeSociety = (socId: string) => {
    setExcludedSocietyIds(prev => 
      prev.includes(socId) ? prev.filter(id => id !== socId) : [...prev, socId]
    );
  };

  const toggleManualSociety = (socId: string) => {
    setManualSocieties(prev =>
      prev.includes(socId)
        ? (prev.length > 1 ? prev.filter(id => id !== socId) : prev)
        : [...prev, socId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!businessName.trim() || !serviceTitle.trim()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      // Calculate supported societies based on mode
      const derivedSupported = coverageMode === 'RADIUS'
        ? societiesWithDistance.filter(s => s.isCovered).map(s => s.society.id)
        : manualSocieties;

      completeProviderOnboarding({
        businessName,
        categoryId,
        phone,
        supportedSocieties: derivedSupported.length > 0 ? derivedSupported : [societies[0].id],
        description,
        serviceTitle,
        pricingModel,
        basePrice: Number(basePrice),
        unitName,
        documentType,
        documentName,
        acceptedTerms,
        baseLocation: {
          label: currentLocality.label,
          pincode: currentLocality.pincode,
          latitude: currentLocality.latitude,
          longitude: currentLocality.longitude
        },
        maxServiceDistanceKm: Number(maxDistanceKm),
        coverageMode,
        excludedSocietyIds,
        maxOrdersPerDay: maxOrdersPerDay > 0 ? Number(maxOrdersPerDay) : undefined,
        freeServiceRadiusKm: enableTravelCharge ? Number(freeRadiusKm) : undefined,
        travelChargePerKm: enableTravelCharge ? Number(chargePerKm) : undefined,
        maxTravelCharge: enableTravelCharge ? Number(maxCharge) : undefined,
      });
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div className="card" style={{ maxWidth: 'min(680px, 95vw)', width: '100%', padding: '24px 18px', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.15)', background: '#fff', boxSizing: 'border-box' }}>
        
        {/* Step Indicator Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', gap: '8px' }}>
          <div>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              Step {step} of 3 • Provider Registration
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
              {step === 1 && 'Register Your Business & Services'}
              {step === 2 && 'Service Area, Radius & Travel Charges'}
              {step === 3 && 'Platform Partnership Terms & Guidelines'}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={logout}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline', minHeight: '36px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Cancel & Sign Out
          </button>
        </div>

        {/* STEP 1: BUSINESS PROFILE & SERVICE OFFERING */}
        {step === 1 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Join our network of verified local service professionals serving residential societies:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Business / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sparkle Laundry & Cleaners"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Primary Service Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="form-input"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Contact Phone (For orders & alerts)</label>
                <input
                  type="tel"
                  placeholder="+91 98111 22334"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">ID / Document Proof</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="form-input"
                >
                  <option value="Aadhaar / National ID">Aadhaar / National ID</option>
                  <option value="Trade License">Trade License / GSTIN</option>
                  <option value="FSSAI Food License">FSSAI Food License (For Tiffins)</option>
                  <option value="Society Vendor Gate Pass">Society Vendor Gate Pass</option>
                </select>
              </div>
            </div>

            {/* Initial Service Offering */}
            <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
                Your Primary Service Offering:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label className="form-label">Service Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 24-hr Doorstep Steam Press & Wash"
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Pricing Model</label>
                  <select
                    value={pricingModel}
                    onChange={(e) => setPricingModel(e.target.value as PricingModel)}
                    className="form-input"
                  >
                    <option value="FIXED">Fixed (e.g. ₹499/flat)</option>
                    <option value="HOURLY">Hourly (e.g. ₹300/hr)</option>
                    <option value="PER_ITEM">Per Item (e.g. ₹40/pc)</option>
                    <option value="SUBSCRIPTION">Monthly (e.g. ₹3,000/mo)</option>
                    <option value="INSPECTION_VARIABLE">Inspection (e.g. ₹299)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label className="form-label">Base Price (₹)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Unit Description</label>
                  <input
                    type="text"
                    placeholder="per piece, per month, per visit"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Business Description / Experience</label>
              <textarea
                rows={2}
                placeholder="Years of experience, specializations, hygienic equipment used..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '8px' }}>
              Configure Service Area & Distance <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: SERVICE AREA & MAX DISTANCE (NEW) */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Set your operating base location, travel radius, and daily capacity so residents only see services you can reliably deliver.
            </p>

            {/* Base Location Picker */}
            <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Navigation size={15} color="var(--primary)" /> Base Operating Locality / Hub:
              </label>
              <select
                value={selectedLocalityIdx}
                onChange={(e) => setSelectedLocalityIdx(Number(e.target.value))}
                className="form-input"
              >
                {BENGALURU_LOCALITIES.map((loc, idx) => (
                  <option key={loc.label} value={idx}>
                    {loc.label} (PIN: {loc.pincode})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Coordinates: {currentLocality.latitude.toFixed(4)}° N, {currentLocality.longitude.toFixed(4)}° E
              </div>
            </div>

            {/* Coverage Mode Toggle */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCoverageMode('RADIUS')}
                className={`btn btn-sm ${coverageMode === 'RADIUS' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: '1 1 200px', padding: '10px 12px', minHeight: '44px' }}
              >
                <Sliders size={14} /> Distance Radius Mode (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setCoverageMode('SELECTED_SOCIETIES')}
                className={`btn btn-sm ${coverageMode === 'SELECTED_SOCIETIES' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: '1 1 200px', padding: '10px 12px', minHeight: '44px' }}
              >
                <Building size={14} /> Specific Societies Only
              </button>
            </div>

            {/* RADIUS MODE: Slider and live society preview */}
            {coverageMode === 'RADIUS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Max Travel Distance:</label>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {maxDistanceKm} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>1 km (Gated Society only)</span>
                    <span>10 km (Suburban Cluster)</span>
                    <span>25 km (City-wide)</span>
                  </div>
                </div>

                {/* Live Societies in Range */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Live Coverage Preview ({societiesWithDistance.filter(s => s.isCovered).length} societies covered):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {societiesWithDistance.map(({ society, distance, inRange, isExcluded }) => (
                      <div
                        key={society.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          background: inRange && !isExcluded ? '#f0fdf4' : '#f8fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {society.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {society.locality || society.city} • {distance} km away
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {inRange ? (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isExcluded}
                                onChange={() => toggleExcludeSociety(society.id)}
                              />
                              <span style={{ color: isExcluded ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                                {isExcluded ? 'Excluded' : 'Exclude'}
                              </span>
                            </label>
                          ) : (
                            <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>
                              Out of range
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SELECTED SOCIETIES MODE */}
            {coverageMode === 'SELECTED_SOCIETIES' && (
              <div>
                <label className="form-label">Check Societies You Can Serve:</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {societies.map(soc => {
                    const isChecked = manualSocieties.includes(soc.id);
                    return (
                      <button
                        key={soc.id}
                        type="button"
                        onClick={() => toggleManualSociety(soc.id)}
                        className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.78rem', borderRadius: '20px' }}
                      >
                        <MapPin size={12} />
                        {soc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Order Cap */}
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Daily Order Booking Limit</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Locks calendar dates when you reach capacity to prevent overbooking.
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxOrdersPerDay}
                  onChange={(e) => setMaxOrdersPerDay(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '80px', padding: '6px' }}
                />
              </div>
            </div>

            {/* Optional Travel Charges */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={enableTravelCharge}
                  onChange={(e) => setEnableTravelCharge(e.target.checked)}
                />
                <span>Enable Travel & Fuel Surcharge for Outlying Clusters</span>
              </label>

              {enableTravelCharge && (
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                  <div>
                    <label className="form-label">Free Radius (km)</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={freeRadiusKm}
                      onChange={(e) => setFreeRadiusKm(Number(e.target.value))}
                      className="form-input"
                    />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>₹0 within this radius</div>
                  </div>
                  <div>
                    <label className="form-label">Rate / km (₹)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={chargePerKm}
                      onChange={(e) => setChargePerKm(Number(e.target.value))}
                      className="form-input"
                    />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>charged past free radius</div>
                  </div>
                  <div>
                    <label className="form-label">Max Cap (₹)</label>
                    <input
                      type="number"
                      min="20"
                      max="500"
                      value={maxCharge}
                      onChange={(e) => setMaxCharge(Number(e.target.value))}
                      className="form-input"
                    />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>maximum surcharge limit</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                Review Partnership Terms <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PLATFORM TERMS & GUIDELINES */}
        {step === 3 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--primary-light)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-glow)' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary-hover)', fontSize: '0.95rem' }}>
                ✓ Application Ready for: {businessName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#115e59', marginTop: '2px' }}>
                Offering: {serviceTitle} (₹{basePrice} /{unitName}) • Base: {currentLocality.label} ({maxDistanceKm} km radius)
              </div>
            </div>

            {/* What Platform Provides to Provider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Percent size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Transparent 10% Platform Commission (0% for 60 Days!)</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Enjoy 0% promotional take-rate for your first 60 days. Standard 10% take-rate applies thereafter only on completed orders with zero listing charges.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Weekly Guaranteed Bank Payouts</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    All online payments collected from residents via Razorpay are settled directly to your verified bank account every Tuesday morning.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-amber-light)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Verification & Activation SLA</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    The Society Management Committee (MC) and operations desk reviews IDs within 24 business hours to issue your digital vendor gate entry clearance.
                  </p>
                </div>
              </div>
            </div>

            {/* Anti-Bypass Agreement Terms */}
            <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 'var(--radius-md)', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={18} color="#d97706" />
                <strong style={{ fontSize: '0.88rem', color: '#92400e' }}>LocalNest Society Trust & Anti-Bypass Agreement</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.45, marginBottom: '10px' }}>
                LocalNest guarantees payment protection and mediator arbitration only for transactions completed through the app. Requesting offline cash payment, sharing personal numbers, or soliciting off-platform service leads to immediate vendor badge suspension and society gate access revocation.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#92400e' }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#d97706' }}
                  required
                />
                <span>I understand and agree to transacting solely via LocalNest, honouring my service area commitment, and adhering to resident security rules.</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                disabled={!acceptedTerms}
                className="btn btn-primary"
                style={{ 
                  flex: 2, 
                  opacity: acceptedTerms ? 1 : 0.6,
                  cursor: acceptedTerms ? 'pointer' : 'not-allowed'
                }}
              >
                <CheckCircle2 size={16} /> Submit Application for Verification
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
