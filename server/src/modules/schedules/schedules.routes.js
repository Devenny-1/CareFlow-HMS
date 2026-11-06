import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import Visit from '../../models/Visit.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

const router = Router()
router.use(authenticate)

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'doctor' ? { assignedDoctor: req.user._id } : {}
  const visits = await Visit.find(filter)
    .populate('patient', 'patientId firstName lastName')
    .populate('assignedDoctor', 'name')
    .sort({ scheduledAt: 1 })
    .limit(200)
  res.json({ visits })
}))

export default router
