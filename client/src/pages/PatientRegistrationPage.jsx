import React, { useState } from 'react';
import { 
  UserPlus, 
  RotateCcw, 
  CheckCircle2, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export function PatientRegistrationPage({ onNavigate, onPatientRegistered }) {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    emergencyName: '',
    emergencyRelation: 'Spouse',
    emergencyPhone: '',
    bloodGroup: 'Unknown',
    allergies: '',
    medicalHistory: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);

  // Auto-calculate age whenever DOB changes
  const handleDobChange = (e) => {
    const dobValue = e.target.value;
    let calculatedAge = '';
    if (dobValue) {
      const birthDate = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      calculatedAge = age >= 0 ? age : 0;
    }

    setFormData(prev => ({
      ...prev,
      dateOfBirth: dobValue,
      age: calculatedAge !== '' ? calculatedAge : prev.age
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target.value !== undefined ? e.target : { name: e.name, value: e.value };
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      name: '',
      dateOfBirth: '',
      age: '',
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      emergencyName: '',
      emergencyRelation: 'Spouse',
      emergencyPhone: '',
      bloodGroup: 'Unknown',
      allergies: '',
      medicalHistory: ''
    });
    setCreatedPatient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      notifyError('Patient full name is required.');
      return;
    }
    if (!formData.dateOfBirth) {
      notifyError('Date of birth is required.');
      return;
    }
    if (!formData.phone.trim()) {
      notifyError('Phone number is required.');
      return;
    }
    if (!formData.emergencyName.trim() || !formData.emergencyPhone.trim()) {
      notifyError('Emergency contact name and phone are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const allergiesList = formData.allergies
        ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        age: Number(formData.age) || 0,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone
        },
        bloodGroup: formData.bloodGroup,
        allergies: allergiesList,
        medicalHistory: formData.medicalHistory,
        registeredBy: user?.name || 'Staff'
      };

      const res = await api.createPatient(payload);
      success(res.message);
      setCreatedPatient(res.patient);
      if (onPatientRegistered) {
        onPatientRegistered(res.patient);
      }
    } catch (err) {
      notifyError('Registration error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title banner */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Patient Registration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Register new hospital patient, assign permanent digital medical ID, and prepare for admission intake.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-semibold">
            Auto-ID: PAT-{new Date().getFullYear()}-XXX
          </span>
        </div>
      </div>

      {/* Success alert with direct proceed button */}
      {createdPatient && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-soft animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Patient Successfully Registered! (ID: {createdPatient.patientId})
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {createdPatient.name}, {createdPatient.age}y {createdPatient.gender}. Ready for triage and bed allocation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Register Another
            </button>
            <button
              onClick={() => onNavigate('new-admission', { preselectedPatientId: createdPatient.patientId })}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-soft transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Admit Patient Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-hospital-border p-6 sm:p-8 shadow-soft space-y-6">
        
        {/* Section 1: Demographics */}
        <div>
          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span>1. Patient Demographics & Identification</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Arthur Pendelton"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleDobChange}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Auto-Calculated) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="0"
                max="130"
                placeholder="Age in years"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              >
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div>
          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span>2. Contact Details & Address</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Street Address, City, State, ZIP code"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact */}
        <div>
          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span>3. Emergency Contact Details</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="emergencyName"
                value={formData.emergencyName}
                onChange={handleChange}
                required
                placeholder="Next of kin full name"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <select
                name="emergencyRelation"
                value={formData.emergencyRelation}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              >
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Guardian">Legal Guardian</option>
                <option value="Other">Other Relative / Friend</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                required
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Clinical History & Known Allergies */}
        <div>
          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span>4. Clinical Background & Allergies</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Known Drug / Substance Allergies (Comma separated)
              </label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Penicillin, Aspirin, Latex, Sulfa"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">Leave empty if No Known Drug Allergies (NKDA).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical History & Chronic Conditions
              </label>
              <textarea
                rows={2}
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                placeholder="Prior surgeries, hypertension, diabetes, asthma, implants..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Form</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('patients')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Patient...' : 'Save & Register Patient'}</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
