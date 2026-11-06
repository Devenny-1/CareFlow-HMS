import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import Visit from '../../models/Visit.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/HttpError.js'
import { validate } from '../../utils/validate.js'

const router = Router()
const vitalsSchema = z.object({
  temperatureC: z.number().min(25).max(45).optional(),
  bloodPressureSystolic: z.number().int().min(40).max(300).optional(),
  bloodPressureDiastolic: z.number().int().min(20).max(200).optional(),
  heartRate: z.number().int().min(20).max(250).optional(),
  respiratoryRate: z.number().int().min(4).max(80).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  weightKg: z.number().min(0).max(500).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Enter at least one vital sign.')

router.use(authenticate, authorize('admin', 'nurse'))

router.get('/', asyncHandler(async (req, res) => {
  const visits = await Visit.find({
    status: { $in: ['scheduled', 'in_progress'] },
    vitals: null,
  })
    .populate('patient', 'patientId firstName lastName dateOfBirth sex phone')
    .populate('assignedDoctor', 'name email')
    .populate('department', 'name code')
    .sort({ scheduledAt: 1 })
    .limit(200)
  res.json({ visits })
}))

router.patch('/:id/vitals', asyncHandler(async (req, res) => {
  const vitals = validate(vitalsSchema, req.body)
  const visit = await Visit.findOneAndUpdate(
    { _id: req.params.id, status: { $in: ['scheduled', 'in_progress'] } },
    { $set: { vitals: { ...vitals, recordedBy: req.user._id, recordedAt: new Date() } } },
    { returnDocument: 'after', runValidators: true },
  )
    .populate('patient', 'patientId firstName lastName')
    .populate('vitals.recordedBy', 'name')
  if (!visit) {
    throw new HttpError(404, 'Active visit not found.')
  }
  res.json({ visit })
}))

export default router
