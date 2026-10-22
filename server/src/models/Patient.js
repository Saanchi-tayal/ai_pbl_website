import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  dateOfBirth: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, required: true },
  emergencyContact: {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true }
  },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  allergies: { type: [String], default: [] },
  medicalHistory: { type: String, default: '' },
  registrationDate: { type: Date, default: Date.now },
  admissionStatus: { 
    type: String, 
    enum: ['Not Admitted', 'Admitted', 'Discharged', 'Pending'],
    default: 'Not Admitted' 
  },
  currentAdmissionId: { type: String, default: null },
  currentBedId: { type: String, default: null },
  assignedDoctor: { type: String, default: null }
}, {
  timestamps: true
});

export default mongoose.models.Patient || mongoose.model('Patient', patientSchema);
