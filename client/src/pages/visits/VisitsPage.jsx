import { Activity, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { http } from '../../api/http.js'
import { Feedback } from '../../components/Feedback.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const emptyForm = { patient: '', assignedDoctor: '', department: '', reason: '', scheduledAt: '' }
const dateTimeLocal = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function VisitsPage({ triageOnly = false, doctorView = false }) {
  const { user } = useAuth()
  const [visits, setVisits] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(() => ({ ...emptyForm, scheduledAt: dateTimeLocal(new Date(Date.now() + 3600000)) }))
  const [showForm, setShowForm] = useState(false)
  const [vitalsFor, setVitalsFor] = useState('')
  const [vitals, setVitals] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const canAssign = ['admin', 'receptionist'].includes(user.role)
  const canTriage = ['admin', 'nurse'].includes(user.role)
  const canUpdate = ['admin', 'doctor'].includes(user.role)
  const visibleVisits = visits.filter((visit) => !triageOnly || (
    !visit.vitals && ['scheduled', 'in_progress'].includes(visit.status)
  ))

  const loadVisits = useCallback(async () => {
    try {
      const { data } = await http.get(triageOnly ? '/triage' : '/visits')
      setVisits(data.visits)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not load visits.')
    }
  }, [triageOnly])

  useEffect(() => {
    loadVisits()
    if (canAssign) {
      Promise.all([http.get('/patients?limit=100'), http.get('/staff/doctors'), http.get('/departments')])
        .then(([patientData, staffData, departmentData]) => {
          setPatients(patientData.data.patients)
          setDoctors(staffData.data.doctors)
          setDepartments(departmentData.data.departments.filter((department) => department.active))
        })
        .catch((err) => setError(err.response?.data?.error ?? 'Could not load visit scheduling options.'))
    }
  }, [canAssign, loadVisits])

  async function createVisit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await http.post('/visits', { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() })
      setSuccess('Visit assigned successfully.')
      setShowForm(false)
      setForm(() => ({ ...emptyForm, scheduledAt: dateTimeLocal(new Date(Date.now() + 3600000)) }))
      await loadVisits()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not schedule visit.')
    } finally {
      setBusy(false)
    }
  }

  async function saveVitals(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const numericVitals = Object.fromEntries(Object.entries(vitals).filter(([, value]) => value !== '').map(([key, value]) => [key, Number(value)]))
    try {
      await http.patch(`/triage/${vitalsFor}/vitals`, numericVitals)
      setSuccess('Vital signs recorded.')
      setVitalsFor('')
      setVitals({})
      await loadVisits()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not record vital signs.')
    } finally {
      setBusy(false)
    }
  }

  async function updateStatus(visit, status) {
    setError('')
    try {
      await http.patch(`/visits/${visit._id}/status`, { status })
      setSuccess(`Visit marked ${status.replace('_', ' ')}.`)
      await loadVisits()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not update visit.')
    }
  }

  const vitalFields = [
    ['temperatureC', 'Temperature °C'], ['bloodPressureSystolic', 'Systolic mmHg'],
    ['bloodPressureDiastolic', 'Diastolic mmHg'], ['heartRate', 'Heart rate bpm'],
    ['respiratoryRate', 'Respiratory rate'], ['oxygenSaturation', 'O₂ saturation %'], ['weightKg', 'Weight kg'],
  ]

  return (
    <div className="page-stack">
      <PageHeader eyebrow="COORDINATED CARE" title={triageOnly ? 'Triage queue' : doctorView ? 'My visits' : 'Visits & triage'} description={triageOnly ? 'Review visits awaiting observations and record patient vital signs.' : 'Coordinate clinician appointments and capture patient observations.'} action={canAssign && !triageOnly && <button className="button button-primary" onClick={() => setShowForm((open) => !open)}><Plus size={17} /> Schedule visit</button>} />
      <Feedback error={error} success={success} />
      <section className="panel table-panel">
        <div className="table-toolbar"><div><h2>{triageOnly ? 'Awaiting observations' : 'Visit schedule'}</h2><p>{visibleVisits.length} {triageOnly ? 'visits awaiting triage' : 'visits in the latest schedule'}</p></div><span className="panel-count">{user.role === 'doctor' ? 'My assignments' : 'Care team'}</span></div>
        <div className="table-scroll"><table><thead><tr><th>Patient</th><th>Reason</th><th>Clinician</th><th>Scheduled</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {visibleVisits.map((visit) => <tr key={visit._id}>
            <td><div className="table-person"><div className="mini-avatar">{visit.patient?.firstName?.[0]}{visit.patient?.lastName?.[0]}</div><div><strong>{visit.patient?.firstName} {visit.patient?.lastName}</strong><small>{visit.patient?.patientId}</small></div></div></td>
            <td className="reason-cell">{visit.reason}</td><td>{visit.assignedDoctor?.name}</td><td>{new Date(visit.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
            <td><span className={`status-badge ${visit.status}`}>{visit.status.replace('_', ' ')}</span></td>
            <td><div className="row-actions">
              {canTriage && <button className="table-action" onClick={() => { setVitalsFor(visit._id); setVitals({}) }}>{visit.vitals ? 'Update vitals' : 'Record vitals'}</button>}
              {canUpdate && visit.status !== 'completed' && visit.status !== 'cancelled' && <button className="table-action muted" onClick={() => updateStatus(visit, visit.status === 'scheduled' ? 'in_progress' : 'completed')}>{visit.status === 'scheduled' ? 'Start' : 'Complete'}</button>}
            </div></td>
          </tr>)}
          {!visibleVisits.length && <tr><td colSpan="6"><div className="empty-table"><Activity size={21} />{triageOnly ? 'No visits are awaiting vital signs.' : 'No visits are scheduled yet.'}</div></td></tr>}
        </tbody></table></div>
      </section>
      {showForm && !triageOnly && <div className="panel inline-form"><div className="modal-heading"><div><p className="eyebrow">APPOINTMENT</p><h2>Assign a clinician</h2></div><button className="icon-button" aria-label="Close" onClick={() => setShowForm(false)}>×</button></div>
        <form onSubmit={createVisit}><div className="form-grid">
          <label>Patient<select required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}><option value="">Select a patient</option>{patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.firstName} {patient.lastName} · {patient.patientId}</option>)}</select></label>
          <label>Doctor<select required value={form.assignedDoctor} onChange={(e) => setForm({ ...form, assignedDoctor: e.target.value })}><option value="">Select a doctor</option>{doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}</select></label>
          <label>Department<select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}><option value="">No department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label>
          <label>Date & time<input type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></label>
          <label className="wide-field">Reason for visit<input required maxLength="500" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
        </div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Schedule visit'}</button></div></form>
      </div>}
      {vitalsFor && <div className="modal-backdrop"><section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="vitals-title">
        <div className="modal-heading"><div><p className="eyebrow">NURSING</p><h2 id="vitals-title">Record vital signs</h2></div><button className="icon-button" aria-label="Close" onClick={() => setVitalsFor('')}>×</button></div>
        <p className="form-note">Enter the measurements available. Empty fields will not be recorded.</p>
        <form onSubmit={saveVitals}><div className="form-grid">{vitalFields.map(([name, label]) => <label key={name}>{label}<input type="number" step={name === 'temperatureC' || name === 'oxygenSaturation' || name === 'weightKg' ? '0.1' : '1'} value={vitals[name] ?? ''} onChange={(e) => setVitals({ ...vitals, [name]: e.target.value })} /></label>)}</div>
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setVitalsFor('')}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save observations'}</button></div>
        </form></section></div>}
    </div>
  )
}
