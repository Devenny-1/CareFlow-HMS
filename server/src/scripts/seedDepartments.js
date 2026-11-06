import '../config/env.js'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import Department from '../models/Department.js'

const departments = [
  { name: 'General Medicine', code: 'GEN', description: 'Primary and general medical care.' },
  { name: 'Emergency', code: 'EMG', description: 'Urgent and emergency assessment.' },
  { name: 'Paediatrics', code: 'PED', description: 'Healthcare for infants, children, and adolescents.' },
  { name: 'Maternity', code: 'MAT', description: 'Obstetric and maternity services.' },
  { name: 'Surgery', code: 'SUR', description: 'Surgical consultations and care.' },
]

try {
  await connectDatabase()
  for (const department of departments) {
    await Department.updateOne({ code: department.code }, { $setOnInsert: department }, { upsert: true })
  }
  console.log(`Ensured ${departments.length} starter departments.`)
} finally {
  await mongoose.disconnect()
}
