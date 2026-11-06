import { Router } from 'express'
import { z } from 'zod'
import Invoice from '../../models/Invoice.js'
import Payment from '../../models/Payment.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/HttpError.js'
import { validate } from '../../utils/validate.js'

const router = Router()
const paymentSchema = z.object({
  method: z.enum(['cash', 'card', 'bank_transfer', 'insurance']),
  reference: z.string().trim().min(2).max(120),
})

router.use(authenticate)

router.get('/', authorize('admin', 'finance'), asyncHandler(async (req, res) => {
  const status = ['pending', 'paid'].includes(req.query.status) ? req.query.status : undefined
  const invoices = await Invoice.find(status ? { status } : {})
    .populate('patient', 'patientId firstName lastName phone')
    .populate('confirmedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(200)
  res.json({ invoices })
}))

router.patch('/:id/pay', authorize('admin', 'finance'), asyncHandler(async (req, res) => {
  const input = validate(paymentSchema, req.body)
  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { status: 'paid', paidAt: new Date(), confirmedBy: req.user._id },
    { returnDocument: 'after', runValidators: true },
  )
  if (!invoice) {
    const existing = await Invoice.findById(req.params.id).select('status')
    if (!existing) {
      throw new HttpError(404, 'Invoice not found.')
    }
    throw new HttpError(409, 'This invoice has already been paid.')
  }

  try {
    const payment = await Payment.create({
      invoice: invoice._id,
      patient: invoice.patient,
      amount: invoice.amount,
      currency: invoice.currency,
      method: input.method,
      reference: input.reference,
      receivedBy: req.user._id,
    })
    return res.json({ invoice, payment })
  } catch (error) {
    await Invoice.updateOne(
      { _id: invoice._id, status: 'paid', confirmedBy: req.user._id },
      { $set: { status: 'pending', paidAt: null, confirmedBy: null } },
    )
    throw error
  }
}))

export default router
