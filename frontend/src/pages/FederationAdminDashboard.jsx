import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Globe, Building, TrendingUp, AlertTriangle, Cpu, CheckCircle2, BookOpen, Layers } from 'lucide-react';

export const FederationAdminDashboard = () => {
  const { user, token, t } = useAuth();
  const [societies, setSocieties] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [skillGaps, setSkillGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('ai');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);

      const socRes = await fetch('/api/cooperatives/federation/societies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const socData = await socRes.json();
      if (socData.success) setSocieties(socData.societies);

      const predRes = await fetch('/api/ai/predictions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const predData = await predRes.json();
      if (predData.success) setPredictions(predData);

      const gapRes = await fetch('/api/ai/skill-gaps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const gapData = await gapRes.json();
      if (gapData.success) setSkillGaps(gapData.skill_gaps);

      const recRes = await fetch('/api/ai/recommendations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recData = await recRes.json();
      if (recData.success) setRecommendations(recData.recommendations);
    } catch (err) {
      console.error('Federation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleApplyRecommendation = async (recId, action) => {
    try {
      const res = await fetch(`/api/ai/recommendations/${recId}/action`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert(`AI Recommendation action applied: ${action}`);
      }
    } catch (err) {
      console.error('Apply rec error:', err);
    }
  };

  if (loading) {
    return <div className="main-content" style={{ textAlign: 'center', padding: '3rem' }}>Loading Federation Intelligence Portal...</div>;
  }

  const totalSocieties = societies.length;
  const totalWorkersAll = societies.reduce((sum, s) => sum + s.total_workers, 0);
  const totalRevenueAll = societies.reduce((sum, s) => sum + s.total_revenue, 0);

  return (
    <div className="main-content">
      {/* Top Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#0f172a', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe color="#ea580c" size={24} />
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.3rem' }}>
                {t('federation_title')}
              </h2>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              {t('federation_subtitle')}
            </p>
          </div>

          <div style={{ background: '#ea580c', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
            {t('ai_engine_active')} ({predictions?.summary?.model_confidence_percent || '94%'})
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-icon"><Building size={24} /></div>
          <div>
            <div className="kpi-val">{totalSocieties}</div>
            <div className="kpi-lbl">{t('cooperative_societies')}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Layers size={24} /></div>
          <div>
            <div className="kpi-val">{totalWorkersAll}</div>
            <div className="kpi-lbl">{t('total_federation_workers')}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="kpi-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={24} /></div>
          <div>
            <div className="kpi-val" style={{ color: '#dc2626' }}>{predictions?.summary?.total_shortage_units || 33}</div>
            <div className="kpi-lbl">{t('projected_shortage')}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#16a34a' }}>
          <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><TrendingUp size={24} /></div>
          <div>
            <div className="kpi-val" style={{ color: '#15803d' }}>₹{totalRevenueAll}</div>
            <div className="kpi-lbl">{t('state_revenue')}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          <Cpu size={16} style={{ display: 'inline', marginRight: '4px' }} /> {t('ai_demand_reallocation')}
        </button>
        <button className={`tab-btn ${activeTab === 'skill_gaps' ? 'active' : ''}`} onClick={() => setActiveTab('skill_gaps')}>
          <BookOpen size={16} style={{ display: 'inline', marginRight: '4px' }} /> {t('regional_skill_gap_analysis')}
        </button>
        <button className={`tab-btn ${activeTab === 'societies' ? 'active' : ''}`} onClick={() => setActiveTab('societies')}>
          <Building size={16} style={{ display: 'inline', marginRight: '4px' }} /> {t('member_societies_performance')}
        </button>
      </div>

      {/* TAB 1: AI DEMAND FORECASTING & REALLOCATION */}
      {activeTab === 'ai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Demand Predictions Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp color="#ea580c" size={20} /> {t('ai_predictions_title')}
            </h3>

            {predictions?.predictions?.map((p) => (
              <div key={p.id} style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>{t(p.service_name)} ({p.region})</span>
                  <span style={{ color: p.projected_shortage > 0 ? '#dc2626' : '#16a34a' }}>
                    {p.projected_shortage > 0 ? `Shortage: -${p.projected_shortage}` : 'Balanced'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                  <div>Predicted Demand: <strong>{p.predicted_demand_count} jobs</strong></div>
                  <div>Available Workers: <strong>{p.available_worker_count}</strong></div>
                  <div>AI Confidence: <strong>{Math.round(p.confidence_score * 100)}%</strong></div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Workforce Reallocation Recommendations */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu color="#ea580c" size={20} /> {t('explainable_ai_advisor')}
            </h3>

            {recommendations.map((rec) => (
              <div key={rec.id} style={{ background: rec.status === 'APPLIED' ? '#f0fdf4' : '#fff7ed', padding: '0.9rem', borderRadius: '10px', marginBottom: '0.75rem', border: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${rec.priority === 'HIGH' ? 'badge-EMERGENCY' : 'badge-PENDING'}`}>
                    PRIORITY: {rec.priority}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{rec.status}</span>
                </div>

                <h4 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '1rem' }}>{rec.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{rec.description}</p>

                {rec.status === 'PROPOSED' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleApplyRecommendation(rec.id, 'DISMISSED')}>
                      {t('dismiss')}
                    </button>
                    <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleApplyRecommendation(rec.id, 'APPLIED')}>
                      <CheckCircle2 size={14} /> {t('execute_reallocation')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SKILL GAP MATRIX */}
      {activeTab === 'skill_gaps' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>{t('skill_gap_matrix_title')}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem' }}>{t('trade_service')}</th>
                <th style={{ padding: '0.6rem' }}>{t('category')}</th>
                <th style={{ padding: '0.6rem' }}>{t('verified_certified_workers')}</th>
                <th style={{ padding: '0.6rem' }}>{t('projected_demand')}</th>
                <th style={{ padding: '0.6rem' }}>{t('skill_gap')}</th>
                <th style={{ padding: '0.6rem' }}>{t('explainable_action_recommendation')}</th>
              </tr>
            </thead>
            <tbody>
              {skillGaps.map((sg) => (
                <tr key={sg.service_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>{t(sg.service_name)}</td>
                  <td style={{ padding: '0.6rem', color: '#64748b' }}>{t(sg.category_name)}</td>
                  <td style={{ padding: '0.6rem' }}>{sg.verified_certified_workers}</td>
                  <td style={{ padding: '0.6rem' }}>{sg.projected_monthly_demand}</td>
                  <td style={{ padding: '0.6rem' }}>
                    <span className={`badge ${sg.severity === 'HIGH' ? 'badge-EMERGENCY' : sg.severity === 'MEDIUM' ? 'badge-PENDING' : 'badge-VERIFIED'}`}>
                      {sg.skill_gap > 0 ? `+${sg.skill_gap} ${t('needed')}` : t('sufficient')}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#334155' }}>
                    {sg.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: MEMBER SOCIETIES */}
      {activeTab === 'societies' && (
        <div className="grid-3">
          {societies.map((soc) => (
            <div key={soc.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>{soc.name}</h4>
                <span className="badge badge-VERIFIED">{t(soc.status)}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0' }}>
                Reg No: {soc.registration_no} • {soc.city}
              </p>

              <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px', margin: '0.75rem 0', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div>Total Workers: <strong>{soc.total_workers}</strong></div>
                <div>Verified: <strong>{soc.verified_workers}</strong></div>
                <div>Bookings: <strong>{soc.total_bookings}</strong></div>
                <div>Revenue: <strong>₹{soc.total_revenue}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
