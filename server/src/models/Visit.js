import mongoose from 'mongoose'

const vitalSignsSchema = new mongoose.Schema({
  temperatureC: { type: Number, min: 25, max: 45 },
  bloodPressureSystolic: { type: Number, min: 40, max: 300 },
  bloodPressureDiastolic: { type: Number, min: 20, max: 200 },
  heartRate: { type: Number, min: 20, max: 250 },
  respiratoryRate: { type: Number, min: 4, max: 80 },
  oxygenSaturation: { type: Number, min: 50, max: 100 },
  weightKg: { type: Number, min: 0, max: 500 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedAt: { type: Date },
}, { _id: false })

const visitSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled', index: true },
  vitals: { type: vitalSignsSchema, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

visitSchema.index({ scheduledAt: 1, status: 1 })

export default mongoose.model('Visit', visitSchema)
