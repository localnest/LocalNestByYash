'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { PricingModel } from '@/lib/types';
import { 
  Wrench, Building, ShieldCheck, DollarSign, 
  Clock, ArrowRight, CheckCircle2, FileText, 
  MapPin, AlertCircle, Percent 
} from 'lucide-react';

export default function ProviderOnboarding() {
  const { currentUser, categories, societies, completeProviderOnboarding, logout } = useMarketplace();

  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields Taken from Provider
  const [businessName, setBusinessName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0].id);
  const [phone, setPhone] = useState<string>(currentUser?.phone || '');
  const [description, setDescription] = useState<string>('');
  const [supportedSocieties, setSupportedSocieties] = useState<string[]>([societies[0].id]);
  
  // Initial Service Offering
  const [serviceTitle, setServiceTitle] = useState<string>('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('FIXED');
  const [basePrice, setBasePrice] = useState<number>(300);
  const [unitName, setUnitName] = useState<string>('per service');

  const [documentType, setDocumentType] = useState<string>('Aadhaar / National ID');
  const [documentName, setDocumentName] = useState<string>('aadhaar_card_doc.pdf');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const toggleSociety = (socId: string) => {
    if (supportedSocieties.includes(socId)) {
      if (supportedSocieties.length > 1) {
        setSupportedSocieties(supportedSocieties.filter(id => id !== socId));
      }
    } else {
      setSupportedSocieties([...supportedSocieties, socId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!businessName.trim() || !serviceTitle.trim()) return;
      setStep(2);
    } else {
      completeProviderOnboarding({
        businessName,
        categoryId,
        phone,
        supportedSocieties,
        description,
        serviceTitle,
        pricingModel,
        basePrice: Number(basePrice),
        unitName,
        documentType,
        documentName,
        acceptedTerms,
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
      <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '32px', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.15)', background: '#fff' }}>
        
        {/* Step Indicator Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
          <div>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              Step {step} of 2 • Provider Registration
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '4px' }}>
              {step === 1 ? 'Register Your Business & Services' : 'Platform Partnership Terms & Guidelines'}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={logout}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
          >
            Cancel & Sign Out
          </button>
        </div>

        {/* STEP 1: INFORMATION TAKEN FROM PROVIDER */}
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

            {/* Supported Societies */}
            <div>
              <label className="form-label">Select Societies You Can Serve:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {societies.map(soc => {
                  const isChecked = supportedSocieties.includes(soc.id);
                  return (
                    <button
                      key={soc.id}
                      type="button"
                      onClick={() => toggleSociety(soc.id)}
                      className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', borderRadius: '20px' }}
                    >
                      <MapPin size={12} />
                      {soc.name} ({soc.totalFlats.toLocaleString()} flats)
                    </button>
                  );
                })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
              Review Partnership Terms & Complete <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: INFORMATION PROVIDED BY US TO PROVIDER */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--primary-light)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-glow)' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary-hover)', fontSize: '0.95rem' }}>
                ✓ Application Ready for: {businessName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#115e59', marginTop: '2px' }}>
                Offering: {serviceTitle} (₹{basePrice} /{unitName}) in {supportedSocieties.length} societies
              </div>
            </div>

            {/* What Platform Provides to Provider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Percent size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Transparent 10% Platform Commission</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    No upfront listing fees, no lead generation subscription charges. You only pay 10% commission when a society resident pays and completes an order.
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
                    Our on-site society operations team inspects your ID documents within 2-4 hours. While verification is in progress (<code>PENDING</code>), you can configure services and slots.
                  </p>
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '6px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span>
                I agree to the <strong>Platform Partnership Terms</strong>: (1) 10% commission with 0% for the first 60 days; (2) all resident payments collected exclusively through LocalNest — off-platform payments are grounds for immediate suspension; (3) customer contact details are masked and must not be requested via chat; (4) society gate rules and service quality standards apply.
              </span>
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!acceptedTerms}
                className="btn btn-primary btn-lg"
                style={{ flex: 2 }}
              >
                Launch Provider Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
