import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import User from '../../models/User.js'
import Department from '../../models/Department.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/HttpError.js'
import { validate } from '../../utils/validate.js'

const router = Router()
const staffRoles = ['receptionist', 'nurse', 'doctor', 'finance']
const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(200),
  role: z.enum(staffRoles),
  department: z.string().optional().nullable(),
})
const activeSchema = z.object({ active: z.boolean() })

router.use(authenticate)

router.get('/doctors', asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: 'doctor', active: true })
    .select('name email department')
    .populate('department', 'name code')
    .sort({ name: 1 })
  res.json({ doctors })
}))

router.use(authorize('admin'))

router.get('/', asyncHandler(async (req, res) => {
  const staff = await User.find({ role: { $ne: 'admin' } })
    .select('name email role department active createdAt')
    .populate('department', 'name code')
    .sort({ name: 1 })
  res.json({ staff })
}))

router.post('/', asyncHandler(async (req, res) => {
  const input = validate(createStaffSchema, req.body)
  let department = null
  if (input.department) {
    department = await Department.findById(input.department)
    if (!department || !department.active) {
      throw new HttpError(400, 'Choose an active department.')
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  const staff = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    department: department?._id ?? null,
  })
  res.status(201).json({
    staff: await User.findById(staff.id).select('name email role department active createdAt').populate('department', 'name code'),
  })
}))

router.patch('/:id/active', asyncHandler(async (req, res) => {
  const { active } = validate(activeSchema, req.body)
  const staff = await User.findOneAndUpdate(
    { _id: req.params.id, role: { $ne: 'admin' } },
    { active },
    { returnDocument: 'after', runValidators: true },
  ).select('name email role department active')
  if (!staff) {
    throw new HttpError(404, 'Staff member not found.')
  }
  res.json({ staff })
}))

export default router
