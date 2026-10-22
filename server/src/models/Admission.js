import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  admissionId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String },
  admissionDate: { type: Date, default: Date.now },
  admissionTime: { type: String },
  reasonForAdmission: { type: String, required: true },
  symptoms: { type: [String], default: [] },
  vitals: {
    bpSystolic: { type: Number },
    bpDiastolic: { type: Number },
    heartRate: { type: Number },
    respRate: { type: Number },
    spo2: { type: Number },
    temperature: { type: Number },
    newsScore: { type: Number, default: 0 }
  },
  department: { type: String, required: true },
  attendingDoctor: { type: String, required: true },
  doctorSpecialty: { type: String, default: 'General Medicine' },
  admissionPriority: { 
    type: String, 
    required: true, 
    enum: ['Routine', 'Urgent', 'Emergency'] 
  },
  aiTriageAssessment: {
    suggestedPriority: { type: String },
    triageScore: { type: Number },
    rationale: { type: String },
    factors: { type: [String] },
    suggestedDepartment: { type: String },
    isAiAssisted: { type: Boolean, default: true }
  },
  wardType: { 
    type: String, 
    required: true, 
    enum: ['General', 'Semi-Private', 'Private', 'ICU'] 
  },
  assignedBedId: { type: String, required: true },
  assignedBedNumber: { type: String, required: true },
  assignedWard: { type: String, required: true },
  admissionNotes: { type: String, default: '' },
  status: { 
    type: String, 
    required: true, 
    enum: ['Pending', 'Admitted', 'Discharged'],
    default: 'Admitted'
  },
  dischargeDate: { type: Date, default: null },
  dischargeTime: { type: String, default: null },
  dischargeSummary: { type: String, default: null },
  dischargeCondition: { 
    type: String, 
    enum: ['Recovered', 'Improved', 'Transferred', 'Against Medical Advice', 'Deceased', null],
    default: null 
  },
  createdBy: { type: String, default: 'Admin' }
}, {
  timestamps: true
});

export default mongoose.models.Admission || mongoose.model('Admission', admissionSchema);
