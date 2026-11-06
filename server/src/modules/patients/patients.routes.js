import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import Invoice from '../../models/Invoice.js'
import Patient from '../../models/Patient.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/HttpError.js'
import { validate } from '../../utils/validate.js'

const router = Router()
const patientSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: z.iso.date().refine((date) => date <= new Date().toISOString().slice(0, 10), 'Date of birth cannot be in the future.'),
  sex: z.enum(['female', 'male', 'other', 'undisclosed']),
  phone: z.string().trim().min(5).max(30),
  email: z.union([z.email(), z.literal('')]).optional().default(''),
  address: z.string().trim().max(300).optional().default(''),
  emergencyContactName: z.string().trim().max(120).optional().default(''),
  emergencyContactPhone: z.string().trim().max(30).optional().default(''),
})

router.use(authenticate, authorize('admin', 'receptionist', 'nurse', 'doctor'))

router.get('/', asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? '').trim().slice(0, 100)
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25))
  const filter = search
    ? {
        $or: [
          { patientId: new RegExp(escapeRegex(search), 'i') },
          { firstName: new RegExp(escapeRegex(search), 'i') },
          { lastName: new RegExp(escapeRegex(search), 'i') },
          { phone: new RegExp(escapeRegex(search), 'i') },
        ],
      }
    : {}

  const [patients, total] = await Promise.all([
    Patient.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Patient.countDocuments(filter),
  ])
  res.json({ patients, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}))

router.post('/', authorize('admin', 'receptionist'), asyncHandler(async (req, res) => {
  const input = validate(patientSchema, req.body)
  const patient = await Patient.create({
    ...input,
    patientId: `CF-${new Date().getFullYear()}-${randomBytes(6).toString('hex').toUpperCase()}`,
    registeredBy: req.user._id,
  })

  try {
    const amount = Number(process.env.REGISTRATION_FEE ?? 25000)
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('REGISTRATION_FEE must be a non-negative number.')
    }
    const invoice = await Invoice.create({
      invoiceNumber: `CFI-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`,
      patient: patient._id,
      amount,
      currency: process.env.CURRENCY ?? 'NGN',
      description: 'New patient registration',
    })
    return res.status(201).json({ patient, invoice })
  } catch (error) {
    await Patient.deleteOne({ _id: patient._id })
    throw error
  }
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
  if (!patient) {
    throw new HttpError(404, 'Patient not found.')
  }
  res.json({ patient })
}))

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default router
