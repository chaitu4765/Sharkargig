import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WorkerCard } from '../components/WorkerCard';
import { BookingModal } from '../components/BookingModal';
import { PaymentGatewayModal } from '../components/PaymentGatewayModal';
import { InvoiceModal } from '../components/InvoiceModal';
import { RatingModal } from '../components/RatingModal';
import { MapView } from '../components/MapView';
import { Search, Zap, ShieldCheck, CreditCard, Star, FileText } from 'lucide-react';

export const CustomerDashboard = () => {
  const { user, token, t } = useAuth();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [matchedWorkers, setMatchedWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Modals state
  const [bookingModalWorker, setBookingModalWorker] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/services/categories');
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchServices = async () => {
    try {
      let url = '/api/services?';
      if (selectedCategory) url += `category_id=${selectedCategory}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (isEmergency) url += `emergency=true&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
        if (data.services.length > 0 && !selectedService) {
          setSelectedService(data.services[0]);
        }
      }
    } catch (err) {
      console.error('Fetch services error:', err);
    }
  };

  const fetchMatchedWorkers = async (serviceId) => {
    if (!serviceId) return;
    setLoadingWorkers(true);
    try {
      const res = await fetch(`/api/workers/match?service_id=${serviceId}&is_emergency=${isEmergency}`);
      const data = await res.json();
      if (data.success) {
        setMatchedWorkers(data.workers);
      }
    } catch (err) {
      console.error('Match workers error:', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchMyBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchMyBookings();
  }, [token]);

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, searchQuery, isEmergency]);

  useEffect(() => {
    if (selectedService) {
      fetchMatchedWorkers(selectedService.id);
    }
  }, [selectedService, isEmergency]);

  const handleCreateBooking = async (bookingData) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      if (data.success) {
        setShowBookingModal(false);
        fetchMyBookings();
        setActiveTab('bookings');
        alert(`Booking #${data.booking.booking_number} created successfully! Worker notified.`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Create booking failed:', err);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    const bId = paymentModalBooking?.id;
    setPaymentModalBooking(null);
    await fetchMyBookings();
    if (bId) {
      handleFetchInvoice(bId);
    }
  };

  const handleFetchInvoice = async (bookingId) => {
    try {
      const res = await fetch(`/api/payments/invoice/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedInvoice(data.invoice);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Invoice fetch error:', err);
    }
  };

  const handleSubmitRating = async (ratingData) => {
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ratingData)
      });
      const data = await res.json();
      if (data.success) {
        setRatingBooking(null);
        fetchMyBookings();
        alert('Thank you! Rating submitted successfully.');
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Rating error:', err);
    }
  };

  return (
    <div className="main-content">
      {/* Top Banner Notice */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0f172a, #1e293b)',
          color: '#fff',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck color="#ea580c" size={20} />
            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>
              {t('marketplace_title')}
            </h2>
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            {t('fair_work_notice')}
          </p>
        </div>

        {/* Emergency Priority Toggle Button */}
        <button
          className={`btn ${isEmergency ? 'btn-emergency' : 'btn-outline'}`}
          style={{ color: isEmergency ? '#fff' : '#ef4444', borderColor: '#ef4444' }}
          onClick={() => setIsEmergency(!isEmergency)}
        >
          <Zap size={18} />
          {isEmergency ? t('emergency_mode_active') : t('toggle_emergency_priority')}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          {t('browse_search_services')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          {t('my_bookings_history')} ({bookings.length})
        </button>
      </div>

      {/* TAB 1: BROWSE & MATCH WORKERS */}
      {activeTab === 'browse' && (
        <div>
          {/* Search bar & Category filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">{t('all_service_categories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Service Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedService(s)}
                style={{
                  background: selectedService?.id === s.id ? '#ea580c' : '#fff',
                  color: selectedService?.id === s.id ? '#fff' : '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedService?.id === s.id ? '0 2px 8px rgba(234, 88, 12, 0.3)' : 'none'
                }}
              >
                {t(s.name)} • ₹{s.base_price}
              </button>
            ))}
          </div>

          {/* Geospatial Map Visualizer */}
          <div style={{ marginBottom: '1.5rem' }}>
            <MapView customerLocation={{ lat: 17.4325, lng: 78.4071 }} workers={matchedWorkers} />
          </div>

          {/* Service Header & Selected Worker Candidates */}
          {selectedService && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                {t('verified_coop_workers_for')} {t(selectedService.name)}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {t('sorted_by_matching')}
              </p>
            </div>
          )}

          {loadingWorkers ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              {t('searching_workers')}
            </p>
          ) : matchedWorkers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#64748b' }}>{t('no_workers_found')}</p>
            </div>
          ) : (
            <div className="grid-3">
              {matchedWorkers.map((w) => (
                <WorkerCard
                  key={w.worker_id}
                  worker={w}
                  isEmergency={isEmergency}
                  onSelect={(worker) => {
                    setBookingModalWorker(worker);
                    setShowBookingModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKINGS & LIVE TRACKING */}
      {activeTab === 'bookings' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{t('my_bookings_tracker')}</h3>

          {bookings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#64748b' }}>{t('no_bookings_found')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookings.map((b) => (
                <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c' }}>
                        #{b.booking_number}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', margin: '0.1rem 0' }}>{t(b.service_name)}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                        {b.society_name} • {b.scheduled_date} at {b.scheduled_time}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge badge-${b.status}`}>
                        {t(b.status)}
                      </span>
                      {b.is_emergency === 1 && <span className="badge badge-EMERGENCY">{t('EMERGENCY')}</span>}
                    </div>
                  </div>

                  {/* Worker & Location info */}
                  <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <strong>{t('assigned_worker')}:</strong> {b.worker_name || t('finding_worker')} ({b.worker_phone || 'N/A'})
                    </div>
                    <div>
                      <strong>{t('location')}:</strong> {b.service_address}
                    </div>
                  </div>

                  {/* Action Buttons based on status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                      {t('total')}: ₹{b.total_amount}.00
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Payment Button if completed but pending payment */}
                      {b.status === 'COMPLETED' && b.payment_status === 'PENDING' && (
                        <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={() => setPaymentModalBooking(b)}>
                          <CreditCard size={16} /> Open Payment Gateway (₹{b.total_amount})
                        </button>
                      )}

                      {/* Invoice Button if paid */}
                      {b.payment_status === 'SUCCESS' && (
                        <button className="btn btn-outline" onClick={() => handleFetchInvoice(b.id)}>
                          <FileText size={16} /> {t('view_invoice')}
                        </button>
                      )}

                      {/* Rating Button if completed & paid */}
                      {b.status === 'COMPLETED' && b.payment_status === 'SUCCESS' && !b.rating && (
                        <button className="btn btn-secondary" onClick={() => setRatingBooking(b)}>
                          <Star size={16} color="#d97706" /> {t('rate_worker')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && selectedService && (
        <BookingModal
          service={selectedService}
          worker={bookingModalWorker}
          isEmergency={isEmergency}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleCreateBooking}
        />
      )}

      {/* Demo Payment Gateway Modal */}
      {paymentModalBooking && (
        <PaymentGatewayModal
          booking={paymentModalBooking}
          onClose={() => setPaymentModalBooking(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* Rating Submission Modal */}
      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSubmit={handleSubmitRating}
        />
      )}
    </div>
  );
};
