import { Router } from 'express'
import { z } from 'zod'
import Department from '../../models/Department.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/HttpError.js'
import { validate } from '../../utils/validate.js'

const router = Router()
const departmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(12).transform((code) => code.toUpperCase()),
  description: z.string().trim().max(500).optional().default(''),
})
const activeSchema = z.object({ active: z.boolean() })

router.use(authenticate)

router.get('/', asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 })
  res.json({ departments })
}))

router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
  const department = await Department.create(validate(departmentSchema, req.body))
  res.status(201).json({ department })
}))

router.patch('/:id/active', authorize('admin'), asyncHandler(async (req, res) => {
  const { active } = validate(activeSchema, req.body)
  const department = await Department.findByIdAndUpdate(req.params.id, { active }, { returnDocument: 'after', runValidators: true })
  if (!department) {
    throw new HttpError(404, 'Department not found.')
  }
  res.json({ department })
}))

export default router
