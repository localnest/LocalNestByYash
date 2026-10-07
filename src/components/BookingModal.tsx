'use client';

import React, { useState, useMemo } from 'react';
import { useMarketplace } from '@/lib/store';
import { Service, Provider, PricingModel } from '@/lib/types';
import { PLATFORM_CONFIG } from '@/lib/config';
import { isSocietyCovered, calculateTravelCharge } from '@/lib/geo';
import { 
  X, CheckCircle, ShieldCheck, Tag, 
  Calendar, Clock, CreditCard, AlertCircle, ArrowRight, Wallet 
} from 'lucide-react';

interface BookingModalProps {
  service: Service;
  provider: Provider;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

export default function BookingModal({ service, provider, onClose, onSuccess }: BookingModalProps) {
  const { createOrder, validateCoupon, selectedSociety, coupons, currentUser, getWalletBalance, platformFeeRules, orders, t } = useMarketplace();
  const [useWallet, setUseWallet] = useState<boolean>(false);
  const [showAllCoupons, setShowAllCoupons] = useState<boolean>(false);

  // Booking Parameters
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduledSlot, setScheduledSlot] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Tower A - 402, ' + selectedSociety.name);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Dynamic Pricing State
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [hours, setHours] = useState<number>(1);
  // For per-item services: map item name to qty
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(() => {
    if (service.pricingModel === 'PER_ITEM' && service.pricingItems) {
      const init: Record<string, number> = {};
      service.pricingItems.forEach(item => {
        init[item.name] = 0;
      });
      // set first item to 2
      if (service.pricingItems.length > 0) {
        init[service.pricingItems[0].name] = 2;
      }
      return init;
    }
    return {};
  });

  // Subscription frequency
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<'DAILY' | 'MON_TO_SAT' | 'WEEKLY'>('MON_TO_SAT');

  // Coupon Engine
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{ valid: boolean; message: string; discount: number } | null>(null);

  // Razorpay Checkout Simulation Step
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Calculate Subtotal dynamically based on model
  const calculateSubtotal = (): number => {
    switch (service.pricingModel) {
      case 'FIXED':
        return service.basePrice * Math.max(1, itemQuantity);
      case 'HOURLY':
        return service.basePrice * Math.max(1, hours);
      case 'PER_ITEM': {
        if (!service.pricingItems) return service.basePrice * itemQuantity;
        let sum = 0;
        service.pricingItems.forEach(item => {
          sum += (itemQuantities[item.name] || 0) * item.price;
        });
        return Math.max(sum, service.basePrice);
      }
      case 'SUBSCRIPTION':
        return service.basePrice;
      case 'INSPECTION_VARIABLE':
        return service.basePrice; // ₹299 inspection
      case 'CUSTOM_QUOTATION':
        return 0; // Free visit
      default:
        return service.basePrice;
    }
  };

  const subtotal = calculateSubtotal();
  const platformFee = service.pricingModel === 'SUBSCRIPTION'
    ? (platformFeeRules?.subscriptionFee ?? 10)
    : (platformFeeRules?.oneTimeFee ?? 20);

  // Coverage check
  const isCovered = isSocietyCovered(provider, selectedSociety);

  // Travel charge calculation
  const travelCharge = calculateTravelCharge(provider, selectedSociety);

  // Capacity check
  const providerOrdersOnDate = orders.filter(
    o => o.providerId === provider.id &&
         o.scheduledDate === scheduledDate &&
         !['CANCELLED', 'REJECTED'].includes(o.status)
  );
  const isAtDailyCap = Boolean(provider.maxOrdersPerDay && providerOrdersOnDate.length >= provider.maxOrdersPerDay);

  // ── Smart Slot Logic ─────────────────────────────────────────────────────
  const ALL_SLOTS = [
    { label: '07:00 – 09:00 AM', tag: 'Early Bird',  startH: 7 },
    { label: '09:00 – 11:00 AM', tag: 'Morning',     startH: 9 },
    { label: '11:00 AM – 01:00 PM', tag: 'Late Morning', startH: 11 },
    { label: '01:00 – 03:00 PM', tag: 'Afternoon',   startH: 13 },
    { label: '03:00 – 05:00 PM', tag: 'Mid Afternoon', startH: 15 },
    { label: '05:00 – 07:00 PM', tag: 'Evening',     startH: 17 },
  ];

