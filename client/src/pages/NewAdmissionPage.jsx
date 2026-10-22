import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  UserCheck, 
  Bed, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Stethoscope, 
  ShieldCheck,
  Building2,
  FileText,
  Printer,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { PriorityBadge, BedStatusBadge } from '../components/common/Badge';
import { ClinicalSafetyBanner } from '../components/common/ClinicalSafetyBanner';
import { Modal } from '../components/common/Modal';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export function NewAdmissionPage({ onNavigate, preselectedPatientId }) {
  const { user } = useAuth();
  const { success, error: notifyError, warning } = useNotification();

  // Data collections
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [allBeds, setAllBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Patient
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Form Inputs
  const [formData, setFormData] = useState({
    admissionDate: new Date().toISOString().slice(0, 10),
    admissionTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    reasonForAdmission: '',
    department: 'General Medicine',
    attendingDoctor: '',
    admissionPriority: 'Routine',
    wardType: 'General',
    assignedBedId: '',
    admissionNotes: '',
    vitals: {
      bpSystolic: '120',
      bpDiastolic: '80',
      heartRate: '76',
      respRate: '16',
      spo2: '98',
      temperature: '37.0'
    }
  });

  // AI Assist State
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiTriageResult, setAiTriageResult] = useState(null);
  const [aiBedRecommendation, setAiBedRecommendation] = useState(null);

  // Confirmation Modal
  const [confirmedAdmission, setConfirmedAdmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        setLoading(true);
        const [patientsData, bedsData, settingsData] = await Promise.all([
          api.getPatients(),
          api.getBeds(),
          api.getSettings()
        ]);

        setPatients(patientsData);
        setAllBeds(bedsData);
        setDepartments(settingsData.departments || []);
        setDoctors(settingsData.doctors || []);

        // Handle preselected patient
        if (preselectedPatientId) {
          const match = patientsData.find(p => p.patientId === preselectedPatientId);
          if (match) {
            setSelectedPatient(match);
            setSelectedPatientId(match.patientId);
          }
        }
      } catch (err) {
        console.error('Error loading admission prerequisites:', err);
        notifyError('Failed to initialize intake form: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrerequisites();
  }, [preselectedPatientId]);

  // Handle patient selection change
  const handleSelectPatient = (pId) => {
    setSelectedPatientId(pId);
    const match = patients.find(p => p.patientId === pId);
    setSelectedPatient(match || null);
    if (match && match.admissionStatus === 'Admitted') {
      warning(`Caution: Patient ${match.name} is already listed as Admitted in Bed ${match.currentBedId}.`);
    }
  };

  // Filter available doctors by department
  const filteredDoctors = doctors.filter(d => 
    !formData.department || d.department.toLowerCase() === formData.department.toLowerCase()
  );

  // Available beds in the hospital (STRICT RULE: Exclude Occupied & Maintenance)
  const availableBeds = allBeds.filter(b => b.status === 'Available');

  // Available beds matching current ward type filter
  const wardFilteredAvailableBeds = availableBeds.filter(b => 
    !formData.wardType || b.wardType === formData.wardType
  );

  // Handle AI Triage & Recommendation Assist
  const handleRunAiAssist = async () => {
    if (!formData.reasonForAdmission.trim()) {
      warning('Please enter the reason for admission or primary symptoms first to enable AI triage analysis.');
      return;
    }

    setIsAiEvaluating(true);
    try {
      // 1. Evaluate Priority & NEWS score
      const triageRes = await api.aiTriage({
        vitals: formData.vitals,
        symptoms: formData.reasonForAdmission.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean),
        reasonForAdmission: formData.reasonForAdmission,
        age: selectedPatient?.age || 40,
        gender: selectedPatient?.gender || 'Male'
      });

      // 2. Department Recommendation
      const deptRes = await api.aiDepartment({
        reasonForAdmission: formData.reasonForAdmission,
        symptoms: [formData.reasonForAdmission],
        age: selectedPatient?.age || 40
      });

      // 3. Bed Recommendation
      const bedRes = await api.aiRecommendBed({
        priority: triageRes.assessment.suggestedPriority,
        department: deptRes.recommendation.recommendedDepartment,
        wardTypePreference: triageRes.assessment.suggestedPriority === 'Emergency' ? 'ICU' : formData.wardType,
        patientGender: selectedPatient?.gender
      });

      setAiTriageResult(triageRes.assessment);
      setAiBedRecommendation(bedRes.recommendation);

      // Auto-populate form suggestions if user approves
      setFormData(prev => ({
        ...prev,
        admissionPriority: triageRes.assessment.suggestedPriority,
        department: deptRes.recommendation.recommendedDepartment,
        wardType: bedRes.recommendation.preferredWardType || prev.wardType,
        assignedBedId: bedRes.recommendation.bestBed ? bedRes.recommendation.bestBed.bedId : prev.assignedBedId
      }));

      success(`AI Triage complete: Suggested priority is ${triageRes.assessment.suggestedPriority}. Best department: ${deptRes.recommendation.recommendedDepartment}.`);
    } catch (err) {
      console.error('AI assistant error:', err);
      notifyError('AI evaluation failed: ' + err.message);
    } finally {
      setIsAiEvaluating(false);
    }
  };

  // Submit Admission
  const handleSubmitAdmission = async (e) => {
    e.preventDefault();

    if (!selectedPatientId) {
      notifyError('Please select a registered patient.');
      return;
    }

    if (selectedPatient?.admissionStatus === 'Admitted') {
      notifyError(`Cannot admit: Patient ${selectedPatient.name} is already admitted.`);
      return;
    }

    if (!formData.assignedBedId) {
      notifyError('Please select an available bed. Bed allocation is required.');
      return;
    }

    // STRICT CHECK: Verify selected bed is available in live memory
    const targetBed = allBeds.find(b => b.bedId === formData.assignedBedId);
    if (!targetBed || targetBed.status !== 'Available') {
      notifyError(`CONCURRENCY ERROR: Bed ${targetBed ? targetBed.bedNumber : formData.assignedBedId} is no longer available. Please select another bed.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        admissionDate: formData.admissionDate,
        admissionTime: formData.admissionTime,
        reasonForAdmission: formData.reasonForAdmission,
        symptoms: formData.reasonForAdmission.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean),
        vitals: formData.vitals,
        department: formData.department,
        attendingDoctor: formData.attendingDoctor || (filteredDoctors[0]?.name || 'Dr. Arthur Sterling'),
        doctorSpecialty: formData.department,
        admissionPriority: formData.admissionPriority,
        wardType: formData.wardType,
        assignedBedId: formData.assignedBedId,
        admissionNotes: formData.admissionNotes,
        aiTriageAssessment: aiTriageResult ? {
          suggestedPriority: aiTriageResult.suggestedPriority,
          triageScore: aiTriageResult.score,
          rationale: aiTriageResult.rationale,
          factors: aiTriageResult.factors,
          suggestedDepartment: formData.department,
          isAiAssisted: true
        } : null,
        createdBy: user?.name || 'Staff'
      };

      const res = await api.createAdmission(payload);
      success(res.message);
      setConfirmedAdmission(res.admission);

      // Refresh bed list to reflect new occupancy
      const refreshedBeds = await api.getBeds();
      setAllBeds(refreshedBeds);
    } catch (err) {
      notifyError('Admission could not be processed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Patient Admission & Bed Allocation</h2>
          <p className="text-xs text-slate-500 mt-1">
            Conduct intake assessment, calculate AI priority recommendation, and lock available ward beds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {availableBeds.length} Beds Available Right Now
          </span>
        </div>
      </div>

      {/* Main Admission Form */}
      <form onSubmit={handleSubmitAdmission} className="space-y-6">
        
        {/* Step 1: Patient Selection */}
        <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
            <span>1. Patient Identification & Medical History</span>
            <button
              type="button"
              onClick={() => onNavigate('patient-register')}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold lowercase"
            >
              + register new patient
            </button>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Registered Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
              >
                <option value="">-- Choose patient from directory --</option>
                {patients.map(p => (
                  <option 
                    key={p.patientId} 
                    value={p.patientId}
                    disabled={p.admissionStatus === 'Admitted'}
                  >
                    {p.name} ({p.patientId}) - Age {p.age} - Status: {p.admissionStatus}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950">{selectedPatient.name}</span>
                  <span className="font-mono text-[10px] text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 font-bold">
                    {selectedPatient.patientId}
                  </span>
                </div>
                <p className="text-teal-800">
                  {selectedPatient.age} yrs • {selectedPatient.gender} • Blood Group: <strong>{selectedPatient.bloodGroup}</strong>
                </p>
                <p className="text-teal-700 text-[11px] truncate">
                  Allergies: {selectedPatient.allergies?.length ? selectedPatient.allergies.join(', ') : 'None'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Clinical Intake & Vitals */}
        <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              2. Clinical Reason & Intake Vitals
            </h3>
            <button
              type="button"
              onClick={handleRunAiAssist}
              disabled={isAiEvaluating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-soft transition-all duration-150 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAiEvaluating ? 'Analyzing Vitals...' : 'AI Triage & Bed Assist'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chief Complaint / Reason for Admission <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={formData.reasonForAdmission}
              onChange={(e) => setFormData({ ...formData, reasonForAdmission: e.target.value })}
              placeholder="e.g. Acute severe substernal crushing chest pain, diaphoresis, shortness of breath for 2 hours..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
            />
          </div>

          {/* Vitals Input Grid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Baseline Physiological Vitals (Used for Modified NEWS2 Clinical Scoring)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">Systolic BP</label>
                <input
                  type="number"
                  value={formData.vitals.bpSystolic}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, bpSystolic: e.target.value } })}
                  placeholder="120"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-center"
                />
                <span className="block text-[9px] text-slate-400 text-center mt-0.5">mmHg</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600">Diastolic BP</label>
                <input
                  type="number"
                  value={formData.vitals.bpDiastolic}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, bpDiastolic: e.target.value } })}
                  placeholder="80"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-center"
                />
                <span className="block text-[9px] text-slate-400 text-center mt-0.5">mmHg</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600">Heart Rate</label>
                <input
                  type="number"
                  value={formData.vitals.heartRate}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, heartRate: e.target.value } })}
                  placeholder="75"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-center"
                />
                <span className="block text-[9px] text-slate-400 text-center mt-0.5">bpm</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600">Resp Rate</label>
                <input
                  type="number"
                  value={formData.vitals.respRate}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, respRate: e.target.value } })}
                  placeholder="16"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-center"
                />
                <span className="block text-[9px] text-slate-400 text-center mt-0.5">/min</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600">SpO2 (Pulse Ox)</label>
                <input
                  type="number"
                  value={formData.vitals.spo2}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, spo2: e.target.value } })}
                  placeholder="98"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-center"
                />
                <span className="block text-[9px] text-slate-400 text-center mt-0.5">% O2</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vitals.temperature}
                  onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temperature: e.target.value } })}
                  placeholder="37.0"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-center"
                />
                <span className="block text-[9px] text-slate-400 text-center mt-0.5">°Celsius</span>
              </div>
            </div>
          </div>

          {/* AI Triage Result Display */}
          {aiTriageResult && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  AI Suggested Priority:
                </span>
                <PriorityBadge priority={aiTriageResult.suggestedPriority} />
              </div>
              <p className="text-teal-800 font-medium">{aiTriageResult.rationale}</p>
              <div className="pt-2 border-t border-teal-100">
                <span className="font-bold text-[10px] uppercase tracking-wider text-teal-700">Contributing Clinical Factors:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 text-[11px]">
                  {aiTriageResult.factors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Emergency Safety Alert */}
          {aiTriageResult?.isEmergency && (
            <ClinicalSafetyBanner isEmergency={true} />
          )}
        </div>

        {/* Step 3: Department & Attending Doctor */}
        <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Department & Medical Attending Physician
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
              >
                {departments.map(d => (
                  <option key={d.departmentId} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Physician <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.attendingDoctor}
                onChange={(e) => setFormData({ ...formData, attendingDoctor: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
              >
                <option value="">-- Choose attending doctor --</option>
                {filteredDoctors.map(doc => (
                  <option key={doc.doctorId} value={doc.name}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Priority Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.admissionPriority}
                onChange={(e) => setFormData({ ...formData, admissionPriority: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold text-slate-800"
              >
                <option value="Routine">Routine Admission</option>
                <option value="Urgent">Urgent Review</option>
                <option value="Emergency">Emergency Resuscitation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 4: Strict Bed & Ward Allocation */}
        <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              4. Bed & Ward Allocation (Strict Double-Booking Lock)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Only Available beds selectable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filter by Ward Category
              </label>
              <select
                value={formData.wardType}
                onChange={(e) => setFormData({ ...formData, wardType: e.target.value, assignedBedId: '' })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
              >
                <option value="">All Wards ({availableBeds.length} available)</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="General">General Medical Ward</option>
                <option value="Semi-Private">Semi-Private Care Ward</option>
                <option value="Private">Deluxe Private Suite Ward</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Available Bed <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.assignedBedId}
                onChange={(e) => setFormData({ ...formData, assignedBedId: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold text-teal-900"
              >
                <option value="">-- Select an available bed --</option>
                {wardFilteredAvailableBeds.map(b => (
                  <option key={b.bedId} value={b.bedId}>
                    Bed {b.bedNumber} ({b.wardName}) - ${b.dailyRate}/day
                  </option>
                ))}
              </select>
              {wardFilteredAvailableBeds.length === 0 && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  No beds are currently available in this selected ward category! Please select another ward type.
                </p>
              )}
            </div>
          </div>

          {/* AI Recommended Bed Highlight */}
          {aiBedRecommendation?.bestBed && (
            <div className="p-3 bg-warm-100/70 border border-warm-300 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-teal-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  AI Suggested Optimal Bed:
                </span>
                <p className="text-slate-700 mt-0.5">
                  Bed <strong>{aiBedRecommendation.bestBed.bedNumber}</strong> in {aiBedRecommendation.bestBed.wardName} (Match Score: {aiBedRecommendation.bestBed.fitScore}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignedBedId: aiBedRecommendation.bestBed.bedId, wardType: aiBedRecommendation.bestBed.wardType })}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-teal-800 font-bold hover:bg-teal-50 transition-colors shadow-2xs"
              >
                Apply Bed
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Intake Notes</label>
            <textarea
              rows={2}
              value={formData.admissionNotes}
              onChange={(e) => setFormData({ ...formData, admissionNotes: e.target.value })}
              placeholder="Clinical orders, diet instructions, continuous telemetry required, nurse instructions..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !formData.assignedBedId}
            className="px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-soft transition-all duration-150 flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Verifying & Locking Bed...' : 'Confirm Patient Admission & Lock Bed'}</span>
          </button>
        </div>

      </form>

      {/* Confirmation & Admission ID Card Modal */}
      <Modal
        isOpen={!!confirmedAdmission}
        onClose={() => setConfirmedAdmission(null)}
        title="Admission Confirmed & Bed Locked"
        subtitle={`Official Inpatient Admission Record: ${confirmedAdmission?.admissionId}`}
        maxWidth="max-w-2xl"
      >
        {confirmedAdmission && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Admission Successfully Processed (ID: {confirmedAdmission.admissionId})
                </h4>
                <p className="text-emerald-700 mt-0.5">
                  Patient <strong>{confirmedAdmission.patientName}</strong> has been admitted and Bed <strong>{confirmedAdmission.assignedBedNumber}</strong> is now locked.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Patient ID</span>
                <p className="font-bold text-slate-800">{confirmedAdmission.patientId}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Priority Level</span>
                <div className="mt-0.5"><PriorityBadge priority={confirmedAdmission.admissionPriority} /></div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Department</span>
                <p className="font-bold text-slate-800">{confirmedAdmission.department}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Attending Doctor</span>
                <p className="font-bold text-slate-800">{confirmedAdmission.attendingDoctor}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Ward & Bed</span>
                <p className="font-bold text-teal-800">{confirmedAdmission.assignedWard} — Bed {confirmedAdmission.assignedBedNumber}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Admission Date & Time</span>
                <p className="font-bold text-slate-800">{new Date(confirmedAdmission.admissionDate).toLocaleDateString()} at {confirmedAdmission.admissionTime}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setConfirmedAdmission(null);
                  onNavigate('admissions');
                }}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold flex items-center gap-1.5"
              >
                <span>Go to Admission Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
