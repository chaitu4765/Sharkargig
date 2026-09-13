import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Clock, MapPin, ShieldCheck } from 'lucide-react';

export const BookingModal = ({ service, worker, isEmergency, onClose, onConfirm }) => {
  const { t } = useAuth();
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('10:30 AM');
  const [serviceAddress, setServiceAddress] = useState(
    'Plot 42, Jubilee Hills, Road No 36, Hyderabad'
  );
  const [problemDescription, setProblemDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const basePrice = service ? service.base_price : 450;
  const emergencyFee = isEmergency ? 150 : 0;
  const totalAmount = basePrice + emergencyFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onConfirm({
      worker_id: worker ? worker.worker_id : null,
      service_id: service.id,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      service_address: serviceAddress,
      problem_description: problemDescription,
      is_emergency: isEmergency
    });
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
              {isEmergency ? t('emergency_service_booking') : t('confirm_booking')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Cooperative Verified Labour Booking
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {worker && (
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <ShieldCheck size={24} color="#ea580c" />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{worker.full_name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {worker.society_name} • {worker.distance_km} {t('km_away')}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
              {t('category')}
            </label>
            <input className="input-field" value={t(service.name)} disabled style={{ background: '#f1f5f9' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('preferred_date')}
              </label>
              <input
                type="date"
                className="input-field"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('time_slot')}
              </label>
              <select
                className="input-field"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              >
                <option>09:00 AM</option>
                <option>10:30 AM</option>
                <option>01:00 PM</option>
                <option>03:30 PM</option>
                <option>05:00 PM</option>
                <option>Immediate Dispatch (Emergency)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('service_location')}
            </label>
            <input
              className="input-field"
              value={serviceAddress}
              onChange={(e) => setServiceAddress(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
              {t('problem_description')}
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g. Main kitchen pipe leaking under sink, switchboard spark..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
            />
          </div>

          {/* Pricing summary */}
          <div style={{ background: '#fff7ed', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #ffedd5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' }}>
              <span>{t('base_service_fee')}:</span>
              <span>₹{basePrice}.00</span>
            </div>
            {isEmergency && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>
                <span>{t('emergency_dispatch_charge')}:</span>
                <span>+₹{emergencyFee}.00</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #fed7aa', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
              <span>{t('total_estimated_amount')}:</span>
              <span>₹{totalAmount}.00</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              className={`btn ${isEmergency ? 'btn-emergency' : 'btn-primary'}`}
              style={{ flex: 2 }}
              disabled={submitting}
            >
              {submitting ? 'Creating Booking...' : isEmergency ? t('confirm_dispatch') : t('confirm_booking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
