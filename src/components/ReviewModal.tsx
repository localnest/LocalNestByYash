'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/lib/store';
import { Order } from '@/lib/types';
import { Star, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReviewModalProps {
  order: Order;
  onClose: () => void;
}

export default function ReviewModal({ order, onClose }: ReviewModalProps) {
  const { submitReview } = useMarketplace();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please write a brief comment describing your experience.');
      return;
    }

    const res = submitReview(order.id, order.providerId, rating, comment);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Review & Rate Provider</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle size={44} color="var(--accent-emerald)" style={{ margin: '0 auto 12px' }} />
            <h4>Review Published!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              Your verified review helps fellow society residents make trusted choices.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{order.providerName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Order #{order.orderNumber} • {order.serviceName}
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                How was your experience?
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(rating)}
                    style={{ padding: '4px', transition: 'transform 0.15s ease' }}
                  >
                    <Star 
                      size={32} 
                      fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'} 
                      color={(hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1'} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="form-label">Feedback for society neighbors:</label>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setErrorMsg('');
                }}
                rows={4}
                className="form-input"
                placeholder="Was the provider punctual? Did they wear covers? How was the service quality?"
                required
              />
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              Verified Order Badge will be attached to your review
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              Submit Review
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
