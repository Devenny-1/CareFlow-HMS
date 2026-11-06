import './config/env.js'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { errorHandler } from './middleware/errorHandler.js'
import adminRoutes from './modules/admin/admin.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import departmentsRoutes from './modules/departments/departments.routes.js'
import invoicesRoutes from './modules/invoices/invoices.routes.js'
import patientsRoutes from './modules/patients/patients.routes.js'
import paymentsRoutes from './modules/payments/payments.routes.js'
import schedulesRoutes from './modules/schedules/schedules.routes.js'
import staffRoutes from './modules/staff/staff.routes.js'
import registrationRoutes from './modules/registration/registration.routes.js'
import triageRoutes from './modules/triage/triage.routes.js'
import visitsRoutes from './modules/visits/visits.routes.js'

const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
}))
app.use(express.json({ limit: '1mb' }))
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'careflow-hms-api' })
})
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', adminRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/departments', departmentsRoutes)
app.use('/api/patients', patientsRoutes)
app.use('/api/registration', registrationRoutes)
app.use('/api/invoices', invoicesRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/visits', visitsRoutes)
app.use('/api/triage', triageRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use((req, res) => res.status(404).json({ error: 'The requested API route was not found.' }))
app.use(errorHandler)

export default app
