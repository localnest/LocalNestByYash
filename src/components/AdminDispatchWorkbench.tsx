'use client';

import React, { useMemo, useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { anonymizeFeedbackComment } from '@/lib/dispatchUtils';
import type { Category, CategoryMatching } from '@/lib/types';

export default function AdminDispatchWorkbench() {
  const {
    categories,
    updateCategoryFlags,
    serviceTypes,
    updateServiceType,
    addServiceType,
    jobRequests,
    providers,
    providerMemberships,
    providerPlans,
    updateProviderPlan,
    updateProviderMembership,
    dispatchTimeoutMinutes,
    updateDispatchTimeout,
    reviews,
    moderateReview,
    expireJobRequest,
    leadQuotes,
  } = useMarketplace();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [timeout, setTimeout] = useState(dispatchTimeoutMinutes);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [message, setMessage] = useState('');
  const acceptanceRate = jobRequests.length
    ? Math.round(
        (jobRequests.filter((job) => job.status === 'CLAIMED').length / jobRequests.length) * 100,
      )
    : 0;
  const averageAcceptanceMinutes = useMemo(() => {
    const accepted = jobRequests.filter((job) => job.claimedAt);
    if (!accepted.length) return 0;
    return Math.round(
      accepted.reduce(
        (total, job) =>
          total + (new Date(job.claimedAt!).getTime() - new Date(job.createdAt).getTime()) / 60000,
        0,
      ) / accepted.length,
    );
  }, [jobRequests]);
  const membershipRevenue = providerMemberships
    .filter((membership) => membership.status === 'ACTIVE')
    .reduce((sum, membership) => sum + membership.monthlyFee, 0);
  const pendingJobs = jobRequests.filter(
    (job) => job.status === 'OPEN' || job.status === 'EXPIRED',
  );

  const saveCategory = () => {
    if (!editingCategory) return;
    updateCategoryFlags(editingCategory.id, editingCategory);
    setEditingCategory(null);
    setMessage('Category configuration saved.');
  };

  const addCatalogType = () => {
    const name = newServiceName.trim();
    const category = categories.find((item) => item.id === newServiceCategory);
    if (!name || !category) return;
    addServiceType({
      categoryId: category.id,
      name,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
      description: 'Admin-managed platform service rate card',
      pricingModel: 'FIXED',
      basePrice: 0,
      estimatedDurationMinutes: 60,
      availableTasks: [],
      isActive: true,
    });
    setNewServiceName('');
    setMessage('Service type added.');
  };

  const extendMembership = (providerId: string, status: 'ACTIVE' | 'TRIAL') => {
    const membership = providerMemberships.find((item) => item.providerId === providerId);
    if (!membership) return;
    const date = new Date();
    if (status === 'TRIAL') date.setDate(date.getDate() + 60);
    else {
      const end = new Date(`${membership.currentBillingPeriodEnd}T00:00:00`);
      end.setDate(end.getDate() + 30);
      date.setTime(end.getTime());
    }
    updateProviderMembership(
      providerId,
      status === 'TRIAL'
        ? { status, trialEndsAt: date.toISOString().slice(0, 10) }
        : { status, currentBillingPeriodEnd: date.toISOString().slice(0, 10) },
    );
    setMessage(`${status === 'TRIAL' ? 'Trial extended' : 'One month waived'} for provider.`);
  };

  const patchMatching = (matching: string) => {
    if (editingCategory)
      setEditingCategory({ ...editingCategory, matching: matching as CategoryMatching });
  };

  return (
    <main className="container" style={{ paddingTop: 20, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 24, fontWeight: 850 }}>Dispatch operations & monetization</h1>
      <p style={{ color: '#64748b', margin: '4px 0 16px' }}>
        Control category routing, platform catalogs, timeout rules, memberships, and feedback
        moderation.
      </p>
      {message && (
        <p role="status" className="card" style={{ marginBottom: 14 }}>
          {message}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div className="card">
          <span className="form-label">Dispatch acceptance rate</span>
          <strong>{acceptanceRate}%</strong>
        </div>
        <div className="card">
          <span className="form-label">Average time to accept</span>
          <strong>{averageAcceptanceMinutes} min</strong>
        </div>
        <div className="card">
          <span className="form-label">Monthly membership revenue</span>
          <strong>₹{membershipRevenue.toLocaleString()}</strong>
        </div>
        <div className="card">
          <span className="form-label">Open / expired requests</span>
          <strong>{pendingJobs.length}</strong>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 10 }}>Category monetization and matching</h2>
        {categories.map((category) => (
          <div
            key={category.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(170px,1fr) auto auto auto',
              gap: 8,
              alignItems: 'center',
              padding: '9px 0',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>{category.name}</strong>
            <span>
              {category.monetization} · {category.matching}
            </span>
            <span>
              {category.monetization === 'COMMISSION'
                ? `${category.flatCommissionRate ?? 10}% commission`
                : `₹${category.membershipMonthlyFee ?? 0}/mo`}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setEditingCategory({ ...category })}
            >
              Edit
            </button>
          </div>
        ))}
        {editingCategory && (
          <div style={{ marginTop: 14, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
            <h3 style={{ fontWeight: 800 }}>{editingCategory.name}</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
                gap: 10,
              }}
            >
              <label className="form-label">
                Monetization
                <select
                  className="form-input"
                  value={editingCategory.monetization}
                  onChange={(event) =>
                    setEditingCategory({
                      ...editingCategory,
                      monetization: event.target.value as Category['monetization'],
                    })
                  }
                >
                  <option value="COMMISSION">Commission</option>
                  <option value="MEMBERSHIP">Membership</option>
                </select>
              </label>
              <label className="form-label">
                Matching
                <select
                  className="form-input"
                  value={editingCategory.matching}
                  onChange={(event) => patchMatching(event.target.value)}
                >
                  <option value="DISPATCH">Dispatch</option>
                  <option value="LEAD_QUOTE">Lead / quote</option>
                  <option value="BROWSE_ORDER">Browse / order</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                </select>
              </label>
              {editingCategory.monetization === 'COMMISSION' ? (
                <label className="form-label">
                  Flat commission %
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    value={editingCategory.flatCommissionRate ?? 10}
                    onChange={(event) =>
                      setEditingCategory({
                        ...editingCategory,
                        flatCommissionRate: Number(event.target.value),
                      })
                    }
                  />
                </label>
              ) : (
                <label className="form-label">
                  Monthly membership ₹
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={editingCategory.membershipMonthlyFee ?? 499}
                    onChange={(event) =>
                      setEditingCategory({
                        ...editingCategory,
                        membershipMonthlyFee: Number(event.target.value),
                      })
                    }
                  />
                </label>
              )}
              {editingCategory.matching === 'SUBSCRIPTION' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingCategory.supportsOneOffDispatch)}
                    onChange={(event) =>
                      setEditingCategory({
                        ...editingCategory,
                        supportsOneOffDispatch: event.target.checked,
                      })
                    }
                  />
                  Also offer one-off dispatch bookings
                </label>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={editingCategory.isActive !== false}
                  onChange={(event) =>
                    setEditingCategory({ ...editingCategory, isActive: event.target.checked })
                  }
                />{' '}
                Active
              </label>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 10 }}
              onClick={saveCategory}
            >
              Save category
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ margin: '10px 0 0 8px' }}
              onClick={() => setEditingCategory(null)}
            >
              Discard
            </button>
          </div>
        )}
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 10 }}>Service catalog and flat rate tables</h2>
        {serviceTypes.map((service) => (
          <ServiceRateEditor
            key={service.id}
            service={service}
            onSave={(updates) => updateServiceType(service.id, updates)}
          />
        ))}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginTop: 14 }}
        >
          <input
            className="form-input"
            placeholder="New service type name"
            value={newServiceName}
            onChange={(event) => setNewServiceName(event.target.value)}
          />
          <select
            className="form-input"
            value={newServiceCategory}
            onChange={(event) => setNewServiceCategory(event.target.value)}
          >
            <option value="">Choose category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={addCatalogType}>
            Add catalog entry
          </button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800 }}>Dispatch timeout</h2>
        <p style={{ color: '#64748b' }}>
          Open jobs expire and mock escrow is refunded as wallet credit if unclaimed.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <input
            className="form-input"
            style={{ maxWidth: 120 }}
            type="number"
            min="10"
            max="15"
            value={timeout}
            onChange={(event) => setTimeout(Number(event.target.value))}
          />
          <span>minutes</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const result = updateDispatchTimeout(timeout);
              setMessage(
                result.success
                  ? 'Timeout setting saved (allowed range: 10–15 minutes).'
                  : result.error || 'Timeout setting could not be saved.',
              );
            }}
          >
            Save
          </button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 10 }}>Unclaimed / expired job monitor</h2>
        {pendingJobs.map((job) => (
          <div key={job.id} style={{ padding: '10px 0', borderTop: '1px solid #e2e8f0' }}>
            <strong>{job.jobNumber}</strong> · {job.serviceTypeName} · {job.societyName} ·{' '}
            {job.status} · {job.notifiedProviderIds.length} notified
            {job.status === 'OPEN' && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 10 }}
                onClick={() => {
                  expireJobRequest(job.id);
                  setMessage('Expiry checked.');
                }}
              >
                Expire if due
              </button>
            )}
            {job.status === 'EXPIRED' && <span> · refund / retry offered</span>}
          </div>
        ))}
        <p style={{ marginTop: 8 }}>
          Lead quotes in platform: {leadQuotes.length} (maximum 3 responses per request).
        </p>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 10 }}>
          Provider memberships and manual adjustments
        </h2>
        {providerPlans.map((plan) => (
          <div
            key={plan.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 130px 100px',
              gap: 8,
              padding: '8px 0',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>
              {plan.name} · {plan.trialDays}-day trial · {plan.gracePeriodDays}-day grace
            </strong>
            <label>
              ₹
              <input
                aria-label={`${plan.name} monthly fee`}
                type="number"
                min="0"
                value={plan.monthlyFee}
                onChange={(event) =>
                  updateProviderPlan(plan.id, { monthlyFee: Number(event.target.value) })
                }
              />
            </label>
            <span>₹{plan.monthlyFee}/mo</span>
          </div>
        ))}
        {providerMemberships.map((membership) => {
          const provider = providers.find((item) => item.id === membership.providerId);
          return (
            <div key={membership.id} style={{ padding: '9px 0', borderTop: '1px solid #e2e8f0' }}>
              <strong>{provider?.businessName || membership.providerId}</strong> ·{' '}
              {membership.status} · renews {membership.currentBillingPeriodEnd}
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 10 }}
                onClick={() => extendMembership(membership.providerId, 'TRIAL')}
              >
                Waive / extend trial
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 6 }}
                onClick={() => extendMembership(membership.providerId, 'ACTIVE')}
              >
                Waive 30 days
              </button>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2 style={{ fontWeight: 800, marginBottom: 10 }}>Resident review moderation</h2>
        {!reviews.length && <p>No review comments to moderate.</p>}
        {reviews.map((review) => (
          <div key={review.id} style={{ padding: '9px 0', borderTop: '1px solid #e2e8f0' }}>
            <div>
              Rating {review.rating}/5 ·{' '}
              {anonymizeFeedbackComment(review.comment, [
                review.customerName,
                providers.find((provider) => provider.id === review.providerId)?.businessName || '',
              ])}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 6 }}
              onClick={() => moderateReview(review.id)}
            >
              Remove feedback
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}

function ServiceRateEditor({
  service,
  onSave,
}: {
  service: ReturnType<typeof useMarketplace>['serviceTypes'][number];
  onSave: (updates: Partial<typeof service>) => void;
}) {
  const [price, setPrice] = useState(service.basePrice);
  const [duration, setDuration] = useState(service.estimatedDurationMinutes);
  const [taskPrices, setTaskPrices] = useState(
    service.availableTasks.map((task) => task.basePrice),
  );
  const [sizeBandPrices, setSizeBandPrices] = useState(
    (service.sizeBands || []).map((band) => band.price),
  );
  const [sizeBandMinutes, setSizeBandMinutes] = useState(
    (service.sizeBands || []).map((band) => band.minutes),
  );
  return (
    <div style={{ borderTop: '1px solid #e2e8f0', padding: '10px 0' }}>
      <strong>{service.name}</strong> · {service.pricingModel}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
          gap: 8,
          marginTop: 8,
        }}
      >
        <label className="form-label">
          Base rate ₹
          <input
            className="form-input"
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
        <label className="form-label">
          Estimated minutes
          <input
            className="form-input"
            type="number"
            min="1"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          />
        </label>
        {service.availableTasks.map((task, index) => (
          <label className="form-label" key={task.id}>
            {task.name} ₹
            <input
              className="form-input"
              type="number"
              min="0"
              value={taskPrices[index]}
              onChange={(event) =>
                setTaskPrices((values) =>
                  values.map((value, i) => (i === index ? Number(event.target.value) : value)),
                )
              }
            />
          </label>
        ))}
        {(service.sizeBands || []).map((band, index) => (
          <label className="form-label" key={band.label}>
            {band.label} price ₹
            <input
              className="form-input"
              type="number"
              min="0"
              value={sizeBandPrices[index]}
              onChange={(event) =>
                setSizeBandPrices((values) =>
                  values.map((value, i) => (i === index ? Number(event.target.value) : value)),
                )
              }
            />
          </label>
        ))}
        {(service.sizeBands || []).map((band, index) => (
          <label className="form-label" key={`${band.label}-minutes`}>
            {band.label} duration min
            <input
              className="form-input"
              type="number"
              min="1"
              value={sizeBandMinutes[index]}
              onChange={(event) =>
                setSizeBandMinutes((values) =>
                  values.map((value, i) => (i === index ? Number(event.target.value) : value)),
                )
              }
            />
          </label>
        ))}
      </div>
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginTop: 8 }}
        onClick={() =>
          onSave({
            basePrice: price,
            estimatedDurationMinutes: duration,
            availableTasks: service.availableTasks.map((task, index) => ({
              ...task,
              basePrice: taskPrices[index],
            })),
            sizeBands: service.sizeBands?.map((band, index) => ({
              ...band,
              price: sizeBandPrices[index],
              minutes: sizeBandMinutes[index],
            })),
          })
        }
      >
        Save rate table
      </button>
    </div>
  );
}
