import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CheckCircle, DollarSign, Award, HeartPulse, BookOpen, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../api';

export const WorkerDashboard = () => {
  const { user, token, t, getStoredBookings, updateStoredBookingStatus } = useAuth();
  const [workerProfile, setWorkerProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  const mergeWorkerJobs = (apiJobs = []) => {
    const local = getStoredBookings();
    const map = new Map();

    // Add API jobs
    apiJobs.forEach((j) => {
      map.set(String(j.id), j);
      if (j.booking_number) map.set(j.booking_number, j);
    });

    // Add relevant local jobs for this worker
    const currentWorkerId = workerProfile?.id || (user?.role === 'worker' ? 1 : null);
    const currentUserId = user?.id;

    local.forEach((j) => {
      const isForThisWorker =
        !j.worker_id ||
        String(j.worker_id) === String(currentWorkerId) ||
        String(j.worker_id) === String(currentUserId) ||
        (j.worker_name && j.worker_name.toLowerCase().includes('ravi')) ||
        (j.society_name && j.society_name.toLowerCase().includes('hyderabad'));

      if (isForThisWorker) {
        const key = String(j.id || j.booking_number);
        const existing = map.get(key) || map.get(j.booking_number);
        if (existing) {
          map.set(key, { ...existing, ...j });
        } else {
          map.set(key, j);
        }
      }
    });

    const combined = Array.from(new Set(map.values()));
    combined.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));
    return combined;
  };

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/workers/me/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWorkerProfile(data.worker);
        setIsAvailable(data.worker.is_available === 1);
      }
    } catch (err) {
      console.error('Fetch worker profile error:', err);
    }
  };

  const fetchJobs = async () => {
    let apiJobs = [];
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          apiJobs = data.bookings;
        }
      } catch (err) {
        console.error('Fetch worker jobs error:', err);
      }
    }
    setJobs(mergeWorkerJobs(apiJobs));
  };

  const fetchEarnings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/workers/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEarnings(data);
      }
    } catch (err) {
      console.error('Fetch earnings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchJobs();
    fetchEarnings();

    const handleSync = () => {
      fetchJobs();
    };
    window.addEventListener('sahakar_booking_updated', handleSync);
    return () => window.removeEventListener('sahakar_booking_updated', handleSync);
  }, [token]);

  const handleToggleAvailability = async () => {
    try {
      const nextState = !isAvailable;
      const res = await fetch(`${API_BASE}/api/workers/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_available: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setIsAvailable(nextState);
        alert(data.message);
      }
    } catch (err) {
      console.error('Toggle availability error:', err);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    // Update local storage status immediately so UI updates and persists across refreshes
    updateStoredBookingStatus(bookingId, newStatus);

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
          console.log(`Backend booking #${bookingId} status updated to ${newStatus}`);
        }
      } catch (err) {
        console.warn('Backend status update offline fallback engaged:', err);
      }
    }

    fetchJobs();
    fetchEarnings();
    alert(`Booking status updated to ${newStatus.replace(/_/g, ' ')}.`);
  };

  const handleTriggerSOS = async (bookingId) => {
    if (!window.confirm('Are you sure you want to trigger an EMERGENCY SOS ALERT? This will immediately alert your Cooperative Safety Desk.')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/workers/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id: bookingId })
      });
      const data = await res.json();
      if (data.success) {
        alert('🚨 SOS ALERT SENT! Cooperative Admin & Safety Patrol have been notified with your location.');
      }
    } catch (err) {
      console.error('SOS Error:', err);
    }
  };

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: '3rem' }}>Loading Worker Portal...</div>;
  }

  return (
    <div className="main-content">
      {/* Top Banner & Availability Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#0f172a', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="#ea580c" size={22} />
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>
                {workerProfile?.full_name || t('worker_portal')}
              </h2>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              {workerProfile?.society_name || 'Labour Cooperative Society Member'} • {t('rating')}: ⭐{workerProfile?.average_rating || 5.0}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Availability Toggle */}
            <button
              onClick={handleToggleAvailability}
              className={`btn ${isAvailable ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem' }}
            >
              {isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {t('duty_status')}: {isAvailable ? t('online_ready') : t('offline')}
            </button>

            {/* SOS Emergency Button */}
            <button className="btn btn-emergency" onClick={() => handleTriggerSOS(null)}>
              <AlertTriangle size={18} /> {t('sos_emergency')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={24} /></div>
          <div>
            <div className="kpi-val">₹{earnings?.total_earnings || 0}</div>
            <div className="kpi-lbl">{t('net_worker_earnings')}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><CheckCircle size={24} /></div>
          <div>
            <div className="kpi-val">{workerProfile?.total_completed_jobs || 0}</div>
            <div className="kpi-lbl">{t('jobs_completed')}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Award size={24} /></div>
          <div>
            <div className="kpi-val">⭐ {workerProfile?.average_rating || 5.0}</div>
            <div className="kpi-lbl">{t('member_average_rating')}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><HeartPulse size={24} /></div>
          <div>
            <div className="kpi-val" style={{ fontSize: '1rem', color: '#16a34a' }}>ACTIVE</div>
            <div className="kpi-lbl">{t('welfare_insurance')}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Jobs vs Welfare & Skills */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Job Requests & Active Tasks */}
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>{t('job_dispatch_board')} ({jobs.length})</h3>

          {jobs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              {t('no_incoming_jobs')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {jobs.map((job) => (
                <div key={job.id} className="card" style={{ borderLeft: job.is_emergency === 1 ? '4px solid #dc2626' : '4px solid #ea580c' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      {job.is_emergency === 1 && (
                        <span className="badge badge-EMERGENCY" style={{ marginBottom: '0.3rem' }}>
                          🚨 {t('emergency_priority_request')}
                        </span>
                      )}
                      <h4 style={{ fontSize: '1.1rem', margin: '0.2rem 0' }}>{t(job.service_name)}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                        Customer: <strong>{job.customer_name}</strong> ({job.customer_phone})
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                        {t('location')}: {job.service_address}
                      </p>
                    </div>

                    <span className={`badge badge-${job.status}`}>
                      {t(job.status)}
                    </span>
                  </div>

                  {job.problem_description && (
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                      <strong>Problem Notes:</strong> {job.problem_description}
                    </div>
                  )}

                  {/* Status Machine Buttons for Worker */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {t('payout')}: ₹{job.total_amount}.00
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {job.status === 'PENDING_WORKER_ACCEPTANCE' && (
                        <>
                          <button className="btn btn-secondary" onClick={() => handleStatusUpdate(job.id, 'REJECTED')}>
                            {t('reject')}
                          </button>
                          <button className="btn btn-primary" onClick={() => handleStatusUpdate(job.id, 'CONFIRMED')}>
                            {t('accept_job')}
                          </button>
                        </>
                      )}

                      {job.status === 'CONFIRMED' && (
                        <button className="btn btn-primary" onClick={() => handleStatusUpdate(job.id, 'WORKER_ON_THE_WAY')}>
                          {t('mark_on_the_way')}
                        </button>
                      )}

                      {job.status === 'WORKER_ON_THE_WAY' && (
                        <button className="btn btn-primary" onClick={() => handleStatusUpdate(job.id, 'IN_PROGRESS')}>
                          {t('start_job')}
                        </button>
                      )}

                      {job.status === 'IN_PROGRESS' && (
                        <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={() => handleStatusUpdate(job.id, 'COMPLETED')}>
                          {t('mark_completed')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Welfare, Insurance & Recommended Training */}
        <div>
          {/* Insurance Card */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <HeartPulse color="#ea580c" size={20} />
              <h4 style={{ margin: 0 }}>{t('labour_welfare_insurance')}</h4>
            </div>

            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                <span style={{ color: '#64748b' }}>{t('provider')}:</span>
                <strong>{workerProfile?.insurance?.provider || 'National Insurance Labour Scheme'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                <span style={{ color: '#64748b' }}>{t('policy_no')}:</span>
                <strong>{workerProfile?.insurance?.policy_no || 'NLC-POL-559021'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                <span style={{ color: '#64748b' }}>{t('coverage_amount')}:</span>
                <strong style={{ color: '#16a34a' }}>₹5,00,000.00</strong>
              </div>
            </div>
          </div>

          {/* Recommended Skill Training */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <BookOpen color="#ea580c" size={20} />
              <h4 style={{ margin: 0 }}>{t('recommended_skill_training')}</h4>
            </div>

            {workerProfile?.training && workerProfile.training.length > 0 ? (
              workerProfile.training.map((tr) => (
                <div key={tr.id} style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                  <strong>{tr.course_name}</strong>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                    {t('recommended_by')}: {tr.recommended_by}
                  </div>
                  <span className="badge badge-PENDING" style={{ marginTop: '0.3rem' }}>
                    {t(tr.status)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Advanced Solar & HVAC training recommended by State Federation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
