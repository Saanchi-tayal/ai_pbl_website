import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardList, 
  Bed, 
  Bot, 
  BarChart3, 
  Settings, 
  LogOut, 
  Cross, 
  Activity,
  HeartPulse,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ currentTab, onSelectTab, isMobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'patient-register', label: 'Register Patient', icon: UserPlus },
    { id: 'new-admission', label: 'New Admission', icon: Activity, badge: 'Intake' },
    { id: 'admissions', label: 'Admission Records', icon: ClipboardList },
    { id: 'beds', label: 'Bed Management', icon: Bed },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'AI' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-teal-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-teal-800
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-teal-800 bg-teal-950/40">
          <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-md">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">PAMS</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sage-400 text-slate-900 font-bold">
                Hospital
              </span>
            </div>
            <p className="text-[11px] text-teal-200/80 leading-none mt-0.5 font-medium">Patient Admission System</p>
          </div>
        </div>

        {/* User Card Summary */}
        <div className="px-5 py-3.5 mx-3 mt-3 bg-teal-800/40 border border-teal-700/50 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-teal-100 uppercase border border-teal-500">
            {user?.name ? user.name.slice(0, 2) : 'ST'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Staff Member'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] text-teal-200 capitalize font-medium">{user?.role || 'Clinician'}</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-teal-400/80">
            Main Clinical Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group
                  ${isActive 
                    ? 'bg-teal-500 text-white shadow-sm font-semibold' 
                    : 'text-teal-100 hover:bg-teal-800/60 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-teal-300 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isActive ? 'bg-teal-700 text-teal-100' : 'bg-teal-800 text-teal-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System & Logout Footer */}
        <div className="p-3 border-t border-teal-800 bg-teal-950/30">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-teal-200 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4 text-teal-300" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
