import React from 'react';
import { useAuth } from './context/AuthContext';
import { DemoBar } from './components/DemoBar';
import { Navbar } from './components/Navbar';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { WorkerDashboard } from './pages/WorkerDashboard';
import { CoopAdminDashboard } from './pages/CoopAdminDashboard';
import { FederationAdminDashboard } from './pages/FederationAdminDashboard';

export default function App() {
  const { user, loading } = useAuth();

  const renderDashboardByRole = () => {
    if (loading) {
      return (
        <div className="main-content" style={{ textAlign: 'center', padding: '4rem' }}>
          <h3>Connecting to SahakarGig Cooperative Network...</h3>
        </div>
      );
    }

    if (!user) {
      return <CustomerDashboard />;
    }

    switch (user.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'worker':
        return <WorkerDashboard />;
      case 'coop_admin':
        return <CoopAdminDashboard />;
      case 'federation_admin':
        return <FederationAdminDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* 1-Click Evaluation Demo Control Bar */}
      <DemoBar />

      {/* Main Navbar */}
      <Navbar />

      {/* Dynamic Role Dashboard View */}
      {renderDashboardByRole()}
    </div>
  );
}
