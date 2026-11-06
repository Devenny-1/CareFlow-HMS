import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['admin', 'receptionist', 'nurse', 'doctor', 'finance'],
    required: true,
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  active: { type: Boolean, default: true },
}, { timestamps: true })

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ role: 1, active: 1 })

export default mongoose.model('User', userSchema)
