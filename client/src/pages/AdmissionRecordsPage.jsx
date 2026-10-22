import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Calendar, 
  User, 
  Bed, 
  Stethoscope, 
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { PriorityBadge, BedStatusBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState, LoadingSpinner } from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export function AdmissionRecordsPage({ onNavigate }) {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [viewAdmission, setViewAdmission] = useState(null);
  const [dischargeTarget, setDischargeTarget] = useState(null);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState('Recovered');
  const [isDischarging, setIsDischarging] = useState(false);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department = deptFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const data = await api.getAdmissions(params);
      setAdmissions(data);
    } catch (err) {
      console.error('Error fetching admissions:', err);
      notifyError('Failed to fetch admission records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmissions();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, deptFilter, priorityFilter]);

  const handleOpenDischarge = (adm) => {
    setDischargeTarget(adm);
    setDischargeNotes(`Patient completed treatment protocol under ${adm.attendingDoctor}. Symptoms resolved, hemodynamics stable.`);
    setDischargeCondition('Recovered');
  };

  const handleConfirmDischarge = async () => {
    if (!dischargeTarget) return;
    setIsDischarging(true);
    try {
      const res = await api.dischargePatient(dischargeTarget.admissionId, {
        dischargeSummary: dischargeNotes,
        dischargeCondition,
        performedBy: user?.name || 'Staff'
      });
      success(res.message);
      setDischargeTarget(null);
      fetchAdmissions();
    } catch (err) {
      notifyError('Discharge failed: ' + err.message);
    } finally {
      setIsDischarging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Admission Records & Inpatient Log</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track active ward admissions, review intake clinical orders, and process patient discharges with automatic bed releases.
          </p>
        </div>
        <button
          onClick={() => onNavigate('new-admission')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-soft transition-colors"
        >
          <Activity className="w-4 h-4" />
          <span>New Admission Intake</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-hospital-border p-4 shadow-soft flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Admission ID (ADM-...), patient name, bed number, or doctor..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="Admitted">Admitted (Active)</option>
            <option value="Discharged">Discharged (Historical)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">All Priorities</option>
            <option value="Emergency">Emergency</option>
            <option value="Urgent">Urgent</option>
            <option value="Routine">Routine</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">All Departments</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Pulmonology">Pulmonology</option>
          </select>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-2xl border border-hospital-border shadow-soft overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving patient admission logs and bed bindings..." />
        ) : admissions.length === 0 ? (
          <EmptyState
            title="No admission records found"
            description="No admissions match your filter criteria."
            actionLabel="Admit Patient"
            onAction={() => onNavigate('new-admission')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-50/70 border-b border-hospital-border text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 pl-6">Admission ID & Patient</th>
                  <th className="py-3.5 px-4">Admission Date & Time</th>
                  <th className="py-3.5 px-4">Department & Doctor</th>
                  <th className="py-3.5 px-4">Ward & Bed</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissions.map(adm => (
                  <tr key={adm.admissionId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-6">
                      <p className="font-bold text-slate-800">{adm.patientName}</p>
                      <p className="font-mono text-[10px] text-teal-700">{adm.admissionId} • {adm.patientId}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <p>{new Date(adm.admissionDate).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400">{adm.admissionTime || '09:00'}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{adm.department}</p>
                      <p className="text-[10px] text-slate-500">{adm.attendingDoctor}</p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {adm.assignedBedNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{adm.assignedWard}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <PriorityBadge priority={adm.admissionPriority} />
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.status === 'Admitted'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {adm.status}
                      </span>
                    </td>

                    <td className="py-3 pr-6 text-right space-x-1">
                      <button
                        onClick={() => setViewAdmission(adm)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        title="View clinical details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {adm.status === 'Admitted' && (
                        <button
                          onClick={() => handleOpenDischarge(adm)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors ml-1"
                        >
                          Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Admission Details Modal */}
      <Modal
        isOpen={!!viewAdmission}
        onClose={() => setViewAdmission(null)}
        title="Clinical Admission Record"
        subtitle={viewAdmission ? `${viewAdmission.admissionId} • ${viewAdmission.patientName}` : ''}
        maxWidth="max-w-3xl"
      >
        {viewAdmission && (
          <div className="space-y-4 text-xs">
            {/* Status ribbon */}
            <div className="p-3 bg-warm-100 border border-warm-300 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Admission Status</span>
                <p className="text-sm font-bold text-slate-900">{viewAdmission.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={viewAdmission.admissionPriority} />
                <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-teal-900 font-bold">
                  Bed {viewAdmission.assignedBedNumber}
                </span>
              </div>
            </div>

            {/* Vitals Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-2">
                Recorded Vitals on Admission
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">BP</span>
                  <strong className="text-slate-800">{viewAdmission.vitals?.bpSystolic}/{viewAdmission.vitals?.bpDiastolic}</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Heart Rate</span>
                  <strong className="text-slate-800">{viewAdmission.vitals?.heartRate} bpm</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Resp Rate</span>
                  <strong className="text-slate-800">{viewAdmission.vitals?.respRate}/min</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">SpO2</span>
                  <strong className="text-slate-800">{viewAdmission.vitals?.spo2}%</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Temperature</span>
                  <strong className="text-slate-800">{viewAdmission.vitals?.temperature}°C</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">NEWS2 Score</span>
                  <strong className="text-teal-800">{viewAdmission.vitals?.newsScore || 'Calculated'}</strong>
                </div>
              </div>
            </div>

            {/* Chief complaint & Clinical notes */}
            <div className="space-y-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-700 block mb-0.5">Chief Complaint / Reason for Admission:</span>
                <p className="text-slate-800 leading-relaxed">{viewAdmission.reasonForAdmission}</p>
              </div>

              {viewAdmission.admissionNotes && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-700 block mb-0.5">Admission Intake Orders & Notes:</span>
                  <p className="text-slate-800 leading-relaxed">{viewAdmission.admissionNotes}</p>
                </div>
              )}
            </div>

            {/* If Discharged, show discharge details */}
            {viewAdmission.status === 'Discharged' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">
                  Discharge Summary & Release Record
                </span>
                <p className="text-emerald-800 font-semibold">
                  Discharged on {new Date(viewAdmission.dischargeDate).toLocaleDateString()} at {viewAdmission.dischargeTime} • Condition: {viewAdmission.dischargeCondition}
                </p>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  {viewAdmission.dischargeSummary}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewAdmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close Record
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Discharge Action Modal */}
      <Modal
        isOpen={!!dischargeTarget}
        onClose={() => setDischargeTarget(null)}
        title="Discharge Patient & Release Bed"
        subtitle={dischargeTarget ? `${dischargeTarget.patientName} • Bed ${dischargeTarget.assignedBedNumber}` : ''}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <p className="font-bold text-amber-800">AUTOMATIC BED RELEASE CONFIRMATION</p>
            <p className="text-[11px] mt-0.5">
              Confirming discharge will mark this admission as completed and release Bed <strong>{dischargeTarget?.assignedBedNumber}</strong> back to the Available inventory.
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
              <option value="Improved">Improved / Outpatient Follow-up Scheduled</option>
              <option value="Transferred">Transferred to Tertiary Center</option>
              <option value="Against Medical Advice">Discharged Against Medical Advice (DAMA)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Discharge Notes</label>
            <textarea
              rows={3}
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDischargeTarget(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDischarging}
              onClick={handleConfirmDischarge}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
            >
              {isDischarging ? 'Releasing Bed...' : 'Confirm Discharge & Free Bed'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
