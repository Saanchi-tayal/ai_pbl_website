import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedId: { type: String, required: true, unique: true },
  bedNumber: { type: String, required: true },
  wardId: { type: String, required: true },
  wardName: { type: String, required: true },
  wardType: { 
    type: String, 
    required: true, 
    enum: ['General', 'Semi-Private', 'Private', 'ICU'] 
  },
  floor: { type: String, default: '1st Floor' },
  status: { 
    type: String, 
    required: true, 
    enum: ['Available', 'Occupied', 'Maintenance'],
    default: 'Available' 
  },
  currentPatientId: { type: String, default: null },
  currentPatientName: { type: String, default: null },
  currentAdmissionId: { type: String, default: null },
  department: { type: String, default: 'General Medicine' },
  dailyRate: { type: Number, default: 1500 },
  features: { type: [String], default: [] },
  lastCleaned: { type: Date, default: Date.now },
  maintenanceNotes: { type: String, default: '' }
}, {
  timestamps: true
});

export default mongoose.models.Bed || mongoose.model('Bed', bedSchema);
