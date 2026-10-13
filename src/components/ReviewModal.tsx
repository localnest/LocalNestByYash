'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { Order } from '@/lib/types';
import { Star, X, CheckCircle, ShieldCheck, ThumbsUp } from 'lucide-react';

interface ReviewModalProps {
  order: Order;
  onClose: () => void;
}

const PRAISE_TAGS = [
  '✨ Spotless Clean',
  '⏰ On-Time Arrival',
  '🥾 Wore Shoe Covers',
  '💬 Polite & Professional',
  '⚡ Fast & Efficient',
  '💰 Honest Pricing',
  '👍 Highly Recommended',
  '👔 Careful Handling',
];

const RATING_LABELS: Record<number, { text: string; color: string; desc: string }> = {
  1: { text: 'Disappointing', color: '#ef4444', desc: 'Service did not meet expectations' },
  2: { text: 'Below Average', color: '#f97316', desc: 'Several issues experienced' },
  3: { text: 'Satisfactory', color: '#eab308', desc: 'Average service, completed standard work' },
  4: { text: 'Very Good', color: '#10b981', desc: 'Punctual and courteous, great job' },
  5: {
    text: 'Exceptional!',
    color: '#059669',
    desc: 'Outstanding quality, exceeded expectations!',
  },
};

export default function ReviewModal({ order, onClose }: ReviewModalProps) {
  const { submitReview, currentUser, t } = useMarketplace();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '✨ Spotless Clean',
    '⏰ On-Time Arrival',
  ]);
  const [comment, setComment] = useState<string>('');
  const [privacyOption, setPrivacyOption] = useState<'FULL_FLAT' | 'TOWER_ONLY' | 'ANONYMOUS'>(
    'FULL_FLAT',
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const flatNumber = order.customerFlat || currentUser?.flatNumber || 'Tower A - 402';

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg(
        'Please write a brief comment describing your experience for your society neighbors.',
      );
      return;
    }

    const res = submitReview({
      orderId: order.id,
      providerId: order.providerId,
      rating,
      comment: comment.trim(),
      tags: selectedTags,
      customerFlat: flatNumber,
      privacyOption,
    });

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setErrorMsg(res.message);
    }
  };

  const activeRating = hoverRating || rating;
  const ratingInfo = RATING_LABELS[activeRating] || RATING_LABELS[5];

  return (
    <div className="modal-overlay" onClick={onClose}>
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
            marginBottom: '14px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '12px',
            gap: '8px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t.verifiedNeighborReview}</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Your rating directly shapes verified recommendations in{' '}
              {order.societyName || 'Greenfield Heights'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close review modal"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '36px 12px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={36} color="var(--accent-emerald)" />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t.reviewSuccess}</h4>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                marginTop: '6px',
                maxWidth: '380px',
                margin: '6px auto 0',
              }}
            >
              Thank you! Your verified rating helps your neighbors at {order.societyName} choose
              dependable doorstep professionals.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            {/* Service & Provider Header Banner */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(14,165,233,0.06) 100%)',
                border: '1px solid rgba(13,148,136,0.2)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {order.providerName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {order.serviceName} • Order #{order.orderNumber}
                </div>
              </div>
              <span
                className="badge badge-emerald"
                style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ShieldCheck size={12} /> {t.verified} Order
              </span>
            </div>

            {/* Star Rating Section */}
            <div
              style={{
                textAlign: 'center',
                background: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                {t.experienceQuestion}
              </label>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                  flexWrap: 'wrap',
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(rating)}
                    style={{
                      padding: '6px',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transform: activeRating >= star ? 'scale(1.12)' : 'scale(1)',
                      transition: 'transform 0.12s ease',
                    }}
                    aria-label={`${star} star rating`}
                  >
                    <Star
                      size={32}
                      fill={activeRating >= star ? '#f59e0b' : 'none'}
                      color={activeRating >= star ? '#f59e0b' : '#cbd5e1'}
                    />
                  </button>
                ))}
              </div>

              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: ratingInfo.color,
                  marginTop: '4px',
                }}
              >
                {ratingInfo.text}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {ratingInfo.desc}
              </div>
            </div>

            {/* Quick Praise Tags */}
            <div>
              <label
                className="form-label"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}
              >
                <ThumbsUp size={14} color="var(--primary)" /> {t.whatStoodOut}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRAISE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        border: isSelected
                          ? '1.5px solid var(--primary)'
                          : '1px solid var(--border-light)',
                        background: isSelected ? 'rgba(13,148,136,0.1)' : '#fff',
                        color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Comment Box */}
            <div>
              <label className="form-label">
                {t.detailedFeedback}: <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setErrorMsg('');
                }}
                rows={3}
                className="form-input"
                placeholder={
                  rating >= 4
                    ? "Share why you'd recommend this provider to neighbors (e.g. punctuality, cleanliness, equipment)..."
                    : 'Describe what went wrong so the provider and platform can resolve it...'
                }
                required
              />
            </div>

            {/* Identity & Privacy Choice */}
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
              }}
            >
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Display My Identity As:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyOption === 'FULL_FLAT'}
                    onChange={() => setPrivacyOption('FULL_FLAT')}
                  />
                  <span>
                    <strong>{currentUser?.fullName || order.customerName}</strong> ({flatNumber})
                    <span
                      style={{
                        color: 'var(--accent-emerald)',
                        marginLeft: '6px',
                        fontSize: '0.7rem',
                      }}
                    >
                      • Highest Trust
                    </span>
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyOption === 'TOWER_ONLY'}
                    onChange={() => setPrivacyOption('TOWER_ONLY')}
                  />
                  <span>
                    <strong>{currentUser?.fullName || order.customerName}</strong> (Tower Resident)
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyOption === 'ANONYMOUS'}
                    onChange={() => setPrivacyOption('ANONYMOUS')}
                  />
                  <span>Anonymous Verified Resident (Hide name and flat)</span>
                </label>
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  color: 'var(--accent-rose)',
                  fontSize: '0.8rem',
                  background: '#ffe4e6',
                  padding: '8px 12px',
                  borderRadius: '6px',
                }}
              >
                {errorMsg}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              <span>Only residents who completed an order can leave verified reviews.</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ padding: '11px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              {t.publishReview}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
