import { Router } from 'express'
import Payment from '../../models/Payment.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

const router = Router()
router.use(authenticate, authorize('admin', 'finance'))

router.get('/', asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('patient', 'patientId firstName lastName')
    .populate('invoice', 'invoiceNumber')
    .populate('receivedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(200)
  res.json({ payments })
}))

export default router