  const parseHour = (timeStr: string): number => {
    // e.g. '08:00 AM' => 8, '08:00 PM' => 20
    if (!timeStr) return 0;
    const [hm, period] = timeStr.split(' ');
    let h = parseInt(hm.split(':')[0], 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
  };

  const selectedDayName = useMemo(() => 
    new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
  [scheduledDate]);

  const isOffDay = Boolean(provider.workingHours?.daysOff?.includes(selectedDayName));

  const openH = parseHour(provider.workingHours?.start || '08:00 AM');
  const closeH = parseHour(provider.workingHours?.end || '08:00 PM');

  const availableSlots = useMemo(() => 
    ALL_SLOTS.filter(s => s.startH >= openH && s.startH + 2 <= closeH),
  [openH, closeH]);

  // Count existing bookings per slot on selected date
  const slotBookingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.providerId === provider.id && o.scheduledDate === scheduledDate && !['CANCELLED','REJECTED'].includes(o.status)) {
        counts[o.scheduledSlot] = (counts[o.scheduledSlot] || 0) + 1;
      }
    });
    return counts;
  }, [orders, provider.id, scheduledDate]);

  // Max bookings per slot: daily cap divided evenly across slots (min 1)
  const slotsCount = Math.max(availableSlots.length, 1);
  const perSlotCap = provider.maxOrdersPerDay ? Math.max(1, Math.ceil(provider.maxOrdersPerDay / slotsCount)) : 99;

  const isSlotFull = (slotLabel: string) => (slotBookingCounts[slotLabel] || 0) >= perSlotCap;

  // Auto-select first open slot when date or available slots change
  React.useEffect(() => {
    if (!scheduledSlot || !availableSlots.find(s => s.label === scheduledSlot && !isSlotFull(s.label))) {
      const firstOpen = availableSlots.find(s => !isSlotFull(s.label));
      setScheduledSlot(firstOpen?.label || (availableSlots[0]?.label ?? ''));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledDate, availableSlots.length]);

  const isSlotBooked = scheduledSlot ? isSlotFull(scheduledSlot) : false;

  // Live discount
  const discountAmount = couponFeedback?.valid ? couponFeedback.discount : 0;

  // Wallet redemption (capped at 20% of subtotal)
  const userWalletBalance = currentUser ? getWalletBalance(currentUser.id) : 0;
  const maxWalletRedemption = Math.min(
    userWalletBalance,
    Math.floor(subtotal * PLATFORM_CONFIG.LOYALTY_REDEMPTION_CAP_RATIO)
  );
  const walletDiscount = useWallet ? maxWalletRedemption : 0;
  // Total payable includes travel charge
  const totalPayable = Math.max(0, subtotal + platformFee + travelCharge - discountAmount - walletDiscount);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = codeToApply || couponCodeInput;
    if (!code.trim()) return;
    const res = validateCoupon(code, subtotal, service.categoryId);
    setCouponFeedback(res);
    if (res.valid) {
      setAppliedCoupon(code.toUpperCase());
    } else {
      setAppliedCoupon(null);
    }
  };

  const handleProcessOrder = () => {
    setIsProcessingPayment(true);

    // Simulate Razorpay Gateway Interaction
    setTimeout(() => {
      const isSub = service.pricingModel === 'SUBSCRIPTION';
      const totalItemsCount = service.pricingModel === 'PER_ITEM' 
        ? Object.values(itemQuantities).reduce((a, b) => a + b, 0) || 1
        : itemQuantity;

      const res = createOrder({
        serviceId: service.id,
        scheduledDate,
        scheduledSlot,
        deliveryAddress,
        specialInstructions,
        pricingModel: service.pricingModel,
        itemQuantity: totalItemsCount,
        subtotal,
        couponCode: appliedCoupon || undefined,
        walletAmountToUse: walletDiscount,
        travelCharge: travelCharge > 0 ? travelCharge : undefined,
        isSubscription: isSub,
        subscriptionFrequency,
      });

      setIsProcessingPayment(false);
      if (res.success && res.orderNumber) {
        setPaymentSuccess(true);
        setTimeout(() => {
          onSuccess(res.orderNumber!);
        }, 1200);
      }
    }, 1000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                {service.pricingModel.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Provided by {provider.businessName}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', marginTop: '4px' }}>
              {service.name}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {paymentSuccess ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'var(--accent-emerald-light)', 
              color: 'var(--accent-emerald)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle size={36} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Payment Confirmed!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Razorpay transaction successful. Your service request has been transmitted directly to {provider.businessName}.
            </p>
            <div className="skeleton" style={{ height: '4px', width: '60%', margin: '0 auto' }}></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Feature 13: Provider Vacation Guard Banner */}
            {provider.isVacationMode && (
              <div style={{ background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertCircle size={24} color="#b45309" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#92400e', fontSize: '0.9rem' }}>Provider is Currently on Leave / Vacation</strong>
                  <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '2px' }}>
                    "{provider.vacationReason || 'Taking a short break'}" — New bookings are temporarily paused.
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Pricing Selector */}
            <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              
              {/* FIXED MODEL */}
              {service.pricingModel === 'FIXED' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Service Base Price</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      ₹{service.basePrice}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ margin: 0 }}>Number of units / rooms:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        type="button"
                        onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '32px', height: '32px', padding: 0 }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{itemQuantity}</span>
                      <button 
                        type="button"
                        onClick={() => setItemQuantity(itemQuantity + 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '32px', height: '32px', padding: 0 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* HOURLY MODEL */}
              {service.pricingModel === 'HOURLY' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Diagnostic & Repair Rate</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{service.basePrice} for initial hour</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      ₹{service.basePrice * hours}
                    </span>
                  </div>
                  <label className="form-label">Estimated Service Duration:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHours(h)}
                        className={`btn btn-sm ${hours === h ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1 }}
                      >
                        {h} {h === 1 ? 'Hour' : 'Hours'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PER_ITEM MODEL (e.g. Laundry) */}
              {service.pricingModel === 'PER_ITEM' && service.pricingItems && (
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>
                    Select Garments / Items:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {service.pricingItems.map(item => {
                      const qty = itemQuantities[item.name] || 0;
                      return (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px 12px', borderRadius: '8px' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{item.price} / {item.unit}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setItemQuantities({ ...itemQuantities, [item.name]: Math.max(0, qty - 1) })}
                              className="btn btn-secondary btn-sm"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', fontSize: '0.85rem' }}>{qty}</span>
                            <button
                              type="button"
                              onClick={() => setItemQuantities({ ...itemQuantities, [item.name]: qty + 1 })}
                              className="btn btn-secondary btn-sm"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBSCRIPTION MODEL (Tiffin, Car wash) */}
              {service.pricingModel === 'SUBSCRIPTION' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Monthly Recurring Plan</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cancel or pause anytime with zero penalty</p>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
                      ₹{service.basePrice}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span>
                    </span>
                  </div>
                  <label className="form-label">Delivery Schedule:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSubscriptionFrequency('MON_TO_SAT')}
                      className={`btn btn-sm ${subscriptionFrequency === 'MON_TO_SAT' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                    >
                      Mon – Sat
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubscriptionFrequency('DAILY')}
                      className={`btn btn-sm ${subscriptionFrequency === 'DAILY' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                    >
                      All 7 Days
                    </button>
                  </div>
                </div>
              )}

              {/* INSPECTION VARIABLE (AC Repair) */}
              {service.pricingModel === 'INSPECTION_VARIABLE' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Inspection & Diagnosis Fee</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      ₹{service.basePrice}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    ✓ Fee covers 100% on-site leak testing, electrical probe, and indoor filter deep clean. Any replacement components or gas refill will be quoted with fixed society rates before beginning work.
                  </p>
                </div>
              )}

              {/* CUSTOM QUOTATION */}
              {service.pricingModel === 'CUSTOM_QUOTATION' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Doorstep Measurement Visit</span>
                    <span className="badge badge-emerald">FREE VISIT</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Provider visits your flat, inspects work requirements, and provides an itemized quotation before commencing work.
                  </p>
                </div>
              )}

            </div>

            {/* Date & Slot Picker */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Service Date
                  </label>
                  <input 
                    type="date" 
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="form-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                {/* Smart Slot Grid */}
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Available Slots
                    <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                      ({selectedDayName}{isOffDay ? ' — Off Day' : ''})
                    </span>
                  </label>

                  {isOffDay ? (
                    <div style={{ padding: '12px 14px', background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#92400e' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span><strong>{selectedDayName}</strong> is a scheduled off-day for {provider.businessName}. Please choose another date.</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      No slots available — provider working hours may not be set.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '8px' }}>
                      {availableSlots.map(slot => {
                        const full = isSlotFull(slot.label);
                        const selected = scheduledSlot === slot.label;
                        const bookingsInSlot = slotBookingCounts[slot.label] || 0;
                        return (
                          <button
                            key={slot.label}
                            type="button"
                            disabled={full}
                            onClick={() => !full && setScheduledSlot(slot.label)}
                            style={{
                              padding: '9px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: selected ? '2px solid var(--primary)' : '1.5px solid var(--border-light)',
                              background: full ? 'var(--bg-subtle)' : selected ? 'rgba(13,148,136,0.08)' : '#fff',
                              cursor: full ? 'not-allowed' : 'pointer',
                              opacity: full ? 0.55 : 1,
                              textAlign: 'left',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ fontSize: '0.78rem', fontWeight: selected ? 800 : 600, color: selected ? 'var(--primary)' : full ? 'var(--text-muted)' : 'var(--text-main)' }}>
                              {slot.label}
                            </div>
                            <div style={{ fontSize: '0.67rem', marginTop: '2px', color: full ? 'var(--accent-rose)' : 'var(--text-subtle)' }}>
                              {full ? '🔴 Fully Booked' : bookingsInSlot > 0 ? `${bookingsInSlot} booking${bookingsInSlot > 1 ? 's' : ''} · ${slot.tag}` : `Open · ${slot.tag}`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address & Instructions */}
            <div>
              <label className="form-label">Society Flat Address</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. Tower A - 402, Greenfield Heights"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Special Instructions (Optional)</label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Ring bell twice, clothes hanger preference..."
                className="form-input"
              />
            </div>

            {/* Feature 3: Interactive Coupon Picker Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                  <Tag size={14} /> Society Coupons & Offers
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllCoupons(!showAllCoupons)}
                  style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  {showAllCoupons ? 'Hide Coupons ▲' : `View All Coupons (${coupons.filter(c => c.isActive).length}) ▼`}
                </button>
              </div>

              {/* Coupon Input Bar */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter code (e.g. WELCOME100)"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="form-input"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponFeedback(null);
                      setCouponCodeInput('');
                    }}
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', color: 'var(--accent-rose)' }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Apply
                  </button>
                )}
              </div>

              {couponFeedback && (
                <div style={{ 
                  marginTop: '6px', 
                  fontSize: '0.8rem', 
                  color: couponFeedback.valid ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {couponFeedback.valid ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {couponFeedback.message}
                </div>
              )}

              {/* Interactive Coupon Picker Drawer */}
              {showAllCoupons && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  {coupons.filter(c => c.isActive).map(c => {
                    const isApplicable = subtotal >= c.minOrderValue;
                    const isCurrent = appliedCoupon === c.code;
                    return (
                      <div 
                        key={c.id} 
                        style={{ 
                          background: '#fff', 
                          border: `1.5px ${isCurrent ? 'solid var(--primary)' : 'dashed var(--border-light)'}`,
                          borderRadius: '8px', 
                          padding: '10px',
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: 'var(--primary)', letterSpacing: '0.04em', fontSize: '0.85rem' }}>{c.code}</strong>
                            <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                              {c.discountType === 'PERCENTAGE' || c.discountType === 'SUBSCRIPTION' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {c.description} • Min order: ₹{c.minOrderValue}
                          </div>
                        </div>

                        {isCurrent ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                            Applied ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!isApplicable}
                            onClick={() => {
                              setCouponCodeInput(c.code);
                              handleApplyCoupon(c.code);
                            }}
                            className={`btn btn-sm ${isApplicable ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          >
                            {isApplicable ? 'Apply' : `Add ₹${c.minOrderValue - subtotal} more`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wallet Credits Redemption */}
              {userWalletBalance > 0 && (
                <div style={{
                  padding: '10px 14px',
                  background: useWallet ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: useWallet ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-light)',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'var(--accent-emerald)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Wallet size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Loyalty Wallet Credits
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ₹{userWalletBalance} balance • Redeem up to ₹{maxWalletRedemption} (20%)
                      </div>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: maxWalletRedemption > 0 ? 'pointer' : 'not-allowed', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={useWallet}
                      disabled={maxWalletRedemption <= 0}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      style={{ accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                    />
                    {useWallet ? `Applied (-₹${maxWalletRedemption})` : 'Apply'}
                  </label>
                </div>
              )}

            {/* Order Price Breakdown (Transparent) */}
            <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hyperlocal Society Platform Fee</span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>
              {travelCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Travel & Distance Surcharge</span>
                  <span style={{ fontWeight: 600 }}>+₹{travelCharge.toFixed(2)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--accent-emerald)' }}>
                  <span>Discount ({appliedCoupon})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {walletDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--accent-emerald)' }}>
                  <span>Loyalty Wallet Credits</span>
                  <span>-₹{walletDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                <span>Total Payable</span>
                <span style={{ color: 'var(--primary)' }}>₹{totalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Button: Razorpay Checkout (Disabled if Provider on Vacation) */}
            <button
              type="button"
              disabled={isProcessingPayment || !isCovered || isAtDailyCap || isOffDay || isSlotBooked || provider.isVacationMode || !scheduledSlot || (service.pricingModel !== 'CUSTOM_QUOTATION' && subtotal <= 0)}
              onClick={handleProcessOrder}
              className="btn btn-primary btn-lg btn-full"
              style={{ 
                marginTop: '8px',
                opacity: provider.isVacationMode ? 0.6 : 1,
                cursor: provider.isVacationMode ? 'not-allowed' : 'pointer'
              }}
            >
              {provider.isVacationMode ? (
                t.onVacation
              ) : isProcessingPayment ? (
                <>
                  <div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '50%' }}></div>
                  Opening Secure Razorpay Gateway...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay ₹{totalPayable.toFixed(2)} & {t.confirm}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              Protected by Razorpay & LocalNest Hyperlocal Trust Guarantee
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
