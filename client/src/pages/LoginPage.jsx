import React, { useState } from 'react';
import { 
  HeartPulse, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  Stethoscope, 
  Building2,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export function LoginPage() {
  const { login } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [email, setEmail] = useState('admin@pams.hospital');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'Admin',
      name: 'Dr. Arthur Sterling',
      email: 'admin@pams.hospital',
      password: 'password123',
      dept: 'Hospital Administration',
      icon: Building2
    },
    {
      role: 'Receptionist',
      name: 'Elena Rostova, RN',
      email: 'reception@pams.hospital',
      password: 'password123',
      dept: 'Intake & Triage Desk',
      icon: UserCheck
    },
    {
      role: 'Doctor',
      name: 'Dr. Sarah Jenkins, MD',
      email: 'doctor@pams.hospital',
      password: 'password123',
      dept: 'Cardiology Department',
      icon: Stethoscope
    }
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setRole(acc.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notifyError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await login({ email, password, role });
      success(`Welcome back, ${loggedUser.name}! Signed in as ${loggedUser.role}.`);
    } catch (err) {
      notifyError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hospital-bg via-warm-50 to-teal-50/40 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-elevated border border-slate-200 overflow-hidden">
        
        {/* Left Side: Hospital Branding & Info */}
        <div className="md:col-span-5 bg-teal-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">PAMS</h1>
                <p className="text-xs text-teal-200 font-medium">Patient Admission Management</p>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <h2 className="text-xl font-bold text-teal-50 leading-snug">
                AI-Powered Hospital Admission & Bed Allocation System
              </h2>
              <p className="text-xs text-teal-200/90 leading-relaxed">
                Streamlining inpatient registration, clinical NEWS2 triage scoring, dynamic bed availability locking, and automated handover reports for modern medical centers.
              </p>
            </div>

            <div className="mt-8 space-y-3 border-t border-teal-800/80 pt-6">
              <div className="flex items-center gap-2 text-xs text-teal-100">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero Double-Booking Bed Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-teal-100">
                <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span>AI Clinical Decision Support & Triage</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-teal-100">
                <Building2 className="w-4 h-4 text-teal-300 flex-shrink-0" />
                <span>Ward-Wise Occupancy Tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-teal-800 text-[11px] text-teal-300">
            <span className="font-semibold text-teal-100">College PBL Demonstration Edition</span>
            <p className="text-[10px] text-teal-300/80 mt-0.5">St. Jude Metropolitan Academic Medical Center</p>
          </div>
        </div>

        {/* Right Side: Login Form & Quick Fill Demo Credentials */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Staff Authentication</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in with your authorized hospital credentials.</p>
          </div>

          {/* College Demo Banner */}
          <div className="mb-6 p-3 bg-warm-100 border border-warm-300 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
            <Info className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-slate-800 font-semibold">Evaluation Demo Mode:</strong> Click any of the one-tap roles below to automatically load preconfigured credentials.
            </div>
          </div>

          {/* Quick-fill demo account pills */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Fast Demo Login: Select Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map(acc => {
                const Icon = acc.icon;
                const isSelected = role === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {acc.role}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-800 mt-2 truncate">{acc.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{acc.dept}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="staff@pams.hospital"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[10px] text-teal-700 font-mono">Demo: password123</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors text-slate-800 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 shadow-soft transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In as {role}</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
