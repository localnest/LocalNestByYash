'use client';

import React, { useState } from 'react';
import { Star, ShieldCheck, MessageCircle } from 'lucide-react';
import type { Review } from '@/lib/types';

interface Props {
  myReviews: Review[];
  dynamicRating: number;
  categoryName?: string;
  businessName: string;
  onRespondToReview: (reviewId: string, replyText: string) => { success: boolean; message: string };
}

export default function ProviderReviewsTab({
  myReviews,
  dynamicRating,
  categoryName = 'Services',
  businessName,
  onRespondToReview,
}: Props) {
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');

  const totalReviewsCount = myReviews.length;
  const fiveStarCount = myReviews.filter((r) => r.rating === 5).length;
  const fiveStarPct =
    totalReviewsCount > 0 ? Math.round((fiveStarCount / totalReviewsCount) * 100) : 100;
  const respondedCount = myReviews.filter((r) => Boolean(r.providerResponse)).length;
  const responsePct =
    totalReviewsCount > 0 ? Math.round((respondedCount / totalReviewsCount) * 100) : 0;

  // Praise tags aggregation
  const tagCounts: Record<string, number> = {};
  myReviews.forEach((r) => {
    r.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) {
      setReplyError('Please enter a response message.');
      return;
    }
    const res = onRespondToReview(reviewId, replyText.trim());
    if (res.success) {
      setReplyingReviewId(null);
      setReplyText('');
      setReplyError('');
    } else {
      setReplyError(res.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          Resident Reviews & Society Reputation
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Verified feedback from gated society residents who booked your services. Higher ratings
          boost your visibility in society listings.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>OVERALL RATING</span>
            <Star size={18} fill="#f59e0b" color="#f59e0b" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#b45309',
              marginTop: '6px',
            }}
          >
            ★ {dynamicRating}{' '}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              / 5.0
            </span>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent-emerald)',
              marginTop: '2px',
              fontWeight: 600,
            }}
          >
            Top Rated in {categoryName}
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>TOTAL REVIEWS</span>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              marginTop: '6px',
            }}
          >
            {totalReviewsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            100% Verified Purchases
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>5-STAR SATISFACTION</span>
            <Star size={18} color="#10b981" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#059669',
              marginTop: '6px',
            }}
          >
            {fiveStarPct}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {fiveStarCount} of {totalReviewsCount} rated 5 stars
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>RESPONSE RATE</span>
            <MessageCircle size={18} color="var(--primary)" />
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: 'var(--primary)',
              marginTop: '6px',
            }}
          >
            {responsePct}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {respondedCount} reviews replied to
          </div>
        </div>
      </div>

      {/* Praise Badges Earned */}
      {sortedTags.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Star size={15} fill="#f59e0b" color="#f59e0b" /> Praise Badges Earned From Neighbors
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sortedTags.map(([tag, count]) => (
              <div
                key={tag}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(16,185,129,0.08) 100%)',
                  border: '1.5px solid rgba(13,148,136,0.25)',
                  borderRadius: '24px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tag}</span>
                <span
                  style={{
                    background: '#0f766e',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>
          Resident Testimonials ({myReviews.length})
        </h3>

        {myReviews.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Star size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
              No Resident Reviews Yet
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Complete pending bookings to receive verified ratings from society residents.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myReviews.map((rev) => {
              const initial = rev.customerName?.charAt(0).toUpperCase() || 'R';
              const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const isReplying = replyingReviewId === rev.id;

              return (
                <div
                  key={rev.id}
                  className="card"
                  style={{
                    padding: '18px 20px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                        }}
                      >
                        {initial}
                      </div>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <strong style={{ fontSize: '0.95rem' }}>{rev.customerName}</strong>
                          {rev.customerFlat && (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-main)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}
                            >
                              {rev.customerFlat}
                            </span>
                          )}
                          <span
                            style={{
                              color: 'var(--accent-emerald)',
                              fontSize: '0.7rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={13} /> Verified Order
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          📍 {rev.societyName || 'Greenfield Heights'} • {formattedDate}
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          fill={s <= rev.rating ? '#f59e0b' : 'none'}
                          color="#f59e0b"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Service Title */}
                  {rev.serviceName && (
                    <div
                      style={{
                        marginTop: '10px',
                        fontSize: '0.78rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      Service: {rev.serviceName}
                    </div>
                  )}

                  {/* Tags */}
                  {rev.tags && rev.tags.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px',
                      }}
                    >
                      {rev.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: '0.72rem',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '3px 8px',
                            borderRadius: '14px',
                            color: '#334155',
                            fontWeight: 600,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Comment */}
                  <p
                    style={{
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      marginTop: '10px',
                      margin: '10px 0 0',
                    }}
                  >
                    &quot;{rev.comment}&quot;
                  </p>

                  {/* Existing Provider Response */}
                  {rev.providerResponse && (
                    <div
                      style={{
                        marginTop: '14px',
                        background: 'var(--bg-subtle)',
                        borderLeft: '3px solid var(--primary)',
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <strong
                          style={{
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          💬 Your Response ({businessName})
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(rev.providerResponse.respondedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#334155', lineHeight: 1.45 }}>
                        {rev.providerResponse.comment}
                      </p>
                    </div>
                  )}

                  {/* Reply Action / Form */}
                  {!rev.providerResponse && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-light)',
                      }}
                    >
                      {!isReplying ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingReviewId(rev.id);
                            setReplyText('');
                            setReplyError('');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <MessageCircle size={13} /> Reply to Resident
                        </button>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            background: 'var(--bg-subtle)',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                            Write a polite response to {rev.customerName}:
                          </label>
                          <textarea
                            value={replyText}
                            onChange={(e) => {
                              setReplyText(e.target.value);
                              setReplyError('');
                            }}
                            rows={2}
                            className="form-input"
                            placeholder="Thank you for your feedback! We look forward to serving your household again..."
                            style={{ fontSize: '0.82rem' }}
                          />
                          {replyError && (
                            <div style={{ color: 'var(--accent-rose)', fontSize: '0.75rem' }}>
                              {replyError}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleSendReply(rev.id)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              Publish Reply
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingReviewId(null);
                                setReplyText('');
                                setReplyError('');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.78rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
