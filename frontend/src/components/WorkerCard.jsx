import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Star, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export const WorkerCard = ({ worker, onSelect, isEmergency }) => {
  const { t } = useAuth();

  return (
    <div className={`card card-hover ${isEmergency ? 'border-red-500' : ''}`} style={{ position: 'relative' }}>
      {/* Top verified cooperative tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span className="badge badge-VERIFIED">
          <ShieldCheck size={13} /> {t('verified_coop_worker')}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
          {worker.distance_km} {t('km_away')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: '700',
            color: '#1e293b',
            border: '2px solid #ea580c',
            flexShrink: 0
          }}
        >
          {worker.full_name ? worker.full_name.charAt(0) : 'W'}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>{worker.full_name}</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.1rem 0' }}>
            {worker.society_name}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#d97706', fontWeight: 700 }}>
              <Star size={14} fill="#d97706" /> {worker.average_rating}
            </span>
            <span style={{ color: '#64748b' }}>• {worker.years_of_experience} {t('yrs_exp')}</span>
            <span style={{ color: '#64748b' }}>• {worker.total_completed_jobs} {t('jobs')}</span>
          </div>
        </div>
      </div>

      {/* Match Score & Fair Work Allocation breakdown */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '0.6rem',
          margin: '0.8rem 0',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            {t('smart_match_score')}:
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ea580c' }}>
            {worker.match_score}%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.7rem' }}>
          <div className="score-pill">
            {t('proximity')}: <span className="score-num">{worker.breakdown?.distance_score}%</span>
          </div>
          <div className="score-pill">
            {t('fairness_boost')}: <span className="score-num" style={{ color: '#16a34a' }}>+{worker.breakdown?.fairness_score}%</span>
          </div>
        </div>
      </div>

      {/* Skills list */}
      {worker.skills && worker.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.8rem' }}>
          {worker.skills.slice(0, 3).map((sk, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.7rem',
                background: '#eff6ff',
                color: '#1d4ed8',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                fontWeight: 500
              }}
            >
              {t(sk)}
            </span>
          ))}
        </div>
      )}

      {/* Book button */}
      <button
        className={`btn ${isEmergency ? 'btn-emergency' : 'btn-primary'}`}
        style={{ width: '100%' }}
        onClick={() => onSelect(worker)}
      >
        {isEmergency ? <Zap size={16} /> : <CheckCircle2 size={16} />}
        {isEmergency ? t('book_emergency_worker') : t('book_worker')}
      </button>
    </div>
  );
};
