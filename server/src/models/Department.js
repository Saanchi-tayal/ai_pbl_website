import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  departmentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  headOfDepartment: { type: String, default: '' },
  description: { type: String, default: '' },
  phoneExtension: { type: String, default: '' },
  totalDoctors: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.models.Department || mongoose.model('Department', departmentSchema);
