import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Plus, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Building2, 
  Filter, 
  Search,
  Sparkles,
  Info,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { BedStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export function BedManagementPage({ onNavigate }) {
  const { user } = useAuth();
  const { success, error: notifyError, warning } = useNotification();

  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWardFilter, setSelectedWardFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals
  const [addBedModalOpen, setAddBedModalOpen] = useState(false);
  const [editBedTarget, setEditBedTarget] = useState(null);
  const [newBedData, setNewBedData] = useState({
    bedNumber: '',
    wardType: 'General',
    wardName: 'General Medical Ward',
    floor: '1st Floor',
    department: 'General Medicine',
    dailyRate: 1500,
    features: 'Wall Oxygen, Nurse Call Button'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBedData = async () => {
    try {
      setLoading(true);
      const [bedsRes, statsRes, wardsRes] = await Promise.all([
        api.getBeds(),
        api.getBedStats(),
        api.getWards()
      ]);
      setBeds(bedsRes);
      setStats(statsRes);
      setWards(wardsRes);
    } catch (err) {
      console.error('Error fetching bed data:', err);
      notifyError('Failed to fetch bed status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBedData();
  }, []);

  const handleOpenMaintenance = (bed) => {
    if (bed.status === 'Occupied') {
      warning(`Bed ${bed.bedNumber} is currently occupied by patient ${bed.currentPatientName}. Please discharge or transfer the patient before initiating maintenance.`);
      return;
    }
    setEditBedTarget({
      ...bed,
      newStatus: bed.status === 'Maintenance' ? 'Available' : 'Maintenance',
      maintenanceNotes: bed.maintenanceNotes || ''
    });
  };

  const handleSaveBedUpdate = async () => {
    if (!editBedTarget) return;
    setIsSubmitting(true);
    try {
      await api.updateBed(editBedTarget.bedId, {
        status: editBedTarget.newStatus,
        maintenanceNotes: editBedTarget.maintenanceNotes,
        updatedBy: user?.name || 'Staff'
      });
      success(`Bed ${editBedTarget.bedNumber} updated to ${editBedTarget.newStatus}.`);
      setEditBedTarget(null);
      fetchBedData();
    } catch (err) {
      notifyError('Bed update failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBedSubmit = async (e) => {
    e.preventDefault();
    if (!newBedData.bedNumber.trim()) {
      notifyError('Bed number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedWard = wards.find(w => w.wardType === newBedData.wardType);
      const payload = {
        bedNumber: newBedData.bedNumber.trim(),
        wardType: newBedData.wardType,
        wardId: selectedWard?.wardId || 'WARD-GEN',
        wardName: selectedWard?.name || `${newBedData.wardType} Ward`,
        floor: newBedData.floor,
        department: newBedData.department,
        dailyRate: Number(newBedData.dailyRate) || 1500,
        features: newBedData.features.split(',').map(s => s.trim()).filter(Boolean),
        createdBy: user?.name || 'Admin'
      };

      const res = await api.addBed(payload);
      success(res.message);
      setAddBedModalOpen(false);
      setNewBedData({
        bedNumber: '',
        wardType: 'General',
        wardName: 'General Medical Ward',
        floor: '1st Floor',
        department: 'General Medicine',
        dailyRate: 1500,
        features: 'Wall Oxygen, Nurse Call Button'
      });
      fetchBedData();
    } catch (err) {
      notifyError('Failed to add bed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !stats) {
    return <LoadingSpinner text="Loading visual ward and bed occupancy matrix..." />;
  }

  // Filtered beds
  let filteredBeds = [...beds];
  if (selectedWardFilter) {
    filteredBeds = filteredBeds.filter(b => b.wardType === selectedWardFilter);
  }
  if (selectedStatusFilter) {
    filteredBeds = filteredBeds.filter(b => b.status === selectedStatusFilter);
  }

  // Group beds by ward
  const bedsByWard = {};
  wards.forEach(w => {
    bedsByWard[w.wardType] = {
      ward: w,
      beds: filteredBeds.filter(b => b.wardType === w.wardType)
    };
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Bed & Ward Management Matrix</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual ward occupancy grid, biomedical maintenance scheduling, and real-time bed allocation status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddBedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-soft transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hospital Bed</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Hospital Beds"
          value={stats.total}
          subtitle="All commissioned units"
          icon={Building2}
          color="teal"
        />
        <StatCard
          title="Available Beds"
          value={stats.available}
          subtitle="Ready for admission"
          icon={Bed}
          color="emerald"
        />
        <StatCard
          title="Occupied Beds"
          value={stats.occupied}
          subtitle={`${stats.occupancyRate}% utilization`}
          icon={Users}
          color="rose"
        />
        <StatCard
          title="Under Maintenance"
          value={stats.maintenance}
          subtitle="Servicing / Sterilization"
          icon={Wrench}
          color="amber"
        />
      </div>

      {/* Filter and Legend Controls */}
      <div className="bg-white rounded-2xl border border-hospital-border p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">All Wards & Units</option>
            <option value="ICU">Intensive Care Unit (ICU)</option>
            <option value="General">General Medical Ward</option>
            <option value="Semi-Private">Semi-Private Care Ward</option>
            <option value="Private">Deluxe Private Suite Ward</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available (Green)</option>
            <option value="Occupied">Occupied (Red)</option>
            <option value="Maintenance">Maintenance (Amber)</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600"></span>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* Ward Grouped Bed Visual Cards */}
      <div className="space-y-6">
        {Object.entries(bedsByWard).map(([wardType, { ward, beds: wardBeds }]) => {
          if (selectedWardFilter && wardType !== selectedWardFilter) return null;

          return (
            <div key={wardType} className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft">
              {/* Ward Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>{ward.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {ward.floor}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{ward.description}</p>
                </div>
                <div className="text-xs text-slate-500">
                  Nurse in Charge: <strong className="text-slate-800">{ward.nurseInCharge}</strong>
                </div>
              </div>

              {/* Grid of Bed Cards */}
              {wardBeds.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No beds match filter in this ward.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wardBeds.map(bed => {
                    let cardBorder = 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500';
                    let headerBg = 'bg-emerald-100/70 text-emerald-900';
                    let statusDot = 'bg-emerald-500';

                    if (bed.status === 'Occupied') {
                      cardBorder = 'border-rose-300 bg-rose-50/30 hover:border-rose-500';
                      headerBg = 'bg-rose-100/70 text-rose-900';
                      statusDot = 'bg-rose-500';
                    } else if (bed.status === 'Maintenance') {
                      cardBorder = 'border-amber-300 bg-amber-50/40 hover:border-amber-500';
                      headerBg = 'bg-amber-100/70 text-amber-900';
                      statusDot = 'bg-amber-500';
                    }

                    return (
                      <div
                        key={bed.bedId}
                        className={`rounded-xl border p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between ${cardBorder}`}
                      >
                        <div>
                          {/* Card Top */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-sm text-slate-800">{bed.bedNumber}</span>
                            <BedStatusBadge status={bed.status} />
                          </div>

                          {/* Occupant or features */}
                          {bed.status === 'Occupied' ? (
                            <div className="mt-2 p-2.5 bg-white rounded-lg border border-rose-200 text-xs">
                              <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Occupant</span>
                              <p className="font-bold text-slate-800 truncate">{bed.currentPatientName}</p>
                              <p className="text-[10px] font-mono text-slate-500">{bed.currentAdmissionId}</p>
                              <p className="text-[10px] text-teal-800 mt-1 font-semibold">{bed.department}</p>
                            </div>
                          ) : bed.status === 'Maintenance' ? (
                            <div className="mt-2 p-2.5 bg-white rounded-lg border border-amber-200 text-xs">
                              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Maintenance Status</span>
                              <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-2">
                                {bed.maintenanceNotes || 'Biomedical inspection in progress.'}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-2 p-2.5 bg-white rounded-lg border border-emerald-100 text-xs">
                              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Equipped Features</span>
                              <p className="text-slate-600 text-[11px] truncate">
                                {bed.features && bed.features.length ? bed.features.slice(0, 2).join(', ') : 'Standard telemetry'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">${bed.dailyRate}/day</p>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          {bed.status === 'Available' ? (
                            <button
                              onClick={() => handleOpenMaintenance(bed)}
                              className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Set Maintenance</span>
                            </button>
                          ) : bed.status === 'Maintenance' ? (
                            <button
                              onClick={() => handleOpenMaintenance(bed)}
                              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Clear to Available</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Active Inpatient</span>
                          )}

                          {bed.status === 'Available' && (
                            <button
                              onClick={() => onNavigate('new-admission')}
                              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                            >
                              <span>Allocate</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Bed Modal */}
      <Modal
        isOpen={addBedModalOpen}
        onClose={() => setAddBedModalOpen(false)}
        title="Commission New Hospital Bed"
        subtitle="Add a new physical or virtual bed to the facility inventory"
      >
        <form onSubmit={handleAddBedSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Bed Number / Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newBedData.bedNumber}
              onChange={(e) => setNewBedData({ ...newBedData, bedNumber: e.target.value })}
              required
              placeholder="e.g. ICU-107, GEN-209, PVT-405"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward Category</label>
              <select
                value={newBedData.wardType}
                onChange={(e) => setNewBedData({ ...newBedData, wardType: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="General">General Medical Ward</option>
                <option value="Semi-Private">Semi-Private Care Ward</option>
                <option value="Private">Deluxe Private Suite Ward</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Floor Level</label>
              <input
                type="text"
                value={newBedData.floor}
                onChange={(e) => setNewBedData({ ...newBedData, floor: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associated Department</label>
              <input
                type="text"
                value={newBedData.department}
                onChange={(e) => setNewBedData({ ...newBedData, department: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Daily Inpatient Rate ($)</label>
              <input
                type="number"
                value={newBedData.dailyRate}
                onChange={(e) => setNewBedData({ ...newBedData, dailyRate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Features (Comma separated)</label>
            <input
              type="text"
              value={newBedData.features}
              onChange={(e) => setNewBedData({ ...newBedData, features: e.target.value })}
              placeholder="e.g. Wall Oxygen, Invasive Ventilator, Cardiac Telemetry"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddBedModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Bed to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Bed / Maintenance Modal */}
      <Modal
        isOpen={!!editBedTarget}
        onClose={() => setEditBedTarget(null)}
        title="Update Bed Status & Servicing"
        subtitle={editBedTarget ? `Bed ${editBedTarget.bedNumber} (${editBedTarget.wardName})` : ''}
      >
        {editBedTarget && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Status</label>
              <select
                value={editBedTarget.newStatus}
                onChange={(e) => setEditBedTarget({ ...editBedTarget, newStatus: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800"
              >
                <option value="Available">Available (Cleared for admission)</option>
                <option value="Maintenance">Maintenance (Under repair / sterilization)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maintenance / Calibration Notes</label>
              <textarea
                rows={3}
                value={editBedTarget.maintenanceNotes}
                onChange={(e) => setEditBedTarget({ ...editBedTarget, maintenanceNotes: e.target.value })}
                placeholder="Reason for maintenance (e.g. Oxygen flow sensor replacement, deep disinfection, mattress change)..."
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditBedTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveBedUpdate}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Save Bed Status'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
