import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  doctorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  department: { type: String, required: true },
  qualification: { type: String, default: 'MBBS, MD' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  availableDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  activeAdmissionsCount: { type: Number, default: 0 },
  status: { type: String, default: 'Available', enum: ['Available', 'On Leave', 'In Surgery'] }
}, {
  timestamps: true
});

export default mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
