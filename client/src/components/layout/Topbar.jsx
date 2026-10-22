import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  Shield, 
  Database, 
  UserCircle, 
  Check, 
  ChevronDown, 
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Topbar({ title, onOpenMobile, storageMode = 'Local Storage (Active Demo Mode)' }) {
  const { user, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  const roles = ['Admin', 'Receptionist', 'Doctor'];

  return (
    <header className="h-16 bg-white border-b border-hospital-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base lg:text-lg font-bold text-slate-800 tracking-tight leading-tight">{title}</h1>
          <p className="hidden sm:block text-[11px] text-slate-400 font-medium">St. Jude Metropolitan Academic Medical Center</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Storage status chip */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Dual-Engine: {storageMode.includes('Mongo') ? 'MongoDB Live' : 'Persistent Demo Storage'}</span>
        </div>

        {/* Role Quick Switcher Pill (for college demonstration convenience) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Switch demo role (Admin, Receptionist, Doctor)"
          >
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-teal-700 font-bold">{user?.role || 'Admin'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-slate-200 py-1.5 z-50 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Active Demo Role
              </div>
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user?.role === r ? 'bg-teal-600' : 'bg-slate-300'}`} />
                    <span>{r}</span>
                  </div>
                  {user?.role === r && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors relative"
            aria-label="View system notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotificationPanel && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-elevated border border-slate-200 p-4 z-50 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Hospital Notifications</span>
                <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">Live</span>
              </div>
              <div className="space-y-3 mt-3">
                <div className="p-2.5 bg-teal-50/60 rounded-lg border border-teal-100">
                  <p className="font-semibold text-teal-950">AI Triage Service Operational</p>
                  <p className="text-[11px] text-teal-700 mt-0.5">NEWS2 clinical severity scoring and symptom analyzer active.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-800">Bed Allocation Lock Enforced</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Atomic double-booking prevention operational across all 4 wards.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Dr. Arthur Sterling'}</p>
            <p className="text-[10px] text-slate-400 font-medium">{user?.department || 'Administration'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
