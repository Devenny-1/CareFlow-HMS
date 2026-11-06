import mongoose from 'mongoose'

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  description: { type: String, required: true, default: 'New patient registration' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'NGN' },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending', index: true },
  paidAt: { type: Date, default: null },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

invoiceSchema.index({ patient: 1, createdAt: -1 })

export default mongoose.model('Invoice', invoiceSchema)
