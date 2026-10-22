import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientRegistrationPage } from './pages/PatientRegistrationPage';
import { NewAdmissionPage } from './pages/NewAdmissionPage';
import { AdmissionRecordsPage } from './pages/AdmissionRecordsPage';
import { BedManagementPage } from './pages/BedManagementPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { api } from './services/api';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [navigationParams, setNavigationParams] = useState({});
  const [storageMode, setStorageMode] = useState('Local File Persistence (Demo Mode)');

  useEffect(() => {
    // Check health & storage status
    api.getHealth()
      .then(res => {
        if (res?.storage?.mode) {
          setStorageMode(res.storage.mode);
        }
      })
      .catch(() => {});
  }, []);

  const handleNavigate = (tabId, params = {}) => {
    setNavigationParams(params);
    setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hospital-bg flex items-center justify-center">
        <LoadingSpinner text="Starting PAMS Clinical System..." />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'patients':
        return <PatientsPage onNavigate={handleNavigate} />;
      case 'patient-register':
        return (
          <PatientRegistrationPage 
            onNavigate={handleNavigate}
            onPatientRegistered={(patient) => {
              // Can pass to new admission
            }}
          />
        );
      case 'new-admission':
        return (
          <NewAdmissionPage 
            onNavigate={handleNavigate} 
            preselectedPatientId={navigationParams.preselectedPatientId}
          />
        );
      case 'admissions':
        return <AdmissionRecordsPage onNavigate={handleNavigate} />;
      case 'beds':
        return <BedManagementPage onNavigate={handleNavigate} />;
      case 'ai-assistant':
        return <AIAssistantPage onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsAnalyticsPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={handleNavigate}
      storageMode={storageMode}
    >
      {renderCurrentPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
