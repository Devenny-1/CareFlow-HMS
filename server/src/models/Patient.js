import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  dateOfBirth: { type: Date, required: true },
  sex: { type: String, enum: ['female', 'male', 'other', 'undisclosed'], required: true },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  email: { type: String, trim: true, lowercase: true, default: '' },
  address: { type: String, trim: true, maxlength: 300, default: '' },
  emergencyContactName: { type: String, trim: true, maxlength: 120, default: '' },
  emergencyContactPhone: { type: String, trim: true, maxlength: 30, default: '' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

patientSchema.index({ lastName: 1, firstName: 1 })
patientSchema.index({ phone: 1 })

export default mongoose.model('Patient', patientSchema)
