import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, ShieldCheck, CheckCircle2, XCircle, AlertOctagon, DollarSign, Activity, AlertTriangle } from 'lucide-react';

export const CoopAdminDashboard = () => {
  const { user, token, t } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/cooperatives/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Coop Dashboard fetch error:', err);
    }
  };

  const fetchWorkers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/cooperatives/workers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWorkers(data.workers);
      }
    } catch (err) {
      console.error('Worker list error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchWorkers();
  }, [token]);

  const handleVerifyWorker = async (workerId, status) => {
    try {
      const res = await fetch(`/api/cooperatives/workers/${workerId}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchWorkers();
        fetchDashboardData();
        alert(data.message);
      }
    } catch (err) {
      console.error('Verify worker error:', err);
    }
  };

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: '3rem' }}>Loading Cooperative Administration Portal...</div>;
  }

  const kpi = dashboardData?.kpi || {};
  const pendingWorkers = workers.filter((w) => w.verification_status === 'PENDING');
  const activeSOS = dashboardData?.active_sos || [];

  return (
    <div className="main-content">
      {/* Top Banner Header */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#0f172a', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="#ea580c" size={22} />
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>
                {t('coop_admin_command')}
              </h2>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Hyderabad Central Skilled Artisans Cooperative Society Ltd (HYD-COOP-2018-091)
            </p>
          </div>

          {activeSOS.length > 0 && (
            <div style={{ background: '#dc2626', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'pulse-red 2s infinite' }}>
              <AlertTriangle size={18} /> {activeSOS.length} {t('active_sos_alerts')}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-icon"><Users size={24} /></div>
          <div>
            <div className="kpi-val">{kpi.total_workers || 0}</div>
            <div className="kpi-lbl">{t('total_workers')}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#d97706' }}>
          <div className="kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}><AlertOctagon size={24} /></div>
          <div>
            <div className="kpi-val" style={{ color: '#b45309' }}>{kpi.pending_workers || 0}</div>
            <div className="kpi-lbl">{t('pending_verification')}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Activity size={24} /></div>
          <div>
            <div className="kpi-val">{kpi.active_jobs || 0}</div>
            <div className="kpi-lbl">{t('active_jobs_in_progress')}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#16a34a' }}>
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><DollarSign size={24} /></div>
          <div>
            <div className="kpi-val" style={{ color: '#15803d' }}>₹{kpi.total_revenue || 0}</div>
            <div className="kpi-lbl">{t('total_revenue_generated')}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          {t('overview_service_demand')}
        </button>
        <button className={`tab-btn ${activeTab === 'verifications' ? 'active' : ''}`} onClick={() => setActiveTab('verifications')}>
          {t('worker_verification_queue')} ({pendingWorkers.length})
        </button>
        <button className={`tab-btn ${activeTab === 'sos' ? 'active' : ''}`} onClick={() => setActiveTab('sos')}>
          {t('emergency_sos_monitor')} ({activeSOS.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* All Cooperative Workers Table */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t('registered_workers')}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>{t('worker_name')}</th>
                  <th style={{ padding: '0.5rem' }}>{t('experience')}</th>
                  <th style={{ padding: '0.5rem' }}>{t('rating')}</th>
                  <th style={{ padding: '0.5rem' }}>{t('status')}</th>
                  <th style={{ padding: '0.5rem' }}>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{w.full_name}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{w.years_of_experience} {t('yrs_exp')}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: '#d97706', fontWeight: 700 }}>⭐ {w.average_rating}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      <span className={`badge badge-${w.verification_status}`}>{t(w.verification_status)}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      {w.verification_status === 'VERIFIED' ? (
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }} onClick={() => handleVerifyWorker(w.id, 'SUSPENDED')}>
                          {t('suspend')}
                        </button>
                      ) : (
                        <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleVerifyWorker(w.id, 'VERIFIED')}>
                          {t('verify')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Service Demand Breakdown */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t('top_local_demand')}</h3>
            {dashboardData?.service_demand?.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px dashed #e2e8f0', fontSize: '0.85rem' }}>
                <span>{t(s.service_name)}</span>
                <strong style={{ color: '#ea580c' }}>{s.booking_count} {t('bookings_count')}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>{t('worker_verification_queue')}</h3>
          {pendingWorkers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              {t('no_verifications_pending')}
            </div>
          ) : (
            <div className="grid-3">
              {pendingWorkers.map((w) => (
                <div key={w.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>{w.full_name}</h4>
                    <span className="badge badge-PENDING">{t('status_pending')}</span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0' }}>
                    Email: {w.email} • Phone: {w.phone}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {t('experience')}: {w.years_of_experience} yrs • Society: {w.society_name}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, background: '#fee2e2', color: '#dc2626' }} onClick={() => handleVerifyWorker(w.id, 'REJECTED')}>
                      <XCircle size={16} /> {t('reject')}
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleVerifyWorker(w.id, 'VERIFIED')}>
                      <CheckCircle2 size={16} /> {t('approve_verify')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SOS MONITOR */}
      {activeTab === 'sos' && (
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>{t('emergency_sos_monitor')}</h3>
          {activeSOS.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#16a34a', fontWeight: 600 }}>
              {t('all_sos_resolved')}
            </div>
          ) : (
            activeSOS.map((s) => (
              <div key={s.id} className="card" style={{ borderLeft: '4px solid #dc2626', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#dc2626', margin: 0 }}>🚨 SOS ALERT: {s.worker_name}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.2rem 0' }}>
                      Phone: {s.worker_phone} • Triggered: {new Date(s.triggered_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <button className="btn btn-primary" style={{ background: '#dc2626' }}>
                    Dispatch Emergency Response
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
