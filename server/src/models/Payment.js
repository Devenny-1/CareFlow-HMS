import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true },
  method: { type: String, enum: ['cash', 'card', 'bank_transfer', 'insurance'], required: true },
  reference: { type: String, required: true, trim: true, maxlength: 120 },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

paymentSchema.index({ createdAt: -1 })

export default mongoose.model('Payment', paymentSchema)
