import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n';
import { API_BASE } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sahakar_token') || '');
  const [lang, setLang] = useState(localStorage.getItem('sahakar_lang') || 'en');
  const [loading, setLoading] = useState(true);

  // Universal smart translation helper
  const t = (key) => {
    if (!key) return '';
    const langDict = translations[lang] || translations['en'];

    if (langDict[key]) return langDict[key];

    const normKey = String(key).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    if (langDict[normKey]) return langDict[normKey];
    if (langDict[`status_${normKey}`]) return langDict[`status_${normKey}`];
    if (langDict[`cat_${normKey}`]) return langDict[`cat_${normKey}`];
    if (langDict[`srv_${normKey}`]) return langDict[`srv_${normKey}`];

    const dynamicMap = {
      'Plumbing & Sanitation': 'cat_plumb',
      'Electrical & Power': 'cat_elec',
      'Carpentry & Furniture': 'cat_carp',
      'AC & Refrigeration': 'cat_ac',
      'Appliance & Electronics Repair': 'cat_appl',
      'Home Cleaning & Sanitation': 'cat_clean',
      'Caregiving & Senior Assistance': 'cat_care',
      'Painting & Waterproofing': 'cat_paint',
      'Gardening & Landscaping': 'cat_garden',
      'Domestic Help & Cooking': 'cat_domestic',
      'Driver & Transportation': 'cat_driver',

      'Emergency Leakage Repair': 'srv_plumb_leak',
      'Tap & Mixer Installation': 'srv_plumb_tap',
      'Drainage Unclogging': 'srv_plumb_drain',
      'Electrical Short Circuit Troubleshooting': 'srv_elec_short',
      'Ceiling Fan Installation & Repair': 'srv_elec_fan',
      'Switchboard & Socket Fitting': 'srv_elec_switch',
      'AC Deep Foam Cleaning & Service': 'srv_ac_service',
      'AC Gas Charging & Leak Detection': 'srv_ac_gas',
      'Door Lock Repair & Installation': 'srv_carp_lock',
      'Furniture Assembly & Repair': 'srv_carp_furn',
      'Elderly Nursing Care (Daily Shift)': 'srv_care_elder',
      'Full Home Deep Sanitation': 'srv_clean_full',

      'PENDING_WORKER_ACCEPTANCE': 'status_pending_worker_acceptance',
      'CONFIRMED': 'status_confirmed',
      'WORKER_ON_THE_WAY': 'status_worker_on_the_way',
      'IN_PROGRESS': 'status_in_progress',
      'COMPLETED': 'status_completed',
      'CANCELLED': 'status_cancelled',
      'REJECTED': 'status_rejected',
      'DISPUTED': 'status_disputed',
      'VERIFIED': 'status_verified',
      'PENDING': 'status_pending',
      'SUSPENDED': 'status_suspended',
      'EMERGENCY': 'status_emergency'
    };

    if (dynamicMap[key] && langDict[dynamicMap[key]]) {
      return langDict[dynamicMap[key]];
    }

    return key;
  };

  const fetchSession = async (authToken) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        if (data.user?.role) {
          localStorage.setItem('sahakar_role', data.user.role);
        }
      } else {
        const savedRole = localStorage.getItem('sahakar_role') || 'customer';
        switchDemoRole(savedRole);
      }
    } catch (error) {
      console.error('Session fetch error:', error);
      const savedRole = localStorage.getItem('sahakar_role') || 'customer';
      switchDemoRole(savedRole);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('sahakar_role') || 'customer';
    if (token) {
      fetchSession(token);
    } else {
      switchDemoRole(savedRole);
    }
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    if (userData?.role) {
      localStorage.setItem('sahakar_role', userData.role);
    }
    localStorage.setItem('sahakar_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('sahakar_token');
    localStorage.removeItem('sahakar_role');
  };

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('sahakar_lang', newLang);
  };

  const switchDemoRole = async (roleName) => {
    const demoCredentials = {
      customer: { email: 'customer@sahakar.in', password: 'Password123!' },
      worker: { email: 'ravi.worker@sahakar.in', password: 'Password123!' },
      coop_admin: { email: 'admin.hyderabad@sahakar.in', password: 'Password123!' },
      federation_admin: { email: 'admin.state@sahakar.in', password: 'Password123!' }
    };

    const fallbackUsers = {
      customer: { id: 1, email: 'customer@sahakar.in', role: 'customer', full_name: 'Lakshmi Narayana', phone: '+91 98490 12345' },
      worker: { id: 2, email: 'ravi.worker@sahakar.in', role: 'worker', full_name: 'Ravi Kumar', phone: '+91 97001 55443' },
      coop_admin: { id: 3, email: 'admin.hyderabad@sahakar.in', role: 'coop_admin', full_name: 'Srinivas Rao (Coop Manager)', phone: '+91 94400 66778' },
      federation_admin: { id: 4, email: 'admin.state@sahakar.in', role: 'federation_admin', full_name: 'Dr. Venkat Reddy (Federation Director)', phone: '+91 98850 33221' }
    };

    const creds = demoCredentials[roleName];
    if (!creds) return;
    localStorage.setItem('sahakar_role', roleName);

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();
      if (data.success) {
        login(data.user, data.token);
      } else {
        const fb = fallbackUsers[roleName];
        setUser(fb);
      }
    } catch (err) {
      console.warn('Demo API login offline/CORS fallback engaged:', err);
      const fb = fallbackUsers[roleName];
      setUser(fb);
    } finally {
      setLoading(false);
    }
  };

  // Local storage helpers for persistent offline/offline-fallback booking synchronization
  const getStoredBookings = () => {
    try {
      const raw = localStorage.getItem('sahakar_local_bookings');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const saveStoredBooking = (newBooking) => {
    try {
      const existing = getStoredBookings();
      const idx = existing.findIndex(b => b.id === newBooking.id || b.booking_number === newBooking.booking_number);
      let updated;
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...updated[idx], ...newBooking };
      } else {
        updated = [newBooking, ...existing];
      }
      localStorage.setItem('sahakar_local_bookings', JSON.stringify(updated));
      window.dispatchEvent(new Event('sahakar_booking_updated'));
    } catch (e) {
      console.error('Error saving local booking:', e);
    }
  };

  const updateStoredBookingStatus = (bookingId, status, extraFields = {}) => {
    try {
      const existing = getStoredBookings();
      const updated = existing.map(b => {
        if (String(b.id) === String(bookingId) || b.booking_number === bookingId) {
          return { ...b, status, ...extraFields, updated_at: new Date().toISOString() };
        }
        return b;
      });
      localStorage.setItem('sahakar_local_bookings', JSON.stringify(updated));
      window.dispatchEvent(new Event('sahakar_booking_updated'));
    } catch (e) {
      console.error('Error updating local booking status:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        lang,
        t,
        login,
        logout,
        changeLanguage,
        switchDemoRole,
        getStoredBookings,
        saveStoredBooking,
        updateStoredBookingStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
