import { Router } from 'express'
import { z } from 'zod'
import Department from '../../models/Department.js'
import Patient from '../../models/Patient.js'
import User from '../../models/User.js'
import Visit from '../../models/Visit.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/HttpError.js'
import { validate } from '../../utils/validate.js'

const router = Router()
const createVisitSchema = z.object({
  patient: z.string().min(1),
  assignedDoctor: z.string().min(1),
  department: z.string().optional().nullable(),
  reason: z.string().trim().min(2).max(500),
  scheduledAt: z.iso.datetime(),
})
const statusSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled']),
})
router.use(authenticate, authorize('admin', 'receptionist', 'nurse', 'doctor'))

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'doctor' ? { assignedDoctor: req.user._id } : {}
  const visits = await Visit.find(filter)
    .populate('patient', 'patientId firstName lastName dateOfBirth sex phone')
    .populate('assignedDoctor', 'name email')
    .populate('department', 'name code')
    .populate('vitals.recordedBy', 'name')
    .sort({ scheduledAt: -1 })
    .limit(200)
  res.json({ visits })
}))

router.post('/', authorize('admin', 'receptionist'), asyncHandler(async (req, res) => {
  const input = validate(createVisitSchema, req.body)
  const [patient, doctor, department] = await Promise.all([
    Patient.findById(input.patient),
    User.findOne({ _id: input.assignedDoctor, role: 'doctor', active: true }),
    input.department ? Department.findOne({ _id: input.department, active: true }) : null,
  ])
  if (!patient) {
    throw new HttpError(404, 'Patient not found.')
  }
  if (!doctor) {
    throw new HttpError(400, 'Choose an active doctor.')
  }
  if (input.department && !department) {
    throw new HttpError(400, 'Choose an active department.')
  }
  const visit = await Visit.create({
    ...input,
    department: department?._id ?? null,
    scheduledAt: new Date(input.scheduledAt),
    createdBy: req.user._id,
  })
  res.status(201).json({
    visit: await Visit.findById(visit.id)
      .populate('patient', 'patientId firstName lastName')
      .populate('assignedDoctor', 'name email')
      .populate('department', 'name code'),
  })
}))

router.patch('/:id/status', authorize('admin', 'doctor'), asyncHandler(async (req, res) => {
  const { status } = validate(statusSchema, req.body)
  const filter = { _id: req.params.id }
  if (req.user.role === 'doctor') {
    filter.assignedDoctor = req.user._id
  }
  const visit = await Visit.findOneAndUpdate(filter, { status }, { returnDocument: 'after', runValidators: true })
  if (!visit) {
    throw new HttpError(404, 'Visit not found or not assigned to you.')
  }
  res.json({ visit })
}))

export default router
