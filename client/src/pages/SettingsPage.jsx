import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Stethoscope, 
  Shield, 
  RotateCcw, 
  Save, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();
  const { success, error: notifyError, warning } = useNotification();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [storageStatus, setStorageStatus] = useState(null);

  // Modals
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [newDeptData, setNewDeptData] = useState({ name: '', headOfDepartment: '', description: '', phoneExtension: '' });

  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [newDocData, setNewDocData] = useState({ name: '', specialization: '', department: 'General Medicine', phone: '', email: '' });

  const [isResetting, setIsResetting] = useState(false);
  const [isSavingHospital, setIsSavingHospital] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setSettings(res.settings);
      setDepartments(res.departments);
      setDoctors(res.doctors);
      setWards(res.wards);
      setStorageStatus(res.storageStatus);
    } catch (err) {
      console.error('Error fetching settings:', err);
      notifyError('Failed to load settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveHospitalSettings = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Admin') {
      warning('Administrative privilege required to update hospital configuration.');
      return;
    }

    setIsSavingHospital(true);
    try {
      await api.updateSettings({ ...settings, updatedBy: user?.name || 'Admin' });
      success('Hospital configuration updated successfully.');
    } catch (err) {
      notifyError('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingHospital(false);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addDepartment(newDeptData);
      success(res.message);
      setAddDeptModalOpen(false);
      setNewDeptData({ name: '', headOfDepartment: '', description: '', phoneExtension: '' });
      fetchSettings();
    } catch (err) {
      notifyError('Failed to create department: ' + err.message);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addDoctor(newDocData);
      success(res.message);
      setAddDocModalOpen(false);
      setNewDocData({ name: '', specialization: '', department: 'General Medicine', phone: '', email: '' });
      fetchSettings();
    } catch (err) {
      notifyError('Failed to add doctor: ' + err.message);
    }
  };

  const handleResetSampleData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all patients, admissions, beds, and activity logs back to the initial sample dataset? Any unsaved changes will be replaced.'
    );
    if (!confirmed) return;

    setIsResetting(true);
    try {
      const res = await api.resetDemoData();
      success(res.message);
      fetchSettings();
    } catch (err) {
      notifyError('Reset failed: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading || !settings) {
    return <LoadingSpinner text="Loading master facility configuration..." />;
  }

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Hospital Settings & Master Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Facility parameters, clinical departments, physician directory, and college demonstration controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSampleData}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors disabled:opacity-50"
            title="Reset database to clean initial demonstration dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Resetting Data...' : 'Reset to Sample Data'}</span>
          </button>
        </div>
      </div>

      {/* Storage and System Diagnosis Pill */}
      {storageStatus && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-teal-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-teal-950">Backend Storage Mode: {storageStatus.mode}</p>
              <p className="text-[11px] text-teal-700">
                Data persistence path: <code className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono text-[10px]">{storageStatus.dataFile}</code>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-lg border border-teal-200 text-teal-800">
            {storageStatus.totalPatients} Patients • {storageStatus.totalBeds} Beds • {storageStatus.totalAdmissions} Admissions
          </span>
        </div>
      )}

      {/* Hospital Metadata Form */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span>Facility Profile & Accreditation</span>
          </h3>
          {!isAdmin && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              Admin Only Edit
            </span>
          )}
        </div>

        <form onSubmit={handleSaveHospitalSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital / Medical Center Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.hospitalName || ''}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Licensing / Registration No.</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.registrationNumber || ''}
                onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency 24/7 Hotline</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.emergencyHotline || ''}
                onChange={(e) => setSettings({ ...settings, emergencyHotline: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Accreditation Details</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.accreditation || ''}
                onChange={(e) => setSettings({ ...settings, accreditation: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium disabled:opacity-75"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Physical Campus Address</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium disabled:opacity-75"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingHospital}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingHospital ? 'Saving...' : 'Save Hospital Configuration'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Departments & Doctors Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Department Directory */}
        <div className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Departments ({departments.length})</span>
            </h3>
            {isAdmin && (
              <button
                onClick={() => setAddDeptModalOpen(true)}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Department</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
            {departments.map(dept => (
              <div key={dept.departmentId} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{dept.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">Ext: {dept.phoneExtension}</span>
                </div>
                <p className="text-[11px] text-teal-800 font-medium mt-0.5">Head: {dept.headOfDepartment}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Directory */}
        <div className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Physicians & Doctors ({doctors.length})</span>
            </h3>
            {isAdmin && (
              <button
                onClick={() => setAddDocModalOpen(true)}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Doctor</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
            {doctors.map(doc => (
              <div key={doc.doctorId} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{doc.name}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                    {doc.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  {doc.specialization} • <strong>{doc.department}</strong>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{doc.email} • {doc.phone}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Role & Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft space-y-3">
        <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Shield className="w-4 h-4" />
          <span>Role-Based Access Control (RBAC) Permissions Matrix</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase font-semibold">
                <th className="py-2.5 pl-2">System Permission / Feature</th>
                <th className="py-2.5 text-center">Admin</th>
                <th className="py-2.5 text-center">Receptionist</th>
                <th className="py-2.5 text-center">Doctor / Clinician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2 pl-2 font-medium">Register & Edit Patients</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2 pl-2 font-medium">Create Admissions & Lock Beds</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2 pl-2 font-medium">Discharge Patients & Free Beds</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
                <td className="py-2 text-center text-slate-400">View Only</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-2 pl-2 font-medium">Add Beds & Maintenance Status</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
                <td className="py-2 text-center text-slate-400">View Only</td>
                <td className="py-2 text-center text-slate-400">View Only</td>
              </tr>
              <tr>
                <td className="py-2 pl-2 font-medium">Manage Departments & Doctor Accounts</td>
                <td className="py-2 text-center text-emerald-600 font-bold">Yes</td>
                <td className="py-2 text-center text-slate-400">No</td>
                <td className="py-2 text-center text-slate-400">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={addDeptModalOpen}
        onClose={() => setAddDeptModalOpen(false)}
        title="Create New Clinical Department"
        subtitle="Expand the hospital specialty directory"
      >
        <form onSubmit={handleAddDepartment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              value={newDeptData.name}
              onChange={(e) => setNewDeptData({ ...newDeptData, name: e.target.value })}
              required
              placeholder="e.g. Oncology, Nephrology, Dermatology"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Head of Department</label>
            <input
              type="text"
              value={newDeptData.headOfDepartment}
              onChange={(e) => setNewDeptData({ ...newDeptData, headOfDepartment: e.target.value })}
              placeholder="e.g. Dr. Alexander Scott, MD"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Extension</label>
            <input
              type="text"
              value={newDeptData.phoneExtension}
              onChange={(e) => setNewDeptData({ ...newDeptData, phoneExtension: e.target.value })}
              placeholder="e.g. 4200"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Scope & Description</label>
            <textarea
              rows={2}
              value={newDeptData.description}
              onChange={(e) => setNewDeptData({ ...newDeptData, description: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddDeptModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold"
            >
              Create Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Doctor Modal */}
      <Modal
        isOpen={addDocModalOpen}
        onClose={() => setAddDocModalOpen(false)}
        title="Onboard Attending Physician"
        subtitle="Add doctor to the hospital medical staff registry"
      >
        <form onSubmit={handleAddDoctor} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
            <input
              type="text"
              value={newDocData.name}
              onChange={(e) => setNewDocData({ ...newDocData, name: e.target.value })}
              required
              placeholder="e.g. Dr. Emily Watson, MD"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Specialization *</label>
              <input
                type="text"
                value={newDocData.specialization}
                onChange={(e) => setNewDocData({ ...newDocData, specialization: e.target.value })}
                required
                placeholder="e.g. Interventional Cardiology"
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={newDocData.department}
                onChange={(e) => setNewDocData({ ...newDocData, department: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                {departments.map(d => (
                  <option key={d.departmentId} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={newDocData.phone}
                onChange={(e) => setNewDocData({ ...newDocData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={newDocData.email}
                onChange={(e) => setNewDocData({ ...newDocData, email: e.target.value })}
                placeholder="doctor@pams.hospital"
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddDocModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold"
            >
              Add Doctor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
