import { Plus, Search, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { http } from '../../api/http.js'
import { Feedback } from '../../components/Feedback.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { formatCurrency } from '../../utils/formatters.js'

const emptyForm = {
  firstName: '', lastName: '', dateOfBirth: '', sex: 'undisclosed', phone: '', email: '',
  address: '', emergencyContactName: '', emergencyContactPhone: '',
}

export function PatientsPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const canRegister = ['admin', 'receptionist'].includes(user.role)

  const loadPatients = useCallback(async () => {
    try {
      const { data } = await http.get('/patients', { params: { search: debouncedSearch } })
      setPatients(data.patients)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not load patient records.')
    }
  }, [debouncedSearch])

  useEffect(() => { loadPatients() }, [loadPatients])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitRegistration(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const { data } = await http.post('/patients', form)
      setInvoice(data.invoice)
      setSuccess(`${data.patient.firstName} ${data.patient.lastName} is registered.`)
      setForm(emptyForm)
      setShowForm(false)
      await loadPatients()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Patient registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="PATIENT SERVICES" title="Patients" description="Securely manage patient records and new registrations." action={canRegister && <button className="button button-primary" onClick={() => { setShowForm((open) => !open); setInvoice(null) }}><Plus size={17} /> Register patient</button>} />
      {invoice && <div className="invoice-created"><div><strong>Registration invoice created</strong><span>{invoice.invoiceNumber} · {formatCurrency(invoice.amount, invoice.currency)} · Pending finance confirmation</span></div><Link className="text-link" to="/invoices">Open billing</Link></div>}
      <Feedback error={error} success={success} />
      <section className="panel table-panel">
        <div className="table-toolbar"><div><h2>Patient directory</h2><p>{patients.length} records shown</p></div><div className="search-field"><Search size={17} /><input aria-label="Search patients" placeholder="Search name, ID, or phone" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
        <div className="table-scroll"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Date of birth</th><th>Phone</th><th>Registered</th></tr></thead><tbody>
          {patients.map((patient) => <tr key={patient._id}><td><div className="table-person"><div className="mini-avatar">{patient.firstName[0]}{patient.lastName[0]}</div><div><strong>{patient.firstName} {patient.lastName}</strong><small>{patient.email || 'No email provided'}</small></div></div></td><td><span className="id-chip">{patient.patientId}</span></td><td>{new Date(patient.dateOfBirth).toLocaleDateString()}</td><td>{patient.phone}</td><td>{new Date(patient.createdAt).toLocaleDateString()}</td></tr>)}
          {!patients.length && <tr><td colSpan="5"><div className="empty-table"><UserRound size={21} />No patient records found.</div></td></tr>}
        </tbody></table></div>
      </section>
      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}>
          <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
            <div className="modal-heading"><div><p className="eyebrow">NEW RECORD</p><h2 id="registration-title">Patient registration</h2></div><button className="icon-button" aria-label="Close" onClick={() => setShowForm(false)}>×</button></div>
            <p className="form-note">A registration invoice is generated automatically for finance to confirm.</p>
            <form onSubmit={submitRegistration}>
              <div className="form-grid">
                <label>First name<input name="firstName" required value={form.firstName} onChange={updateField} /></label>
                <label>Last name<input name="lastName" required value={form.lastName} onChange={updateField} /></label>
                <label>Date of birth<input name="dateOfBirth" type="date" required value={form.dateOfBirth} onChange={updateField} /></label>
                <label>Sex<select name="sex" value={form.sex} onChange={updateField}><option value="undisclosed">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
                <label>Phone<input name="phone" type="tel" required value={form.phone} onChange={updateField} /></label>
                <label>Email <span className="optional">(optional)</span><input name="email" type="email" value={form.email} onChange={updateField} /></label>
                <label className="wide-field">Address <span className="optional">(optional)</span><input name="address" value={form.address} onChange={updateField} /></label>
                <label>Emergency contact <span className="optional">(optional)</span><input name="emergencyContactName" value={form.emergencyContactName} onChange={updateField} /></label>
                <label>Emergency phone <span className="optional">(optional)</span><input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={updateField} /></label>
              </div>
              <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Create patient record'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
