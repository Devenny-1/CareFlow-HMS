import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../../models/User.js'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/HttpError.js'
import { validate } from '../../utils/validate.js'

const router = Router()
const loginSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(200),
})

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
})

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = validate(loginSchema, req.body)
  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect.')
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h', issuer: 'careflow-hms' },
  )
  res.json({ token, user: toPublicUser(user) })
}))

router.get('/me', authenticate, (req, res) => {
  res.json({ user: toPublicUser(req.user) })
})

export default router
