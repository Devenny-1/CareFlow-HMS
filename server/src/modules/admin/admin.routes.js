import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import Invoice from '../../models/Invoice.js'
import Patient from '../../models/Patient.js'
import Payment from '../../models/Payment.js'
import User from '../../models/User.js'
import Visit from '../../models/Visit.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

const router = Router()
router.use(authenticate)

router.get('/dashboard', asyncHandler(async (req, res) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const role = req.user.role
  const canSeeClinicalSchedule = ['admin', 'receptionist', 'nurse', 'doctor'].includes(role)
  const canSeeHospitalOverview = ['admin', 'receptionist'].includes(role)
  const canSeeFinance = ['admin', 'finance'].includes(role)
  const visitFilter = role === 'doctor' ? { assignedDoctor: req.user._id } : {}
  const visitQuery = { ...visitFilter, status: { $in: ['scheduled', 'in_progress'] } }
  const [patients, staff, activeVisits, todayVisits, pendingInvoices, paidPayments, visitsByStatus, recentPatients, upcomingVisits] = await Promise.all([
    canSeeHospitalOverview ? Patient.countDocuments() : 0,
    canSeeHospitalOverview ? User.countDocuments({ active: true, role: { $ne: 'admin' } }) : 0,
    canSeeClinicalSchedule ? Visit.countDocuments(visitQuery) : 0,
    canSeeClinicalSchedule ? Visit.countDocuments({ ...visitFilter, scheduledAt: { $gte: startOfDay }, status: { $ne: 'cancelled' } }) : 0,
    canSeeFinance ? Invoice.countDocuments({ status: 'pending' }) : 0,
    canSeeFinance ? Payment.aggregate([{ $match: { createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]) : [],
    canSeeHospitalOverview ? Visit.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]) : [],
    canSeeHospitalOverview ? Patient.find().sort({ createdAt: -1 }).limit(5).select('patientId firstName lastName createdAt') : [],
    canSeeClinicalSchedule ? Visit.find({ ...visitFilter, scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'in_progress'] } })
      .populate('patient', 'patientId firstName lastName')
      .populate('assignedDoctor', 'name')
      .sort({ scheduledAt: 1 })
      .limit(5) : [],
  ])

  const dashboard = { patients, staff, activeVisits, todayVisits, pendingInvoices, paidToday: paidPayments[0]?.total ?? 0, visitsByStatus, recentPatients, upcomingVisits }
  if (req.user.role === 'doctor') {
    dashboard.assignedVisits = activeVisits
  }
  if (req.user.role === 'nurse') {
    dashboard.awaitingTriage = await Visit.countDocuments({ status: { $in: ['scheduled', 'in_progress'] }, vitals: null })
  }
  return res.json({ dashboard })
}))

router.get('/staff-summary', authorize('admin'), asyncHandler(async (req, res) => {
  const staff = await User.aggregate([
    { $match: { role: { $ne: 'admin' } } },
    { $group: { _id: '$role', total: { $sum: 1 }, active: { $sum: { $cond: ['$active', 1, 0] } } } },
    { $sort: { _id: 1 } },
  ])
  res.json({ staff })
}))

export default router
