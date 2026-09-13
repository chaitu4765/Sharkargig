import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Wrench, Building, Globe } from 'lucide-react';

export const DemoBar = () => {
  const { user, switchDemoRole, lang, changeLanguage, t } = useAuth();

  return (
    <div className="demo-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck size={16} color="#f97316" />
        <span style={{ fontWeight: 600 }}>{t('sih_control')}</span>
        <span style={{ opacity: 0.8 }}>{t('click_test_role')}</span>
      </div>

      <div className="demo-pills">
        <button
          className={`demo-btn ${user?.role === 'customer' ? 'active' : ''}`}
          onClick={() => switchDemoRole('customer')}
        >
          <User size={14} /> {t('customer_view')}
        </button>
        <button
          className={`demo-btn ${user?.role === 'worker' ? 'active' : ''}`}
          onClick={() => switchDemoRole('worker')}
        >
          <Wrench size={14} /> {t('worker_view')}
        </button>
        <button
          className={`demo-btn ${user?.role === 'coop_admin' ? 'active' : ''}`}
          onClick={() => switchDemoRole('coop_admin')}
        >
          <Building size={14} /> {t('coop_admin')}
        </button>
        <button
          className={`demo-btn ${user?.role === 'federation_admin' ? 'active' : ''}`}
          onClick={() => switchDemoRole('federation_admin')}
        >
          <Globe size={14} /> {t('federation_admin')}
        </button>

        {/* Language selector */}
        <select
          value={lang}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{
            background: '#334155',
            color: '#fff',
            border: '1px solid #475569',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <option value="en">English (EN)</option>
          <option value="hi">हिंदी (HI)</option>
          <option value="te">తెలుగు (TE)</option>
        </select>
      </div>
    </div>
  );
};
