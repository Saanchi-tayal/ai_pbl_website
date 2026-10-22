import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema({
  wardId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  wardType: { 
    type: String, 
    required: true, 
    enum: ['General', 'Semi-Private', 'Private', 'ICU'] 
  },
  floor: { type: String, default: '1st Floor' },
  totalBeds: { type: Number, required: true },
  nurseInCharge: { type: String, default: '' },
  description: { type: String, default: '' }
}, {
  timestamps: true
});

export default mongoose.models.Ward || mongoose.model('Ward', wardSchema);
