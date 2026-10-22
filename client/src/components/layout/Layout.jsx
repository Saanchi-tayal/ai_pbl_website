import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout({ currentTab, onSelectTab, storageMode, children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const tabTitles = {
    'dashboard': 'Hospital Overview & Admissions Dashboard',
    'patients': 'Patient Management & Clinical Directory',
    'patient-register': 'Patient Registration & Intake Form',
    'new-admission': 'New Patient Admission & Bed Allocation',
    'admissions': 'Admission Records & Discharge Management',
    'beds': 'Bed & Ward Occupancy Matrix',
    'ai-assistant': 'AI Clinical Admission Assistant & Triage',
    'reports': 'Reports, Utilization Analytics & Data Export',
    'settings': 'Hospital Configuration & Master Directory'
  };

  const currentTitle = tabTitles[currentTab] || 'Patient Admission Management System';

  return (
    <div className="min-h-screen bg-hospital-bg flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          title={currentTitle}
          onOpenMobile={() => setIsMobileOpen(true)}
          storageMode={storageMode}
        />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
