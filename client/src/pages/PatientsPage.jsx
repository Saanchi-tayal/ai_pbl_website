import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Eye, 
  Edit3, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  Calendar,
  Activity,
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState, LoadingSpinner } from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export function PatientsPage({ onNavigate }) {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Modals state
  const [viewPatient, setViewPatient] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.admissionStatus = statusFilter;
      if (genderFilter) params.gender = genderFilter;

      const data = await api.getPatients(params);
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      notifyError('Failed to fetch patients list: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, genderFilter]);

  const handleOpenView = async (patient) => {
    try {
      // Fetch full details with admission history
      const full = await api.getPatientById(patient.patientId);
      setViewPatient(full);
    } catch (err) {
      setViewPatient(patient);
    }
  };

  const handleOpenEdit = (patient) => {
    setEditPatient({
      ...patient,
      emergencyName: patient.emergencyContact?.name || '',
      emergencyRelation: patient.emergencyContact?.relation || '',
      emergencyPhone: patient.emergencyContact?.phone || '',
      allergiesString: (patient.allergies || []).join(', ')
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editPatient) return;
    setIsUpdating(true);
    try {
      const allergiesList = editPatient.allergiesString
        ? editPatient.allergiesString.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: editPatient.name,
        phone: editPatient.phone,
        email: editPatient.email,
        address: editPatient.address,
        bloodGroup: editPatient.bloodGroup,
        allergies: allergiesList,
        medicalHistory: editPatient.medicalHistory,
        emergencyContact: {
          name: editPatient.emergencyName,
          relation: editPatient.emergencyRelation,
          phone: editPatient.emergencyPhone
        },
        updatedBy: user?.name || 'Staff'
      };

      await api.updatePatient(editPatient.patientId, payload);
      success(`Patient ${editPatient.name} updated successfully.`);
      setEditPatient(null);
      fetchPatients();
    } catch (err) {
      notifyError('Update failed: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Patient Directory & Medical Records</h2>
          <p className="text-xs text-slate-500 mt-1">
            Search registered hospital patients, inspect historical admissions, and update contact profiles.
          </p>
        </div>
        <button
          onClick={() => onNavigate('patient-register')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-soft transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-hospital-border p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, Patient ID (PAT-...), or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">All Admission Statuses</option>
            <option value="Admitted">Admitted</option>
            <option value="Not Admitted">Not Admitted</option>
            <option value="Discharged">Discharged</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-hospital-border shadow-soft overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Querying registered patient database..." />
        ) : patients.length === 0 ? (
          <EmptyState
            title="No patients found"
            description="No registered patients match your search query or filters."
            actionLabel="Register Patient"
            onAction={() => onNavigate('patient-register')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-50/70 border-b border-hospital-border text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 pl-6">Patient ID & Name</th>
                  <th className="py-3.5 px-4">Age / Gender</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4">Admission Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map(p => {
                  let statusVariant = 'default';
                  if (p.admissionStatus === 'Admitted') statusVariant = 'danger';
                  else if (p.admissionStatus === 'Discharged') statusVariant = 'info';
                  else statusVariant = 'success';

                  return (
                    <tr key={p.patientId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{p.name}</p>
                            <p className="font-mono text-[10px] text-teal-700">{p.patientId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {p.age} yrs • {p.gender}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.phone}</span>
                        </p>
                        {p.email && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{p.email}</span>
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {p.bloodGroup || 'Unknown'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(p.registrationDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={statusVariant}>
                          {p.admissionStatus}
                        </Badge>
                      </td>

                      <td className="py-3 pr-6 text-right space-x-1">
                        <button
                          onClick={() => handleOpenView(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="View patient clinical history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="Edit patient demographics"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {p.admissionStatus !== 'Admitted' && (
                          <button
                            onClick={() => onNavigate('new-admission', { preselectedPatientId: p.patientId })}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors ml-1"
                            title="Create new admission for this patient"
                          >
                            Admit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Patient Details Modal */}
      <Modal
        isOpen={!!viewPatient}
        onClose={() => setViewPatient(null)}
        title="Patient Medical Profile"
        subtitle={viewPatient ? `${viewPatient.name} • ID: ${viewPatient.patientId}` : ''}
        maxWidth="max-w-3xl"
      >
        {viewPatient && (
          <div className="space-y-5 text-xs">
            {/* Quick status bar */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Current Admission Status</span>
                <p className="text-sm font-bold text-teal-950 mt-0.5">{viewPatient.admissionStatus}</p>
                {viewPatient.currentBedId && (
                  <p className="text-xs text-teal-800 font-semibold mt-0.5">
                    Assigned Bed: {viewPatient.currentBedId} • Attending: {viewPatient.assignedDoctor || 'Assigned Physician'}
                  </p>
                )}
              </div>
              <Badge variant={viewPatient.admissionStatus === 'Admitted' ? 'danger' : 'success'} size="lg">
                {viewPatient.admissionStatus}
              </Badge>
            </div>

            {/* Demographics & Emergency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider text-[10px]">
                  Demographics & Contact
                </h4>
                <p><strong className="text-slate-600">Age / Gender:</strong> {viewPatient.age} yrs • {viewPatient.gender}</p>
                <p><strong className="text-slate-600">Date of Birth:</strong> {viewPatient.dateOfBirth}</p>
                <p><strong className="text-slate-600">Phone:</strong> {viewPatient.phone}</p>
                <p><strong className="text-slate-600">Email:</strong> {viewPatient.email || 'None recorded'}</p>
                <p><strong className="text-slate-600">Address:</strong> {viewPatient.address}</p>
                <p><strong className="text-slate-600">Blood Group:</strong> {viewPatient.bloodGroup}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider text-[10px]">
                  Emergency Contact Details
                </h4>
                <p><strong className="text-slate-600">Contact Person:</strong> {viewPatient.emergencyContact?.name || 'N/A'}</p>
                <p><strong className="text-slate-600">Relationship:</strong> {viewPatient.emergencyContact?.relation || 'N/A'}</p>
                <p><strong className="text-slate-600">Emergency Phone:</strong> {viewPatient.emergencyContact?.phone || 'N/A'}</p>
                
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pt-2 pb-1 uppercase tracking-wider text-[10px]">
                  Allergies & Medical History
                </h4>
                <p>
                  <strong className="text-slate-600">Known Allergies:</strong>{' '}
                  {viewPatient.allergies && viewPatient.allergies.length > 0 ? (
                    <span className="text-rose-700 font-semibold">{viewPatient.allergies.join(', ')}</span>
                  ) : (
                    'No known allergies'
                  )}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-600">History:</strong> {viewPatient.medicalHistory || 'No prior medical conditions reported.'}
                </p>
              </div>
            </div>

            {/* Inpatient Admission History */}
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-600" />
                <span>Admission History Records</span>
              </h4>
              {(!viewPatient.admissionHistory || viewPatient.admissionHistory.length === 0) ? (
                <p className="text-slate-400 italic py-2">No historical inpatient admissions recorded for this patient.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewPatient.admissionHistory.map(adm => (
                    <div key={adm.admissionId} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{adm.admissionId}</span>
                          <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded">
                            {adm.assignedBedNumber} ({adm.assignedWard})
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{adm.reasonForAdmission}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Admitted: {new Date(adm.admissionDate).toLocaleDateString()} under {adm.attendingDoctor}
                        </p>
                      </div>
                      <Badge variant={adm.status === 'Admitted' ? 'danger' : 'default'}>
                        {adm.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewPatient(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={!!editPatient}
        onClose={() => setEditPatient(null)}
        title="Edit Patient Demographics"
        subtitle={editPatient ? `Updating ${editPatient.name} (${editPatient.patientId})` : ''}
      >
        {editPatient && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={editPatient.name}
                onChange={(e) => setEditPatient({ ...editPatient, name: e.target.value })}
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Phone</label>
                <input
                  type="tel"
                  value={editPatient.phone}
                  onChange={(e) => setEditPatient({ ...editPatient, phone: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editPatient.email}
                  onChange={(e) => setEditPatient({ ...editPatient, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={editPatient.address}
                onChange={(e) => setEditPatient({ ...editPatient, address: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Name</label>
                <input
                  type="text"
                  value={editPatient.emergencyName}
                  onChange={(e) => setEditPatient({ ...editPatient, emergencyName: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relation</label>
                <input
                  type="text"
                  value={editPatient.emergencyRelation}
                  onChange={(e) => setEditPatient({ ...editPatient, emergencyRelation: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  value={editPatient.emergencyPhone}
                  onChange={(e) => setEditPatient({ ...editPatient, emergencyPhone: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Known Allergies (Comma separated)</label>
              <input
                type="text"
                value={editPatient.allergiesString}
                onChange={(e) => setEditPatient({ ...editPatient, allergiesString: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medical History</label>
              <textarea
                rows={2}
                value={editPatient.medicalHistory}
                onChange={(e) => setEditPatient({ ...editPatient, medicalHistory: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditPatient(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
