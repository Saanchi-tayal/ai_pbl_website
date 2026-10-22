import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  action: { 
    type: String, 
    required: true,
    enum: ['PATIENT_REGISTERED', 'PATIENT_UPDATED', 'ADMISSION_CREATED', 'PATIENT_DISCHARGED', 'BED_UPDATED', 'BED_ADDED', 'TRIAGE_EVALUATED', 'SETTINGS_UPDATED']
  },
  title: { type: String, required: true },
  details: { type: String, required: true },
  performedBy: { type: String, default: 'Admin' },
  role: { type: String, default: 'Admin' },
  targetId: { type: String }, // patientId, admissionId, or bedId
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
