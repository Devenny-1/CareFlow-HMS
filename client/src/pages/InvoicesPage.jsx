import { Check, CreditCard } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { http } from '../api/http.js'
import { Feedback } from '../components/Feedback.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

export function InvoicesPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [paymentFor, setPaymentFor] = useState(null)
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const canConfirm = ['admin', 'finance'].includes(user.role)

  const loadInvoices = useCallback(async () => {
    try {
      const { data } = await http.get('/invoices')
      setInvoices(data.invoices)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not load invoices.')
    }
  }, [])
  useEffect(() => { loadInvoices() }, [loadInvoices])

  async function confirmPayment(event) {
    event.preventDefault()
    if (!paymentFor) return
    setBusy(true)
    setError('')
    try {
      await http.patch(`/invoices/${paymentFor._id}/pay`, { method, reference: reference.trim() })
      setSuccess(`Payment confirmed for ${paymentFor.invoiceNumber}.`)
      setPaymentFor(null)
      setReference('')
      await loadInvoices()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not confirm payment.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="page-stack">
    <PageHeader eyebrow="FINANCE & BILLING" title="Registration invoices" description="Review patient registration charges and confirm received payments." />
    <Feedback error={error} success={success} />
    <section className="panel table-panel">
      <div className="table-toolbar"><div><h2>Invoice ledger</h2><p>Registration charges and payment status</p></div><span className="panel-count">{invoices.filter((invoice) => invoice.status === 'pending').length} awaiting payment</span></div>
      <div className="table-scroll"><table><thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Created</th><th>Status</th><th>Confirmation</th></tr></thead><tbody>
        {invoices.map((invoice) => <tr key={invoice._id}><td><span className="id-chip">{invoice.invoiceNumber}</span></td><td><div className="table-person"><div className="mini-avatar">{invoice.patient?.firstName?.[0]}{invoice.patient?.lastName?.[0]}</div><div><strong>{invoice.patient?.firstName} {invoice.patient?.lastName}</strong><small>{invoice.patient?.patientId}</small></div></div></td><td className="amount-cell">{formatCurrency(invoice.amount, invoice.currency)}</td><td>{formatDate(invoice.createdAt)}</td><td><span className={`status-badge ${invoice.status}`}>{invoice.status}</span></td><td>{invoice.status === 'paid' ? <span className="confirmed-by"><Check size={14} />{invoice.confirmedBy?.name ?? 'Confirmed'}</span> : canConfirm ? <button className="table-action" onClick={() => { setPaymentFor(invoice); setReference(''); setMethod('cash') }}><CreditCard size={14} />Confirm payment</button> : <span className="muted-text">Awaiting finance</span>}</td></tr>)}
        {!invoices.length && <tr><td colSpan="6"><div className="empty-table"><CreditCard size={21} />No invoices have been generated.</div></td></tr>}
      </tbody></table></div>
    </section>
    {paymentFor && <div className="modal-backdrop"><section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <div className="modal-heading"><div><p className="eyebrow">PAYMENT CONFIRMATION</p><h2 id="payment-title">{paymentFor.invoiceNumber}</h2></div><button className="icon-button" aria-label="Close" onClick={() => setPaymentFor(null)}>×</button></div>
      <p className="form-note">Confirm that funds for {formatCurrency(paymentFor.amount, paymentFor.currency)} have been received. This action records a payment in the ledger.</p>
      <form onSubmit={confirmPayment}><div className="form-grid">
        <label>Payment method<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option><option value="insurance">Insurance</option></select></label>
        <label>Payment reference<input required minLength="2" maxLength="120" value={reference} onChange={(event) => setReference(event.target.value)} /></label>
      </div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setPaymentFor(null)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Confirm funds received'}</button></div></form>
    </section></div>}
  </div>
}
