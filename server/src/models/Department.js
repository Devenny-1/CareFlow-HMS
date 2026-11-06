import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 12 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true })

departmentSchema.index({ code: 1 }, { unique: true })
departmentSchema.index({ name: 1 }, { unique: true })

export default mongoose.model('Department', departmentSchema)
