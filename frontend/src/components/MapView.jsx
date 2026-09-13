import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigation } from 'lucide-react';

export const MapView = ({ customerLocation, workers = [] }) => {
  const { t } = useAuth();

  return (
    <div
      style={{
        width: '100%',
        height: '240px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1rem'
      }}
    >
      {/* Map Grid Lines SVG Overlay */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15, pointerEvents: 'none' }}
      >
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#fff" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="50%" cy="50%" r="40" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="50%" cy="50%" r="80" fill="none" stroke="#ea580c" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Map Overlay Header */}
      <div style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.3rem 0.75rem', borderRadius: '20px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Navigation size={13} color="#ea580c" /> {t('map_title')}
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          {workers.length} {t('verified_workers_online')}
        </span>
      </div>

      {/* Visual Pins Representation */}
      <div style={{ zIndex: 10, position: 'relative', width: '100%', height: '120px' }}>
        {/* Customer Pin in Center */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              background: '#ef4444',
              borderRadius: '50%',
              margin: '0 auto',
              boxShadow: '0 0 15px #ef4444',
              border: '3px solid #fff'
            }}
          />
          <span style={{ fontSize: '0.75rem', background: '#dc2626', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
            {t('you_customer')}
          </span>
        </div>

        {/* Worker Pins clustered around */}
        {workers.slice(0, 5).map((w, idx) => {
          const angles = [45, 120, 210, 300, 340];
          const dists = [45, 65, 50, 70, 55];
          const angle = angles[idx % angles.length];
          const dist = dists[idx % dists.length];
          const x = 50 + Math.cos((angle * Math.PI) / 180) * (dist / 2);
          const y = 50 + Math.sin((angle * Math.PI) / 180) * (dist / 2);

          return (
            <div
              key={w.worker_id || idx}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}
              title={`${w.full_name} (${w.distance_km} km)`}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  background: '#ea580c',
                  borderRadius: '50%',
                  margin: '0 auto',
                  boxShadow: '0 0 10px #ea580c',
                  border: '2px solid #fff'
                }}
              />
              <span style={{ fontSize: '0.65rem', background: 'rgba(15, 23, 42, 0.85)', color: '#f8fafc', padding: '0.1rem 0.3rem', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                {w.full_name?.split(' ')[0]} ({w.distance_km}km)
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ zIndex: 10, fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right' }}>
        {t('map_footer')}
      </div>
    </div>
  );
};
