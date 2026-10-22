import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['Admin', 'Receptionist', 'Doctor'] 
  },
  department: { type: String },
  phone: { type: String },
  avatarUrl: { type: String },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
