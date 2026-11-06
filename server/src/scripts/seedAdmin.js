import '../config/env.js'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import Department from '../models/Department.js'
import User from '../models/User.js'

try {
  await connectDatabase()
  const name = process.env.ADMIN_NAME?.trim()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!name || !email || !password || password.length < 12) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (at least 12 characters) before seeding.')
  }
  if (await User.exists({ email })) {
    throw new Error(`An account already exists for ${email}; the seed command will not overwrite existing credentials.`)
  }
  const defaultDepartment = await Department.findOne({ code: 'GEN' })
  const passwordHash = await bcrypt.hash(password, 12)
  await User.create({ name, email, passwordHash, role: 'admin', department: defaultDepartment?._id ?? null })
  console.log(`Hospital administrator ${email} created successfully.`)
} finally {
  await mongoose.disconnect()
}
