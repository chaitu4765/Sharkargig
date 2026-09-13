import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Shield } from 'lucide-react';
import { API_BASE } from '../api';

export const Navbar = () => {
  const { user, token, logout, t } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-logo">SG</div>
        <div className="brand-text">
          <h1>{t('brand_name')}</h1>
          <p>{t('tagline')}</p>
        </div>
      </div>

      <div className="nav-actions">
        {user && (
          <>
            <span className={`role-badge role-${user.role}`}>
              <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {t(`${user.role}_role`)}
            </span>

            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.6rem', color: '#fff', borderColor: '#334155' }}
                onClick={() => setShowNotifs(!showNotifs)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.4rem',
                      fontWeight: 700
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifs && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '120%',
                    width: '320px',
                    background: '#fff',
                    color: '#0f172a',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    padding: '1rem',
                    zIndex: 200,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <h4 style={{ margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', fontSize: '0.9rem' }}>
                    {t('notifications')} ({notifications.length})
                  </h4>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '0.5rem' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
                        {t('no_notifications')}
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '0.5rem 0',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '0.8rem'
                          }}
                        >
                          <strong style={{ color: n.type === 'EMERGENCY' ? '#dc2626' : '#0f172a' }}>{n.title}</strong>
                          <p style={{ margin: '0.2rem 0 0 0', color: '#475569' }}>{n.message}</p>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{user.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.email}</div>
            </div>

            <button
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.7rem', color: '#94a3b8', borderColor: '#334155' }}
              onClick={logout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
