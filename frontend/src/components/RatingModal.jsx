import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Star } from 'lucide-react';

export const RatingModal = ({ booking, onClose, onSubmit }) => {
  const { t } = useAuth();
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      booking_id: booking.id,
      rating_score: ratingScore,
      review_text: reviewText
    });
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{t('rate_worker_service')}</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Booking #{booking.booking_number} • {booking.worker_name || 'Worker'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
              {t('satisfied_question')}
            </label>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transform: star <= ratingScore ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Star
                    size={36}
                    fill={star <= ratingScore ? '#d97706' : '#e2e8f0'}
                    color={star <= ratingScore ? '#b45309' : '#cbd5e1'}
                  />
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ea580c', marginTop: '0.5rem' }}>
              {ratingScore === 5 && 'Outstanding Performance! ⭐⭐⭐⭐⭐'}
              {ratingScore === 4 && 'Very Good Service! ⭐⭐⭐⭐'}
              {ratingScore === 3 && 'Average Experience ⭐⭐⭐'}
              {ratingScore === 2 && 'Needs Improvement ⭐⭐'}
              {ratingScore === 1 && 'Unsatisfactory ⭐'}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
              {t('written_feedback')}
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Punctuality, politeness, safety equipment used, overall work quality..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
              {submitting ? 'Submitting Rating...' : t('submit_rating')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
