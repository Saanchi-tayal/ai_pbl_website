import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bed, 
  Activity, 
  UserPlus, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { PriorityBadge, BedStatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { useNotification } from '../context/NotificationContext';

export function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState('Recovered');
  const [isDischarging, setIsDischarging] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      notifyError('Failed to load dashboard metrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleOpenDischarge = (admission) => {
    setSelectedAdmission(admission);
    setDischargeNotes(`Patient completed inpatient admission orders under ${admission.attendingDoctor}. Vitals normalized. Cleared for discharge.`);
    setDischargeCondition('Recovered');
    setDischargeModalOpen(true);
  };

  const handleConfirmDischarge = async () => {
    if (!selectedAdmission) return;
    setIsDischarging(true);
    try {
      await api.dischargePatient(selectedAdmission.admissionId, {
        dischargeSummary: dischargeNotes,
        dischargeCondition,
        performedBy: user?.name || 'Staff'
      });
      success(`Patient ${selectedAdmission.patientName} discharged and Bed ${selectedAdmission.assignedBedNumber} released!`);
      setDischargeModalOpen(false);
      setSelectedAdmission(null);
      fetchDashboard();
    } catch (err) {
      notifyError('Discharge failed: ' + err.message);
    } finally {
      setIsDischarging(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner text="Compiling live clinical and bed occupancy metrics..." />;
  }

  const { metrics, charts, recentAdmissions, recentActivityLogs } = data;

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Ward chart colors
  const WARD_COLORS = ['#1F5E63', '#8FAF9A', '#3B82F6', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Welcoming Header & Quick Actions */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentDateStr}</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Welcome back, {user?.name || 'Clinical Staff'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Patient admission desk, bed occupancy tracking, and AI triage assistance are active.
          </p>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('patient-register')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <UserPlus className="w-4 h-4 text-teal-600" />
            <span>Register Patient</span>
          </button>

          <button
            onClick={() => onNavigate('new-admission')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-soft transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>New Admission</span>
          </button>

          <button
            onClick={() => onNavigate('beds')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Bed className="w-4 h-4 text-sage-600" />
            <span>Manage Beds</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Metric Cards (Calculated Strictly From Stored Data) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Registered"
          value={metrics.totalRegisteredPatients}
          subtitle="Hospital database"
          icon={Users}
          color="teal"
          onClick={() => onNavigate('patients')}
        />
        <StatCard
          title="Admitted Today"
          value={metrics.admittedToday}
          subtitle="New admissions"
          icon={Activity}
          color="blue"
          onClick={() => onNavigate('admissions')}
        />
        <StatCard
          title="Available Beds"
          value={metrics.availableBeds}
          subtitle={`Out of ${metrics.totalBeds} total`}
          icon={Bed}
          color="emerald"
          onClick={() => onNavigate('beds')}
        />
        <StatCard
          title="Occupied Beds"
          value={metrics.occupiedBeds}
          subtitle={`${metrics.overallOccupancyRate}% occupancy`}
          icon={Bed}
          color="rose"
          onClick={() => onNavigate('beds')}
        />
        <StatCard
          title="Pending Queue"
          value={metrics.pendingAdmissions}
          subtitle="Awaiting intake"
          icon={Clock}
          color="amber"
          onClick={() => onNavigate('new-admission')}
        />
        <StatCard
          title="Discharged"
          value={metrics.totalDischarged}
          subtitle="Beds released"
          icon={CheckCircle2}
          color="sage"
          onClick={() => onNavigate('admissions')}
        />
      </div>

      {/* Two Core Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Admission Activity Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-hospital-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Admission Activity & Priority Volume</h3>
              <p className="text-[11px] text-slate-400">Daily triage distribution across recent days</p>
            </div>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.admissionTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="emergency" name="Emergency" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="urgent" name="Urgent" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="routine" name="Routine" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bed Occupancy by Ward Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-hospital-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Ward Occupancy Distribution</h3>
              <p className="text-[11px] text-slate-400">Live occupied vs available capacity</p>
            </div>
            <button 
              onClick={() => onNavigate('beds')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <span>Bed Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {charts.wardOccupancyData.map((ward, idx) => (
              <div key={ward.name} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">{ward.fullName}</span>
                  <span className="text-slate-600 font-medium">
                    <strong className="text-slate-900">{ward.occupied}</strong> / {ward.total} Beds ({ward.rate}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-500" 
                    style={{ width: `${ward.rate}%` }}
                    title={`Occupied: ${ward.occupied}`}
                  />
                  {ward.maintenance > 0 && (
                    <div 
                      className="h-full bg-amber-400 transition-all duration-500" 
                      style={{ width: `${(ward.maintenance / ward.total) * 100}%` }}
                      title={`Maintenance: ${ward.maintenance}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Maintenance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Available
            </span>
          </div>
        </div>
      </div>

      {/* Recent Admissions & Real-Time Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Patient Admissions Table (Left 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-hospital-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Patient Admissions</h3>
              <p className="text-[11px] text-slate-400">Latest active and historical clinical intakes</p>
            </div>
            <button
              onClick={() => onNavigate('admissions')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <span>View All Records</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Patient</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Assigned Bed</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAdmissions.map((adm) => (
                  <tr key={adm.admissionId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-2">
                      <p className="font-bold text-slate-800">{adm.patientName}</p>
                      <p className="text-[10px] text-slate-400">{adm.admissionId} • {adm.patientId}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-semibold text-slate-700">{adm.department}</p>
                      <p className="text-[10px] text-slate-500">{adm.attendingDoctor}</p>
                    </td>
                    <td className="py-3">
                      <span className="font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {adm.assignedBedNumber}
                      </span>
                    </td>
                    <td className="py-3">
                      <PriorityBadge priority={adm.admissionPriority} />
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        adm.status === 'Admitted'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {adm.status}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2">
                      {adm.status === 'Admitted' ? (
                        <button
                          onClick={() => handleOpenDischarge(adm)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        >
                          Discharge
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Released</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-Time Hospital Activity Log (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-hospital-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Hospital Activity</h3>
              <p className="text-[11px] text-slate-400">Audited clinical events</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {recentActivityLogs.map(log => (
              <div key={log.logId} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 leading-tight">{log.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • By {log.performedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Discharge Confirmation Modal */}
      <Modal
        isOpen={dischargeModalOpen}
        onClose={() => setDischargeModalOpen(false)}
        title="Discharge Patient & Release Bed"
        subtitle={`Discharging ${selectedAdmission?.patientName} (${selectedAdmission?.admissionId})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <p className="font-bold text-amber-800">AUTOMATIC BED RELEASE CONFIRMATION</p>
            <p className="text-[11px] mt-0.5">
              Discharging this patient will update their status to <strong>Discharged</strong> and immediately release Bed <strong>{selectedAdmission?.assignedBedNumber}</strong> back to the Available inventory.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Discharge Condition</label>
            <select
              value={dischargeCondition}
              onChange={(e) => setDischargeCondition(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium"
            >
              <option value="Recovered">Recovered / Treatment Goals Met</option>
              <option value="Improved">Improved / Step-down Outpatient Care</option>
              <option value="Transferred">Transferred to Specialized Facility</option>
              <option value="Against Medical Advice">Discharged Against Medical Advice (DAMA)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Discharge Summary</label>
            <textarea
              rows={3}
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              placeholder="Document discharge summary notes, medications, and follow-up plan..."
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDischargeModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDischarging}
              onClick={handleConfirmDischarge}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDischarging ? 'Releasing Bed...' : 'Confirm Discharge & Free Bed'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
