'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMarketplace } from '@/lib/store';

function localDateTimeValue(hour: number): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`;
}

function localDateValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function compressMealPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > 12_000_000) {
    throw new Error('Choose an image smaller than 12 MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not process the photo.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let quality = 0.75;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > 160_000 && quality > 0.45) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrl.length > 160_000)
      throw new Error(
        'Photo could not be compressed enough for local storage. Choose a smaller image.',
      );
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

export default function ProviderDispatchWorkspace() {
  const {
    activeProviderId,
    providers,
    jobRequests,
    dispatchNotifications,
    providerMemberships,
    providerPlans,
    claimJob,
    cancelClaimedJob,
    renewProviderMembership,
    failProviderMembershipRenewal,
    orders,
    serviceTypes,
    updateProviderCapabilities,
    publishTiffinMenu,
    verifyDoorOtp,
    settleCookMissingIngredients,
    saveCookMealPhoto,
    selectedSociety,
    societies,
    submitLeadQuote,
    leadQuotes,
    t,
  } = useMarketplace();
  const [view, setView] = useState<'inbox' | 'billing' | 'skills'>('inbox');
  const [feedback, setFeedback] = useState('');
  const [otpByOrder, setOtpByOrder] = useState<Record<string, string>>({});
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuPrice, setMenuPrice] = useState(150);
  const [menuQuantity, setMenuQuantity] = useState(10);
  const [menuDeliveryDate, setMenuDeliveryDate] = useState(localDateValue());
  const [menuCutoff, setMenuCutoff] = useState(localDateTimeValue(10));
  const [menuSocieties, setMenuSocieties] = useState<string[]>([selectedSociety.id]);
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, number>>({});
  const [quoteDays, setQuoteDays] = useState<Record<string, number>>({});
  const [quoteNotes, setQuoteNotes] = useState<Record<string, string>>({});
  const [mealPhotoLinks, setMealPhotoLinks] = useState<Record<string, string>>({});
  const provider = providers.find((item) => item.id === activeProviderId);
  const membership =
    providerMemberships.find((item) => item.providerId === activeProviderId) ||
    provider?.membership;
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const inbox = useMemo(() => {
    return dispatchNotifications
      .filter(
        (notification) =>
          notification.providerId === activeProviderId && notification.status === 'NEW',
      )
      .map((notification) => jobRequests.find((job) => job.id === notification.jobRequestId))
      .filter(
        (job) =>
          job?.status === 'OPEN' &&
          (!currentTime || new Date(job.expiresAt).getTime() > currentTime),
      );
  }, [dispatchNotifications, activeProviderId, jobRequests, currentTime]);
  if (!provider) return <div className="card">Provider profile not found.</div>;

  const handleClaim = (jobId: string) => {
    const result = claimJob(jobId, provider.id);
    setFeedback(
      result.success
        ? 'Request claimed. The order is now in your normal Orders workflow.'
        : result.error || 'Unable to accept this request.',
    );
  };
  const handleRenew = () => {
    const result = renewProviderMembership(provider.id);
    setFeedback(
      result.success
        ? 'Mock renewal paid successfully.'
        : 'No membership plan is attached to this provider.',
    );
  };
  const activeJobs = jobRequests.filter(
    (job) => job.status === 'CLAIMED' && job.claimedByProviderId === provider.id,
  );

  return (
    <section className="container" style={{ paddingTop: 18, paddingBottom: 40 }}>
      <nav className="scrollable-tabs" style={{ marginBottom: 14 }}>
        <button
          className={`btn btn-sm ${view === 'inbox' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('inbox')}
        >
          {t.providerInboxTitle} ({inbox.length})
        </button>
        <button
          className={`btn btn-sm ${view === 'skills' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('skills')}
        >
          {t.providerSkillsTitle}
        </button>
        <button
          className={`btn btn-sm ${view === 'billing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('billing')}
        >
          Membership billing
        </button>
      </nav>
      {feedback && (
        <p role="status" className="card" style={{ marginBottom: 12 }}>
          {feedback}
        </p>
      )}
      {view === 'inbox' && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            {t.providerInboxTitle}
          </h2>
          {!inbox.length && (
            <div className="card">
              No new matching requests. Keep your service skills and availability up to date.
            </div>
          )}
          {inbox.map(
            (job) =>
              job && (
                <article className="card" key={job.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong>{job.serviceTypeName}</strong> · {job.jobNumber}
                      <div>
                        {job.societyName} · {job.flatNumber}
                      </div>
                    </div>
                    <div>
                      <strong>Provider payout ₹{job.providerPayout}</strong>
                      <div>
                        Escrow authorized · expires {new Date(job.expiresAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    Task list:{' '}
                    {job.taskBreakdown.map((task) => task.name).join(', ') ||
                      job.sizeBandInput ||
                      'Standard service'}
                  </div>
                  {job.dishNotes && <div>Resident’s dish note: {job.dishNotes}</div>}
                  <div>
                    {job.scheduledDate} · {job.scheduledSlot} · {job.estimatedDurationMinutes}{' '}
                    minutes
                  </div>
                  <div
                    style={{ marginTop: 8, padding: 10, background: '#f8fafc', borderRadius: 8 }}
                  >
                    <strong>Resident preferences:</strong>{' '}
                    {job.residentPreferences.diet || 'Not specified'}
                    {job.residentPreferences.allergies?.length
                      ? ` · Allergies: ${job.residentPreferences.allergies.join(', ')}`
                      : ''}
                    {job.residentPreferences.noOnionGarlic ? ' · No onion/garlic' : ''}
                    {job.residentPreferences.houseNotes
                      ? ` · ${job.residentPreferences.houseNotes}`
                      : ''}
                    {job.residentPreferences.pets ? ` · Pets: ${job.residentPreferences.pets}` : ''}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                    Resident contact remains masked; use LocalNest in-app chat after acceptance.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 10 }}
                    onClick={() => handleClaim(job.id)}
                  >
                    Accept job
                  </button>
                </article>
              ),
          )}
          <h3 style={{ fontWeight: 800, margin: '22px 0 10px' }}>Project quote requests</h3>
          {jobRequests
            .filter(
              (job) =>
                job.requestType === 'LEAD' &&
                job.status === 'OPEN' &&
                job.notifiedProviderIds.includes(provider.id) &&
                leadQuotes.filter((quote) => quote.jobId === job.id && quote.status === 'SUBMITTED')
                  .length < 3,
            )
            .map((job) => {
              const alreadyQuoted = leadQuotes.some(
                (quote) => quote.jobId === job.id && quote.providerId === provider.id,
              );
              return (
                <article className="card" key={job.id} style={{ marginBottom: 12 }}>
                  <strong>{job.serviceTypeName}</strong> · {job.jobNumber}
                  <p>{job.requestNotes}</p>
                  <p>
                    {job.societyName} · {job.scheduledDate} · resident identity hidden until quote
                    selection.
                  </p>
                  {!alreadyQuoted && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <label>
                          Quote ₹
                          <input
                            className="form-input"
                            type="number"
                            min="1"
                            value={quoteAmounts[job.id] || ''}
                            onChange={(event) =>
                              setQuoteAmounts((prev) => ({
                                ...prev,
                                [job.id]: Number(event.target.value),
                              }))
                            }
                          />
                        </label>
                        <label>
                          Estimated days
                          <input
                            className="form-input"
                            type="number"
                            min="1"
                            value={quoteDays[job.id] || ''}
                            onChange={(event) =>
                              setQuoteDays((prev) => ({
                                ...prev,
                                [job.id]: Number(event.target.value),
                              }))
                            }
                          />
                        </label>
                      </div>
                      <textarea
                        className="form-input"
                        style={{ marginTop: 8 }}
                        placeholder="Scope, materials and schedule notes"
                        value={quoteNotes[job.id] || ''}
                        onChange={(event) =>
                          setQuoteNotes((prev) => ({ ...prev, [job.id]: event.target.value }))
                        }
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          const amount = quoteAmounts[job.id] || 0;
                          const days = quoteDays[job.id] || 0;
                          const result = submitLeadQuote({
                            jobId: job.id,
                            providerId: provider.id,
                            providerName: provider.businessName,
                            providerRating: provider.rating,
                            providerExperienceYears: provider.experienceYears || 0,
                            quotedAmount: amount,
                            estimatedDays: days,
                            milestones: [
                              {
                                title: 'Booking deposit',
                                amount: Math.round(amount * 0.3),
                                completed: false,
                              },
                              {
                                title: 'Work completion',
                                amount: amount - Math.round(amount * 0.3),
                                completed: false,
                              },
                            ],
                            scopeNotes: quoteNotes[job.id] || '',
                          });
                          setFeedback(
                            result
                              ? 'Your quote was sent to the resident.'
                              : 'Quote could not be submitted. Check the amount, days and response limit.',
                          );
                        }}
                      >
                        Send quote
                      </button>
                    </>
                  )}
                  {alreadyQuoted && (
                    <p>Your quote has been submitted; the resident can compare up to three bids.</p>
                  )}
                </article>
              );
            })}
          <h3 style={{ fontWeight: 800, margin: '22px 0 10px' }}>Accepted dispatch jobs</h3>
          {activeJobs.map((job) => {
            const order = orders.find((item) => item.id === job.orderId);
            return (
              <article className="card" key={job.id} style={{ marginBottom: 10 }}>
                {job.serviceTypeName} · {job.societyName}, {job.flatNumber} · {job.scheduledDate}{' '}
                {job.scheduledSlot}
                {order?.status === 'ACCEPTED' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      className="form-input"
                      style={{ maxWidth: 150 }}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Resident door OTP"
                      value={otpByOrder[order.id] || ''}
                      onChange={(event) =>
                        setOtpByOrder((prev) => ({
                          ...prev,
                          [order.id]: event.target.value.replace(/\D/g, '').slice(0, 4),
                        }))
                      }
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const result = verifyDoorOtp(order.id, otpByOrder[order.id] || '');
                        setFeedback(
                          result.success
                            ? 'OTP verified. The service has started.'
                            : result.error || 'OTP verification failed.',
                        );
                      }}
                    >
                      Verify OTP and start
                    </button>
                  </div>
                )}
                {order?.status === 'ACCEPTED' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginLeft: 12 }}
                    onClick={() => {
                      const result = cancelClaimedJob(
                        job.id,
                        provider.id,
                        'Provider cancelled after acceptance',
                      );
                      setFeedback(
                        result.success
                          ? 'The job was rebroadcast and the reliability penalty recorded.'
                          : result.error || 'Could not cancel this job.',
                      );
                    }}
                  >
                    Cancel and rebroadcast
                  </button>
                )}
              </article>
            );
          })}
          {orders
            .filter(
              (order) =>
                order.providerId === provider.id &&
                order.status === 'COMPLETED' &&
                jobRequests.some(
                  (job) => job.orderId === order.id && job.categoryId === 'cat-cook',
                ),
            )
            .map((order) => (
              <article className="card" key={`ingredients-${order.id}`} style={{ marginTop: 12 }}>
                <strong>Cook order {order.orderNumber}</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, maxWidth: 620 }}>
                  <input
                    className="form-input"
                    type="url"
                    placeholder="Optional finished-meal photo URL"
                    value={mealPhotoLinks[order.id] ?? order.mealPhotoUrl ?? ''}
                    onChange={(event) =>
                      setMealPhotoLinks((prev) => ({ ...prev, [order.id]: event.target.value }))
                    }
                  />
                  <input
                    aria-label={`Upload finished-meal photo for ${order.orderNumber}`}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      void compressMealPhoto(file)
                        .then((photo) => {
                          setMealPhotoLinks((prev) => ({ ...prev, [order.id]: photo }));
                          setFeedback('Photo compressed and ready to save.');
                        })
                        .catch((error) =>
                          setFeedback(
                            error instanceof Error
                              ? error.message
                              : 'Photo could not be processed.',
                          ),
                        );
                    }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const result = saveCookMealPhoto(
                        order.id,
                        mealPhotoLinks[order.id] ?? order.mealPhotoUrl ?? '',
                      );
                      setFeedback(
                        result.success
                          ? 'Finished-meal photo saved for dispute records.'
                          : result.error || 'Photo could not be saved.',
                      );
                    }}
                  >
                    Save photo
                  </button>
                </div>
                {!order.cookMissingIngredients && (
                  <>
                    <p style={{ marginTop: 8 }}>Ingredients were missing on arrival?</p>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const result = settleCookMissingIngredients(order.id);
                        setFeedback(
                          result.success
                            ? 'Reduced visit payout and partial resident credit applied.'
                            : result.error || 'Could not apply settlement.',
                        );
                      }}
                    >
                      Apply fair ingredient settlement
                    </button>
                  </>
                )}
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                  The photo is optional. Missing ingredients records a reduced provider visit fee
                  and partial mock wallet credit to the resident.
                </p>
              </article>
            ))}
        </>
      )}
      {view === 'skills' && (
        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{t.providerSkillsTitle}</h2>
          <p style={{ color: '#64748b' }}>
            Only opted-in service types and every selected task skill are eligible for your inbox.
          </p>
          {serviceTypes
            .filter((service) => service.categoryId === provider.categoryId)
            .map((service) => {
              const optedIn = provider.enabledServiceTypeIds?.includes(service.id) || false;
              return (
                <div key={service.id} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
                  <label style={{ display: 'flex', gap: 8, fontWeight: 750 }}>
                    <input
                      type="checkbox"
                      checked={optedIn}
                      onChange={(event) =>
                        updateProviderCapabilities(
                          provider.id,
                          event.target.checked
                            ? [...(provider.enabledServiceTypeIds || []), service.id]
                            : (provider.enabledServiceTypeIds || []).filter(
                                (id) => id !== service.id,
                              ),
                          provider.enabledTaskIds || [],
                        )
                      }
                    />{' '}
                    {service.name}
                  </label>
                  {optedIn &&
                    service.availableTasks.map((task) => (
                      <label
                        key={task.id}
                        style={{ display: 'flex', gap: 8, margin: '8px 0 0 24px' }}
                      >
                        <input
                          type="checkbox"
                          checked={provider.enabledTaskIds?.includes(task.id) || false}
                          onChange={(event) =>
                            updateProviderCapabilities(
                              provider.id,
                              provider.enabledServiceTypeIds || [],
                              event.target.checked
                                ? [...(provider.enabledTaskIds || []), task.id]
                                : (provider.enabledTaskIds || []).filter((id) => id !== task.id),
                            )
                          }
                        />{' '}
                        {task.name}
                      </label>
                    ))}
                </div>
              );
            })}
          {provider.categoryId === 'cat-tiffin' && (
            <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
              <h3 style={{ fontWeight: 800 }}>Publish today&apos;s Tiffin menu</h3>
              <input
                className="form-input"
                style={{ marginTop: 8 }}
                placeholder="Meal name"
                value={menuName}
                onChange={(event) => setMenuName(event.target.value)}
              />
              <input
                className="form-input"
                style={{ marginTop: 8 }}
                placeholder="Description"
                value={menuDescription}
                onChange={(event) => setMenuDescription(event.target.value)}
              />
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}
              >
                <label>
                  Price ₹
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={menuPrice}
                    onChange={(event) => setMenuPrice(Number(event.target.value))}
                  />
                </label>
                <label>
                  Quantity
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={menuQuantity}
                    onChange={(event) => setMenuQuantity(Number(event.target.value))}
                  />
                </label>
                <label>
                  Delivery date
                  <input
                    className="form-input"
                    type="date"
                    min={localDateValue()}
                    value={menuDeliveryDate}
                    onChange={(event) => setMenuDeliveryDate(event.target.value)}
                  />
                </label>
                <label>
                  Order cutoff
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={menuCutoff}
                    onChange={(event) => setMenuCutoff(event.target.value)}
                  />
                </label>
              </div>
              <div style={{ marginTop: 8 }}>
                Societies
                {societies.map((society) => (
                  <label
                    key={society.id}
                    style={{ display: 'inline-flex', gap: 5, margin: '0 10px' }}
                  >
                    <input
                      type="checkbox"
                      checked={menuSocieties.includes(society.id)}
                      onChange={(event) =>
                        setMenuSocieties((current) =>
                          event.target.checked
                            ? [...current, society.id]
                            : current.filter((id) => id !== society.id),
                        )
                      }
                    />
                    {society.name}
                  </label>
                ))}
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => {
                  const result = publishTiffinMenu({
                    mealName: menuName,
                    description: menuDescription,
                    price: menuPrice,
                    deliveryDate: menuDeliveryDate,
                    cutoffAt: new Date(menuCutoff).toISOString(),
                    availableQuantity: menuQuantity,
                    societyIds: menuSocieties,
                  });
                  setFeedback(
                    result.success
                      ? `Menu published for ${menuDeliveryDate}.`
                      : result.error || 'Menu could not be published.',
                  );
                  if (result.success) setMenuName('');
                }}
              >
                Publish menu
              </button>
            </div>
          )}
        </div>
      )}
      {view === 'billing' && (
        <div className="card" style={{ maxWidth: 760 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Provider membership</h2>
          {membership ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <div>
                  <span className="form-label">Plan status</span>
                  <strong>{membership.status}</strong>
                </div>
                <div>
                  <span className="form-label">Monthly plan</span>
                  <strong>₹{membership.monthlyFee}/month</strong>
                </div>
                <div>
                  <span className="form-label">Renewal date</span>
                  <strong>{membership.currentBillingPeriodEnd}</strong>
                </div>
                <div>
                  <span className="form-label">Free trial through</span>
                  <strong>{membership.trialEndsAt}</strong>
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={handleRenew}>
                Pay / renew with mock Razorpay
              </button>
              {membership.status !== 'GRACE' && (
                <button
                  className="btn btn-secondary"
                  style={{ margin: '14px 0 0 8px' }}
                  onClick={() => {
                    const result = failProviderMembershipRenewal(provider.id);
                    setFeedback(
                      result.success
                        ? 'Mock renewal failure recorded; your grace period has started.'
                        : result.error || 'Could not record renewal failure.',
                    );
                  }}
                >
                  Simulate failed renewal
                </button>
              )}
              <h3 style={{ marginTop: 18, fontWeight: 800 }}>Invoices</h3>
              {!membership.invoices.length && <p>No invoices yet.</p>}
              {membership.invoices.map((invoice) => (
                <div key={invoice.id} style={{ padding: '8px 0', borderTop: '1px solid #e2e8f0' }}>
                  {invoice.invoiceNumber} · ₹{invoice.amount} ·{' '}
                  {new Date(invoice.paidAt).toLocaleDateString()}
                </div>
              ))}
            </>
          ) : (
            <>
              <p>This provider profile has no membership record. Available monthly plans:</p>
              {providerPlans
                .filter((plan) => plan.isActive)
                .map((plan) => (
                  <div key={plan.id}>
                    {plan.name} · ₹{plan.monthlyFee}/month · {plan.trialDays}-day free trial
                  </div>
                ))}
            </>
          )}
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 14 }}>
            TRIAL, ACTIVE and GRACE memberships remain eligible for dispatch. LAPSED plans are
            excluded from new matches; accepted orders remain honored.
          </p>
        </div>
      )}
    </section>
  );
}
