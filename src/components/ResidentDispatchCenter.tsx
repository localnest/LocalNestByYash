'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Home,
  Layers,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { useMarketplace } from '@/lib/store';
import {
  anonymizeFeedbackComment,
  calculateTickWhatYouWantPricing,
  computeAnonymousPoolStats,
} from '@/lib/dispatchUtils';
import type { JobRequest, RecurringSchedule } from '@/lib/types';

function localDate(daysAhead = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDaysLocal(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function displayProviderName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || 'Verified provider';
  return `${parts[0]} ${parts[1][0]}.`;
}

export default function ResidentDispatchCenter() {
  const {
    currentUser,
    users,
    selectedSociety,
    categories,
    providers,
    orders,
    reviews,
    serviceTypes,
    t,
    jobRequests,
    recurringSchedules,
    societies,
    platformFeeRules,
    createJobRequest,
    createRecurringSchedule,
    dispatchRecurringScheduleOccurrence,
    updateRecurringSchedule,
    cancelJobRequest,
    cancelClaimedJobByResident,
    expireJobRequest,
    updateResidentPreferences,
    createComplaint,
    submitReview,
    providerMemberships,
    dispatchTimeoutMinutes,
    getWalletBalance,
    createLeadRequest,
    leadQuotes,
    acceptLeadQuote,
    tiffinMenus,
    orderTiffinMenu,
  } = useMarketplace();
  const [mode, setMode] = useState<'book' | 'requests' | 'recurring' | 'preferences'>('book');
  const [categoryId, setCategoryId] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [sizeBand, setSizeBand] = useState('');
  const [scheduledDate, setScheduledDate] = useState(localDate());
  const [scheduledSlot, setScheduledSlot] = useState('09:00 - 11:00');
  const [dishNotes, setDishNotes] = useState('');
  const [kitchenReady, setKitchenReady] = useState(false);
  const [stylistGender, setStylistGender] = useState<'ANY' | 'FEMALE' | 'MALE'>('ANY');
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringSchedule['frequency']>('WEEKLY');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [allergiesText, setAllergiesText] = useState(
    currentUser?.preferences?.allergies?.join(', ') || '',
  );
  const [houseNotes, setHouseNotes] = useState(currentUser?.preferences?.houseNotes || '');
  const [pets, setPets] = useState(currentUser?.preferences?.pets || '');
  const [diet, setDiet] = useState(currentUser?.preferences?.diet || 'VEG');
  const [noOnionGarlic, setNoOnionGarlic] = useState(
    Boolean(currentUser?.preferences?.noOnionGarlic),
  );
  const [leadNotes, setLeadNotes] = useState('');
  const [menuQuantities, setMenuQuantities] = useState<Record<string, number>>({});
  const [subscribeToTiffin, setSubscribeToTiffin] = useState(false);
  const [tiffinFrequency, setTiffinFrequency] = useState<RecurringSchedule['frequency']>('WEEKLY');

  const availableCategories = categories
    .filter((category) => category.isActive !== false)
    .filter((category) =>
      serviceTypes.some((service) => service.categoryId === category.id && service.isActive),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const serviceOptions = serviceTypes.filter(
    (service) => service.categoryId === categoryId && service.isActive,
  );
  const selectedService = serviceTypes.find((service) => service.id === serviceTypeId);
  const pricing = useMemo(
    () =>
      selectedService
        ? calculateTickWhatYouWantPricing(selectedService, selectedTasks, sizeBand, dishNotes)
        : { subtotal: 0, durationMinutes: 0, taskBreakdown: [] },
    [selectedService, selectedTasks, sizeBand, dishNotes],
  );
  const residentJobs = jobRequests.filter((job) => job.residentId === currentUser?.id);
  const residentLeads = residentJobs.filter((job) => job.requestType === 'LEAD');
  const activeSchedules = recurringSchedules.filter(
    (schedule) => schedule.residentId === currentUser?.id && schedule.status !== 'CANCELLED',
  );

  // Stable time state updated by effect (avoids impure Date.now during render)
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!categoryId && availableCategories.length)
      setTimeout(() => setCategoryId(availableCategories[0].id), 0);
  }, [categoryId, availableCategories]);

  useEffect(() => {
    if (serviceOptions.length && !serviceOptions.some((service) => service.id === serviceTypeId)) {
      setTimeout(() => setServiceTypeId(serviceOptions[0].id), 0);
    }
  }, [serviceOptions, serviceTypeId]);

  useEffect(() => {
    const expireDueRequests = () => {
      residentJobs
        .filter((job) => job.status === 'OPEN' && Date.now() >= new Date(job.expiresAt).getTime())
        .forEach((job) => expireJobRequest(job.id));
    };
    expireDueRequests();
    const timer = window.setInterval(expireDueRequests, 15000);
    return () => window.clearInterval(timer);
  }, [residentJobs, expireJobRequest]);

  useEffect(() => {
    const dispatchDueSchedules = () => {
      const now = Date.now();
      activeSchedules
        .filter(
          (schedule) =>
            schedule.status === 'ACTIVE' &&
            new Date(`${schedule.nextDispatchDate}T00:00:00`).getTime() - now <= 8 * 60 * 60 * 1000,
        )
        .forEach((schedule) => {
          const result = dispatchRecurringScheduleOccurrence(schedule.id);
          if (!result.success && result.error) setError(result.error);
        });
    };
    dispatchDueSchedules();
    const timer = window.setInterval(dispatchDueSchedules, 60000);
    return () => window.clearInterval(timer);
  }, [activeSchedules, dispatchRecurringScheduleOccurrence]);

  const allCommitments = orders
    .filter((order) => !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(order.status))
    .map((order) => ({
      providerId: order.providerId,
      date: order.scheduledDate,
      slot: order.scheduledSlot,
      durationMinutes:
        jobRequests.find((job) => job.orderId === order.id)?.estimatedDurationMinutes || 60,
    }));
  const poolStats =
    selectedCategory && selectedService
      ? computeAnonymousPoolStats(
          providers,
          providerMemberships,
          selectedService.id,
          selectedCategory,
          selectedSociety,
          allCommitments,
          scheduledDate,
          scheduledSlot,
          societies,
          selectedTasks,
          pricing.durationMinutes,
          selectedService,
          reviews.filter((review) => {
            const reviewProvider = providers.find((provider) => provider.id === review.providerId);
            return reviewProvider?.enabledServiceTypeIds?.includes(selectedService.id);
          }),
        )
      : null;
  const isLeadRequest = selectedCategory?.matching === 'LEAD_QUOTE';
  const needsTask =
    !isLeadRequest &&
    selectedCategory?.matching !== 'BROWSE_ORDER' &&
    selectedService?.pricingModel === 'TICK_WHAT_YOU_WANT' &&
    selectedService.availableTasks.length > 0 &&
    selectedTasks.length === 0;
  const needsSizeBand = Boolean(selectedService?.sizeBands?.length && !sizeBand);
  const needsKitchenReadiness = selectedCategory?.id === 'cat-cook' && !kitchenReady;
  const canSubmitBooking =
    Boolean(selectedService && selectedCategory) &&
    (!isLeadRequest || leadNotes.trim().length > 0) &&
    !needsTask &&
    !needsSizeBand &&
    !needsKitchenReadiness;

  const toggleTask = (id: string) =>
    setSelectedTasks((current) =>
      current.includes(id) ? current.filter((taskId) => taskId !== id) : [...current, id],
    );

  const submitBooking = () => {
    setError('');
    setMessage('');
    if (!selectedService || !selectedCategory || !currentUser) return;
    if (selectedCategory.matching === 'LEAD_QUOTE') {
      const result = createLeadRequest({
        serviceTypeId: selectedService.id,
        scheduledDate,
        scheduledSlot,
        requestNotes: leadNotes,
      });
      if (!result.success) {
        setError(result.error || 'Could not send this project request.');
        return;
      }
      setLeadNotes('');
      setMessage(`Project request ${result.jobRequest?.jobNumber} is open for up to three quotes.`);
      setMode('requests');
      return;
    }
    const result = createJobRequest({
      serviceTypeId: selectedService.id,
      scheduledDate,
      scheduledSlot,
      selectedTaskIds: selectedTasks,
      sizeBandInput: sizeBand || undefined,
      dishNotes: dishNotes.trim() || undefined,
      kitchenReadinessConfirmed: kitchenReady,
      stylistGenderPreference: stylistGender,
      residentPreferences: currentUser.preferences,
    });
    if (!result.success || !result.jobRequest) {
      setError(result.error || 'The request could not be created.');
      return;
    }
    if (makeRecurring) {
      const schedule = createRecurringSchedule({
        residentId: currentUser.id,
        residentName: currentUser.fullName,
        societyId: selectedSociety.id,
        flatNumber: currentUser.flatNumber,
        serviceTypeId: selectedService.id,
        serviceTypeName: selectedService.name,
        categoryId: selectedCategory.id,
        frequency,
        preferredSlot: scheduledSlot,
        selectedTaskIds: selectedTasks,
        sizeBandInput: sizeBand || undefined,
        dishNotes: dishNotes.trim() || undefined,
        kitchenReadinessConfirmed: kitchenReady,
        stylistGenderPreference: stylistGender,
        residentPreferences: currentUser.preferences,
        lockedPricePerVisit: result.jobRequest.lockedSubtotal,
        providerPayoutPerVisit: result.jobRequest.providerPayout,
        status: 'ACTIVE',
        nextDispatchDate: scheduledDate,
      });
      const interval = frequency === 'ALTERNATE_DAYS' ? 2 : frequency === 'WEEKLY' ? 7 : 1;
      let nextDate = addDaysLocal(scheduledDate, interval);
      if (frequency === 'MON_TO_SAT' && new Date(`${nextDate}T12:00:00`).getDay() === 0) {
        nextDate = addDaysLocal(nextDate, 1);
      }
      updateRecurringSchedule(schedule.id, {
        historyJobIds: [result.jobRequest.id],
        lastDispatchedJobId: result.jobRequest.id,
        nextDispatchDate: nextDate,
      });
      setMakeRecurring(false);
    }
    setMessage(
      `Payment authorized in mock escrow. ${
        result.jobRequest.notifiedProviderIds.length
          ? `Request ${result.jobRequest.jobNumber} sent to ${result.jobRequest.notifiedProviderIds.length} eligible providers.`
          : 'No providers were free for that slot; choose another time or retry.'
      }`,
    );
    setMode('requests');
  };

  const buyMenu = (menuId: string) => {
    const quantity = Math.max(1, menuQuantities[menuId] || 1);
    const result = orderTiffinMenu(menuId, quantity);
    if (!result.success || !result.order) {
      setMessage(result.error || 'Menu could not be ordered.');
      return;
    }
    if (subscribeToTiffin && currentUser) {
      const menu = tiffinMenus.find((item) => item.id === menuId);
      const service = serviceTypes.find((item) => item.categoryId === 'cat-tiffin');
      if (!menu || !service) {
        setMessage(
          'Order confirmed, but the Tiffin subscription could not be created because its catalog entry is unavailable.',
        );
        return;
      }
      let nextDispatchDate = addDaysLocal(
        menu.deliveryDate,
        tiffinFrequency === 'ALTERNATE_DAYS' ? 2 : tiffinFrequency === 'WEEKLY' ? 7 : 1,
      );
      if (
        tiffinFrequency === 'MON_TO_SAT' &&
        new Date(`${nextDispatchDate}T12:00:00`).getDay() === 0
      ) {
        nextDispatchDate = addDaysLocal(nextDispatchDate, 1);
      }
      createRecurringSchedule({
        residentId: currentUser.id,
        residentName: currentUser.fullName,
        societyId: selectedSociety.id,
        flatNumber: currentUser.flatNumber,
        serviceTypeId: service.id,
        serviceTypeName: 'Rotating Tiffin subscription',
        categoryId: 'cat-tiffin',
        frequency: tiffinFrequency,
        preferredSlot: 'Meal delivery',
        selectedTaskIds: [],
        residentPreferences: currentUser.preferences,
        quantity,
        historyOrderIds: [result.order.id],
        lockedPricePerVisit: result.order.subtotal,
        providerPayoutPerVisit: result.order.providerEarnings,
        status: 'ACTIVE',
        nextDispatchDate,
      });
      setMessage(
        `Today’s Tiffin order is confirmed. A ${tiffinFrequency.toLowerCase()} kitchen-rotating subscription was created.`,
      );
      setSubscribeToTiffin(false);
      setMode('recurring');
      return;
    }
    setMessage('Today’s Tiffin order is confirmed.');
  };

  const savePreferences = () => {
    if (!currentUser) return;
    updateResidentPreferences(currentUser.id, {
      diet,
      allergies: allergiesText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      noOnionGarlic,
      houseNotes: houseNotes.trim(),
      pets: pets.trim(),
    });
    setMessage('Household preferences saved. They will be included in future job briefs.');
  };

  const createRecurringFromRequest = (schedule: RecurringSchedule) => {
    const updated = {
      ...schedule,
      status: schedule.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED',
    } as const;
    updateRecurringSchedule(schedule.id, updated);
  };

  const renderAssignedProvider = (job: JobRequest) => {
    if (!job.claimedByProviderId) return null;
    const provider = providers.find((item) => item.id === job.claimedByProviderId);
    const providerUser = provider?.userId
      ? users.find((user) => user.id === provider.userId)
      : undefined;
    const assignedOrder = job.orderId
      ? orders.find((order) => order.id === job.orderId)
      : undefined;
    const verifiedDocuments = provider?.documents?.filter((document) => document.verified) || [];
    const hasIdCheck = verifiedDocuments.some((document) =>
      /aadhaar|id card|identity/i.test(document.type),
    );
    const hasBackgroundCheck = verifiedDocuments.some((document) =>
      /background|police/i.test(document.type),
    );
    const providerReviews = reviews
      .filter((review) => review.providerId === job.claimedByProviderId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
    return (
      <div
        className="card"
        style={{ marginTop: 12, background: '#f0fdfa', borderColor: '#99f6e4' }}
      >
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>Who&apos;s helping you today</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {provider?.avatarUrl && (
            <img
              src={provider.avatarUrl}
              alt=""
              width={54}
              height={54}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
          )}
          <div>
            <strong>
              {provider
                ? displayProviderName(providerUser?.fullName || provider.businessName)
                : 'Verified provider'}
            </strong>
            <div style={{ fontSize: 13, color: '#475569' }}>
              {provider?.experienceYears ?? 0} years experience · <ShieldCheck size={13} /> Verified
              by LocalNest
              {hasIdCheck && ' · ID checked'}
              {hasBackgroundCheck && ' · Background checked'}
            </div>
          </div>
        </div>
        <p style={{ marginTop: 10, fontSize: 13 }}>
          Live status:{' '}
          {assignedOrder?.status === 'IN_PROGRESS'
            ? 'Service in progress'
            : 'Accepted; arriving for the scheduled slot'}{' '}
          · ETA: {job.scheduledSlot}
        </p>
        <p style={{ marginTop: 6, fontWeight: 700 }}>
          Door OTP: <span aria-label="Door OTP">{job.doorOtp}</span> — share this code when your
          provider arrives.
        </p>
        {!providerReviews.length ? (
          <p style={{ marginTop: 10 }}>New on LocalNest</p>
        ) : (
          <div style={{ marginTop: 10 }}>
            {providerReviews.map((review) => (
              <div
                key={review.id}
                style={{ borderTop: '1px solid #ccfbf1', padding: '8px 0', fontSize: 13 }}
              >
                <Star size={13} fill="#f59e0b" color="#f59e0b" /> {review.rating}/5 · “
                {anonymizeFeedbackComment(review.comment, [
                  review.customerName,
                  provider?.businessName || '',
                ])}
                ”
                <div style={{ color: '#64748b' }}>
                  Verified resident · {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
        {assignedOrder?.mealPhotoUrl && (
          <div style={{ marginTop: 12 }}>
            <strong>Finished-meal photo</strong>
            <img
              src={assignedOrder.mealPhotoUrl}
              alt="Finished meal prepared for this order"
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: 280,
                objectFit: 'contain',
                marginTop: 6,
                borderRadius: 8,
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const submitComplaint = (orderId: string) => {
    createComplaint(
      orderId,
      'SERVICE_ISSUE',
      'Resident requested support for this dispatch order.',
    );
    setMessage('Support request sent.');
  };

  const renderJob = (job: JobRequest) => {
    const order = job.orderId ? orders.find((item) => item.id === job.orderId) : null;
    const remainingMs = currentTime
      ? Math.max(0, new Date(job.expiresAt).getTime() - currentTime)
      : 0;
    return (
      <article className="card" key={job.id} style={{ marginBottom: 14 }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
        >
          <div>
            <strong>{job.serviceTypeName}</strong> · {job.jobNumber}
            <div style={{ color: '#64748b', fontSize: 13 }}>
              {job.scheduledDate} · {job.scheduledSlot} · {job.estimatedDurationMinutes} min
            </div>
          </div>
          <span
            className={`badge ${job.status === 'CLAIMED' ? 'badge-emerald' : job.status === 'OPEN' ? 'badge-amber' : 'badge-slate'}`}
          >
            {job.status === 'OPEN' ? t.findingProvider : job.status}
          </span>
        </div>
        <div style={{ marginTop: 10, fontSize: 14 }}>
          {job.taskBreakdown.map((task) => task.name).join(', ') ||
            job.sizeBandInput ||
            'Service request'}
          <div>
            ₹{job.totalResidentPrice} authorized · provider payout ₹{job.providerPayout}
          </div>
          {job.status === 'OPEN' && (
            <div style={{ color: '#64748b' }}>
              Provider responses close in {Math.ceil(remainingMs / 60000)} min.
            </div>
          )}
        </div>
        {job.status === 'OPEN' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => cancelJobRequest(job.id)}>
              Cancel request (free)
            </button>
          </div>
        )}
        {job.status === 'EXPIRED' && (
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 10 }}
            onClick={() => {
              setCategoryId(job.categoryId);
              setServiceTypeId(job.serviceTypeId);
              setSelectedTasks(job.selectedTaskIds);
              setSizeBand(job.sizeBandInput || '');
              setScheduledDate(job.scheduledDate);
              setScheduledSlot(job.scheduledSlot);
              setDishNotes(job.dishNotes || '');
              setKitchenReady(Boolean(job.kitchenReadinessConfirmed));
              setStylistGender(job.stylistGenderPreference || 'ANY');
              setMode('book');
            }}
          >
            Choose another slot or retry
          </button>
        )}
        {job.status === 'CLAIMED' && order && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => cancelClaimedJobByResident(job.id)}
            >
              Cancel order
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => submitComplaint(order.id)}>
              Get support
            </button>
            {order.status === 'COMPLETED' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const response = submitReview({
                    orderId: order.id,
                    providerId: order.providerId,
                    rating: 5,
                    comment: 'Service completed as expected.',
                    privacyOption: 'ANONYMOUS',
                  });
                  setMessage(response.message);
                }}
              >
                Leave a review
              </button>
            )}
          </div>
        )}
        {job.status === 'CLAIMED' && renderAssignedProvider(job)}
      </article>
    );
  };

  return (
    <main className="container" style={{ paddingTop: 22, paddingBottom: 100 }}>
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 850 }}>{t.dispatchTitle}</h1>
          <p style={{ color: '#64748b' }}>
            {selectedSociety.name} · {t.dispatchSubtitle}
          </p>
        </div>
        <span className="badge badge-emerald">
          Wallet credit ₹{getWalletBalance(currentUser?.id || '')}
        </span>
      </section>

      <nav
        className="scrollable-tabs"
        aria-label="Resident service tabs"
        style={{ marginBottom: 18 }}
      >
        {(
          [
            ['book', 'Book service'],
            ['requests', `Requests (${residentJobs.length})`],
            ['recurring', `Recurring (${activeSchedules.length})`],
            ['preferences', 'Home preferences'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={`btn btn-sm ${mode === id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {message && (
        <div className="booking-alert-banner booking-alert-success" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="booking-alert-banner booking-alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {mode === 'book' && (
        <div className="dispatch-booking-layout">
          <section className="booking-surface-card">
            <div className="booking-header-wrap">
              <div className="booking-header-icon-box">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="booking-title">What service do you need?</h2>
                <p className="booking-subtitle">
                  Choose your tasks, pick your slot, and connect with verified society providers.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label className="booking-field-label" htmlFor="booking-category-select">
                  <span>Service Category</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {availableCategories.length} available
                  </span>
                </label>
                <div className="booking-input-wrap">
                  <Layers size={16} className="input-prefix-icon" />
                  <select
                    id="booking-category-select"
                    className="form-input"
                    value={categoryId}
                    onChange={(event) => {
                      setCategoryId(event.target.value);
                      setSelectedTasks([]);
                      setSizeBand('');
                    }}
                  >
                    {availableCategories.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="booking-field-label" htmlFor="booking-service-select">
                  <span>Service Type</span>
                  {selectedService?.tier && (
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      {selectedService.tier}
                    </span>
                  )}
                </label>
                <div className="booking-input-wrap">
                  <Sparkles size={16} className="input-prefix-icon" />
                  <select
                    id="booking-service-select"
                    className="form-input"
                    value={serviceTypeId}
                    onChange={(event) => {
                      setServiceTypeId(event.target.value);
                      setSelectedTasks([]);
                      setSizeBand('');
                    }}
                  >
                    {serviceOptions.map((service) => (
                      <option value={service.id} key={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedCategory?.matching === 'LEAD_QUOTE' && (
              <div style={{ marginTop: 14 }}>
                <label className="booking-field-label">Describe your project</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={leadNotes}
                  onChange={(event) => setLeadNotes(event.target.value)}
                  placeholder="Rooms, measurements, materials and timing needs..."
                />
                <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>
                  Up to three verified providers may quote. Select your preferred quote; payment is
                  held in mock milestone escrow.
                </p>
              </div>
            )}

            {selectedService?.tier === 'BASIC' && (
              <div
                style={{
                  fontSize: 13,
                  marginTop: 6,
                  marginBottom: 12,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                Basic tier only. Ingredients are supplied by the resident.
              </div>
            )}

            {selectedCategory?.matching !== 'LEAD_QUOTE' &&
              selectedCategory?.matching !== 'BROWSE_ORDER' &&
              selectedService?.availableTasks &&
              selectedService.availableTasks.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="booking-field-label">
                    <span>Select Required Tasks</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: selectedTasks.length > 0 ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      {selectedTasks.length > 0
                        ? `${selectedTasks.length} selected`
                        : 'Tick what you need'}
                    </span>
                  </div>
                  <div className="booking-tasks-container">
                    {selectedService.availableTasks.map((task) => {
                      const isChecked = selectedTasks.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          className={`booking-task-card ${isChecked ? 'selected' : ''}`}
                          onClick={() => toggleTask(task.id)}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              toggleTask(task.id);
                            }
                          }}
                        >
                          <div className="booking-task-left">
                            <div className="booking-task-checkbox">
                              {isChecked && <Check size={14} strokeWidth={3} />}
                            </div>
                            <span className="booking-task-name">{task.name}</span>
                          </div>
                          <div className="booking-task-pill">
                            <span className="booking-task-price">₹{task.basePrice}</span>
                            <span>·</span>
                            <span className="booking-task-time">{task.estimatedMinutes}m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {selectedCategory?.matching !== 'LEAD_QUOTE' &&
              !!selectedService?.sizeBands?.length && (
                <div style={{ marginTop: 12 }}>
                  <label className="booking-field-label" htmlFor="booking-size-select">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Home size={14} /> Household Size
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: sizeBand ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      {sizeBand || 'Select size'}
                    </span>
                  </label>
                  <div className="size-band-chip-grid">
                    {selectedService.sizeBands.map((band) => {
                      const isActive = sizeBand === band.label;
                      return (
                        <button
                          type="button"
                          key={band.label}
                          className={`size-band-chip ${isActive ? 'active' : ''}`}
                          onClick={() => setSizeBand(isActive ? '' : band.label)}
                        >
                          <span className="size-band-label">{band.label}</span>
                          <span className="size-band-price">₹{band.price}</span>
                        </button>
                      );
                    })}
                  </div>
                  <select
                    id="booking-size-select"
                    aria-label="Household size"
                    value={sizeBand}
                    onChange={(event) => setSizeBand(event.target.value)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      pointerEvents: 'none',
                      width: 0,
                      height: 0,
                    }}
                  >
                    <option value="">Choose size</option>
                    {selectedService.sizeBands.map((band) => (
                      <option key={band.label} value={band.label}>
                        {band.label} · ₹{band.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {selectedCategory?.id === 'cat-cook' && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <label className="booking-field-label">Dish note / preferred meal</label>
                <input
                  className="form-input"
                  value={dishNotes}
                  onChange={(event) => setDishNotes(event.target.value)}
                  placeholder="e.g. Roti, dal, rice and simple sabzi"
                />
                <label
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    marginTop: 12,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={kitchenReady}
                    onChange={(event) => setKitchenReady(event.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <span>Ingredients, gas and cookware will be ready</span>
                </label>
              </div>
            )}

            {selectedCategory?.id === 'cat-salon' && (
              <div style={{ marginTop: 14 }}>
                <label className="booking-field-label">Stylist gender preference</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['ANY', 'FEMALE', 'MALE'] as const).map((gender) => (
                    <button
                      type="button"
                      key={gender}
                      className={`frequency-chip ${stylistGender === gender ? 'active' : ''}`}
                      onClick={() => setStylistGender(gender)}
                    >
                      {gender === 'ANY'
                        ? 'No preference'
                        : gender === 'FEMALE'
                          ? 'Female stylist'
                          : 'Male stylist'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <div className="booking-field-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarClock size={15} /> Schedule & Time Slot
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                }}
              >
                <div>
                  <label
                    className="form-label"
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    htmlFor="booking-date-input"
                  >
                    Date
                  </label>
                  <div className="booking-input-wrap">
                    <Calendar size={16} className="input-prefix-icon" />
                    <input
                      id="booking-date-input"
                      className="form-input"
                      type="date"
                      min={localDate()}
                      value={scheduledDate}
                      onChange={(event) => setScheduledDate(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="form-label"
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    htmlFor="booking-slot-select"
                  >
                    Start time
                  </label>
                  <div className="booking-input-wrap">
                    <Clock3 size={16} className="input-prefix-icon" />
                    <select
                      id="booking-slot-select"
                      className="form-input"
                      value={scheduledSlot}
                      onChange={(event) => setScheduledSlot(event.target.value)}
                    >
                      {[
                        '07:00 - 09:00',
                        '09:00 - 11:00',
                        '11:00 - 13:00',
                        '13:00 - 15:00',
                        '15:00 - 17:00',
                        '17:00 - 19:00',
                      ].map((slot) => (
                        <option value={slot} key={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {(selectedCategory?.matching === 'DISPATCH' ||
              selectedCategory?.supportsOneOffDispatch) && (
              <div style={{ marginTop: 16 }}>
                <div
                  className={`recurring-toggle-box ${makeRecurring ? 'active' : ''}`}
                  onClick={() => setMakeRecurring(!makeRecurring)}
                  role="switch"
                  aria-checked={makeRecurring}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setMakeRecurring(!makeRecurring);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="recurring-box-icon">
                      <Repeat size={18} />
                    </div>
                    <div>
                      <div className="recurring-box-title">Resident-owned recurring schedule</div>
                      <div className="recurring-box-desc">
                        Lock in your preferred provider with automatic repeat visits
                      </div>
                    </div>
                  </div>
                  <div className={`modern-switch ${makeRecurring ? 'checked' : ''}`}>
                    <div className="modern-switch-thumb" />
                  </div>
                </div>

                {makeRecurring && (
                  <div className="frequency-chip-group">
                    <div
                      style={{
                        width: '100%',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Select Frequency
                    </div>
                    {[
                      { id: 'DAILY', label: 'Daily' },
                      { id: 'MON_TO_SAT', label: 'Mon to Sat' },
                      { id: 'WEEKLY', label: 'Weekly' },
                      { id: 'ALTERNATE_DAYS', label: 'Alternate Days' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`frequency-chip ${frequency === item.id ? 'active' : ''}`}
                        onClick={() => setFrequency(item.id as typeof frequency)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedCategory?.matching !== 'LEAD_QUOTE' &&
              selectedCategory?.matching !== 'BROWSE_ORDER' && (
                <div className="booking-quick-summary-bar">
                  <div className="booking-summary-metric">
                    <span className="booking-summary-metric-label">Selected Tasks</span>
                    <span className="booking-summary-metric-val">
                      {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="booking-summary-metric">
                    <span className="booking-summary-metric-label">Estimated Time</span>
                    <span className="booking-summary-metric-val">
                      {pricing.durationMinutes} mins
                    </span>
                  </div>

                  <div className="booking-summary-metric">
                    <span className="booking-summary-metric-label">Locked Subtotal</span>
                    <span className="booking-summary-metric-val highlight">
                      ₹{pricing.subtotal + platformFeeRules.oneTimeFee}
                    </span>
                  </div>
                </div>
              )}
          </section>

          <aside>
            <section className="card">
              <h2 style={{ fontWeight: 800 }}>LocalNest provider pool</h2>
              <p style={{ color: '#64748b', marginTop: 4 }}>
                Anonymized supply for your society. Providers are only revealed after one accepts.
              </p>
              {poolStats &&
                (selectedCategory?.matching === 'DISPATCH' ||
                  selectedCategory?.supportsOneOffDispatch) && (
                  <div style={{ marginTop: 12 }}>
                    <strong>
                      {poolStats.totalPoolCount} verified providers cover this society
                    </strong>
                    <p>
                      {poolStats.availableSlotCount} available for this slot · average rating{' '}
                      {poolStats.averageRating.toFixed(1)} · {poolStats.averageExperienceYears}{' '}
                      years’ average experience
                    </p>
                    {!poolStats.hideBreakdown && (
                      <div style={{ marginTop: 10 }}>
                        <p>
                          On-time arrival {poolStats.onTimeRatePct}% · typical acceptance{' '}
                          {poolStats.typicalAcceptanceMinutes} min
                        </p>
                        {poolStats.ratingDistribution.map((item) => (
                          <div key={item.stars}>
                            {item.stars}★ · {item.count} providers · {item.pct}%
                          </div>
                        ))}
                        <p>
                          Verification checks: ID {poolStats.verificationStats.idChecked} ·
                          background {poolStats.verificationStats.backgroundChecked} · society
                          coverage {poolStats.verificationStats.coverageVerified}
                        </p>
                        {poolStats.skillsCovered.length > 0 && (
                          <p>Skills available: {poolStats.skillsCovered.join(', ')}</p>
                        )}
                        {poolStats.anonymousReviews.map((review, index) => (
                          <p
                            key={`${review.createdAt}-${index}`}
                            style={{ fontSize: 13, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}
                          >
                            <Star size={12} fill="#f59e0b" color="#f59e0b" /> {review.rating}/5 · “
                            {review.comment}” · {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        ))}
                      </div>
                    )}
                    {poolStats.hideBreakdown && (
                      <p style={{ marginTop: 8, fontSize: 13 }}>
                        <CircleHelp size={14} /> Detailed pool statistics are hidden for pools with
                        fewer than three providers.
                      </p>
                    )}
                  </div>
                )}
              {selectedCategory?.matching !== 'LEAD_QUOTE' &&
                selectedCategory?.matching !== 'BROWSE_ORDER' && (
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12 }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Estimated duration</div>
                    <strong>{pricing.durationMinutes} minutes</strong>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                      Price locked before broadcast
                    </div>
                    <strong style={{ fontSize: 22 }}>
                      ₹{pricing.subtotal + platformFeeRules.oneTimeFee}
                    </strong>{' '}
                    <span style={{ color: '#64748b' }}>(includes platform fee)</span>
                    <div style={{ fontSize: 12, marginTop: 6 }}>
                      Provider payout ₹
                      {Math.round(
                        pricing.subtotal *
                          (selectedCategory?.monetization === 'COMMISSION'
                            ? 1 - (selectedCategory.flatCommissionRate ?? 10) / 100
                            : 1),
                      )}
                    </div>
                  </div>
                )}
              {selectedCategory?.matching === 'BROWSE_ORDER' && (
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12 }}>
                  <h3 style={{ fontWeight: 800, marginBottom: 8 }}>
                    Today&apos;s menus for {selectedSociety.name}
                  </h3>
                  {tiffinMenus
                    .filter(
                      (menu) =>
                        menu.isActive &&
                        menu.deliveryDate === localDate(0) &&
                        menu.societyIds.includes(selectedSociety.id) &&
                        (!currentTime || new Date(menu.cutoffAt).getTime() > currentTime),
                    )
                    .map((menu) => (
                      <article
                        key={menu.id}
                        style={{ padding: '10px 0', borderTop: '1px solid #e2e8f0' }}
                      >
                        <strong>{menu.mealName}</strong>
                        <p>
                          {menu.description} · ₹{menu.price} · {menu.availableQuantity} portions
                          left
                        </p>
                        <div>
                          Kitchen: verified society kitchen · subscriptions rotate across available
                          kitchens
                        </div>
                        <input
                          aria-label={`Quantity for ${menu.mealName}`}
                          type="number"
                          min="1"
                          max={menu.availableQuantity}
                          value={menuQuantities[menu.id] || 1}
                          onChange={(event) =>
                            setMenuQuantities((prev) => ({
                              ...prev,
                              [menu.id]: Number(event.target.value),
                            }))
                          }
                          style={{ width: 70 }}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ marginLeft: 8 }}
                          onClick={() => buyMenu(menu.id)}
                        >
                          Order menu
                        </button>
                      </article>
                    ))}
                  {!!tiffinMenus.some(
                    (menu) =>
                      menu.isActive &&
                      menu.deliveryDate === localDate(0) &&
                      menu.societyIds.includes(selectedSociety.id) &&
                      (!currentTime || new Date(menu.cutoffAt).getTime() > currentTime),
                  ) && (
                    <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 10, paddingTop: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={subscribeToTiffin}
                          onChange={(event) => setSubscribeToTiffin(event.target.checked)}
                        />
                        Start a resident-owned subscription and rotate kitchens
                      </label>
                      {subscribeToTiffin && (
                        <select
                          className="form-input"
                          style={{ marginTop: 8 }}
                          value={tiffinFrequency}
                          onChange={(event) =>
                            setTiffinFrequency(event.target.value as RecurringSchedule['frequency'])
                          }
                        >
                          <option value="DAILY">Daily</option>
                          <option value="MON_TO_SAT">Monday to Saturday</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="ALTERNATE_DAYS">Alternate days</option>
                        </select>
                      )}
                    </div>
                  )}
                  {!tiffinMenus.some(
                    (menu) =>
                      menu.isActive &&
                      menu.deliveryDate === localDate(0) &&
                      menu.societyIds.includes(selectedSociety.id) &&
                      (!currentTime || new Date(menu.cutoffAt).getTime() > currentTime),
                  ) && <p>No menus currently available. Check back later.</p>}
                </div>
              )}
              {selectedCategory?.matching !== 'BROWSE_ORDER' && (
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 14 }}
                  onClick={submitBooking}
                  disabled={!canSubmitBooking}
                >
                  {selectedCategory?.matching === 'LEAD_QUOTE'
                    ? 'Share project for up to 3 quotes'
                    : 'Authorize mock escrow and find a provider'}
                </button>
              )}
              {selectedCategory &&
                selectedService &&
                selectedCategory.matching !== 'BROWSE_ORDER' &&
                !canSubmitBooking && (
                  <p role="status" style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
                    {needsTask
                      ? 'Select at least one service task.'
                      : needsSizeBand
                        ? 'Choose a household size.'
                        : needsKitchenReadiness
                          ? 'Confirm the kitchen is ready.'
                          : 'Describe your project before requesting quotes.'}
                  </p>
                )}
              {(selectedCategory?.matching === 'DISPATCH' ||
                selectedCategory?.supportsOneOffDispatch) && (
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Providers receive the job brief, payout and a {dispatchTimeoutMinutes}-minute
                  countdown. If unclaimed, the mock escrow is refunded as credit.
                </p>
              )}
            </section>
            <section className="card" style={{ marginTop: 14 }}>
              <h3 style={{ fontWeight: 800 }}>Shared household brief</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                This appears on every dispatched job. Edit in Home preferences.
              </p>
              <p>
                {currentUser?.preferences?.diet || 'Diet preference not set'}
                {currentUser?.preferences?.noOnionGarlic ? ' · no onion/garlic' : ''}
              </p>
              <p>
                {currentUser?.preferences?.allergies?.length
                  ? `Allergies: ${currentUser.preferences.allergies.join(', ')}`
                  : 'No allergies noted'}
              </p>
            </section>
          </aside>
        </div>
      )}

      {mode === 'requests' && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock3 size={18} />
            <h2 style={{ fontWeight: 800 }}>{t.residentRequests}</h2>
          </div>
          {residentJobs.filter((job) => job.requestType !== 'LEAD').length ? (
            residentJobs.filter((job) => job.requestType !== 'LEAD').map(renderJob)
          ) : (
            <div className="card">No service requests yet.</div>
          )}
          {residentLeads.map((lead) => (
            <article className="card" key={lead.id} style={{ marginTop: 12 }}>
              <strong>{lead.serviceTypeName}</strong> · {lead.jobNumber} · {lead.status}
              <p>{lead.requestNotes}</p>
              <p>
                {leadQuotes.filter((quote) => quote.jobId === lead.id).length} of 3 quotes received.
              </p>
              {leadQuotes
                .filter((quote) => quote.jobId === lead.id && quote.status === 'SUBMITTED')
                .map((quote) => (
                  <div key={quote.id} style={{ borderTop: '1px solid #e2e8f0', padding: '10px 0' }}>
                    Verified provider · {quote.providerExperienceYears} years experience · ₹
                    {quote.quotedAmount} · {quote.estimatedDays} days
                    <p>{quote.scopeNotes}</p>
                    <ul>
                      {quote.milestones.map((milestone) => (
                        <li key={milestone.title}>
                          {milestone.title} · ₹{milestone.amount}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const result = acceptLeadQuote(quote.id);
                        setMessage(
                          result.success
                            ? 'Quote selected. Mock milestone escrow order created.'
                            : 'This quote is no longer available.',
                        );
                      }}
                    >
                      Select quote
                    </button>
                  </div>
                ))}
              {message && <p>{message}</p>}
            </article>
          ))}
        </section>
      )}

      {mode === 'recurring' && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CalendarClock size={18} />
            <h2 style={{ fontWeight: 800 }}>{t.recurringSchedulesTitle}</h2>
          </div>
          {activeSchedules.length ? (
            activeSchedules.map((schedule) => (
              <article className="card" key={schedule.id} style={{ marginBottom: 12 }}>
                <strong>{schedule.serviceTypeName}</strong> · {schedule.frequency} ·{' '}
                {schedule.preferredSlot}
                <p>
                  Next occurrence: {schedule.nextDispatchDate}.{' '}
                  {schedule.categoryId === 'cat-tiffin'
                    ? 'Available kitchens rotate for every occurrence.'
                    : 'Every occurrence is dispatched independently without a saved provider.'}
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => createRecurringFromRequest(schedule)}
                >
                  {schedule.status === 'PAUSED' ? 'Resume' : 'Pause'}
                </button>
              </article>
            ))
          ) : (
            <div className="card">No active recurring schedules. Create one while booking.</div>
          )}
        </section>
      )}

      {mode === 'preferences' && (
        <section className="card" style={{ maxWidth: 680 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>{t.householdPreferencesTitle}</h2>
          <label className="form-label">Diet</label>
          <select
            className="form-input"
            value={diet}
            onChange={(event) => setDiet(event.target.value as typeof diet)}
          >
            <option value="VEG">Vegetarian</option>
            <option value="NON_VEG">Non-vegetarian</option>
            <option value="JAIN">Jain</option>
            <option value="VEGAN">Vegan</option>
          </select>
          <label className="form-label" style={{ marginTop: 10 }}>
            Allergies (comma-separated)
          </label>
          <input
            className="form-input"
            value={allergiesText}
            onChange={(event) => setAllergiesText(event.target.value)}
          />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
            <input
              type="checkbox"
              checked={noOnionGarlic}
              onChange={(event) => setNoOnionGarlic(event.target.checked)}
            />{' '}
            No onion or garlic
          </label>
          <label className="form-label" style={{ marginTop: 10 }}>
            House notes
          </label>
          <textarea
            className="form-input"
            value={houseNotes}
            onChange={(event) => setHouseNotes(event.target.value)}
          />
          <label className="form-label" style={{ marginTop: 10 }}>
            Pets
          </label>
          <input
            className="form-input"
            value={pets}
            onChange={(event) => setPets(event.target.value)}
            placeholder="Type or NONE"
          />
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={savePreferences}>
            <CheckCircle2 size={15} /> Save preferences
          </button>
        </section>
      )}
    </main>
  );
}
