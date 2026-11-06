import { UserPlus, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { http } from '../../api/http.js'
import { Feedback } from '../../components/Feedback.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'

const emptyForm = { name: '', email: '', password: '', role: 'doctor', department: '' }
const roles = ['doctor', 'nurse', 'receptionist', 'finance']

export function StaffPage() {
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const loadStaff = useCallback(async () => {
    try {
      const { data } = await http.get('/staff')
      setStaff(data.staff)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not load staff.')
    }
  }, [])
  useEffect(() => {
    loadStaff()
    http.get('/departments').then(({ data }) => setDepartments(data.departments.filter((department) => department.active)))
      .catch((err) => setError(err.response?.data?.error ?? 'Could not load departments.'))
  }, [loadStaff])

  async function createStaff(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await http.post('/staff', { ...form, department: form.department || null })
      setSuccess('Staff account created. Share the temporary password securely.')
      setForm(emptyForm)
      setShowForm(false)
      await loadStaff()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not create staff account.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(member) {
    setError('')
    try {
      await http.patch(`/staff/${member._id}/active`, { active: !member.active })
      setSuccess(`${member.name} is now ${member.active ? 'inactive' : 'active'}.`)
      await loadStaff()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not update staff account.')
    }
  }

  return <div className="page-stack">
    <PageHeader eyebrow="TEAM ADMINISTRATION" title="Staff directory" description="Manage clinician and care-team access to the hospital workspace." action={<button className="button button-primary" onClick={() => setShowForm((open) => !open)}><UserPlus size={17} /> Add staff member</button>} />
    <Feedback error={error} success={success} />
    <section className="panel table-panel">
      <div className="table-toolbar"><div><h2>Care team</h2><p>{staff.length} staff accounts</p></div><span className="panel-count">Admin accounts are protected</span></div>
      <div className="table-scroll"><table><thead><tr><th>Staff member</th><th>Role</th><th>Department</th><th>Status</th><th>Access</th></tr></thead><tbody>
        {staff.map((member) => <tr key={member._id}><td><div className="table-person"><div className="mini-avatar">{member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</div><div><strong>{member.name}</strong><small>{member.email}</small></div></div></td><td><span className="role-chip">{member.role}</span></td><td>{member.department?.name ?? 'Unassigned'}</td><td><span className={`status-badge ${member.active ? 'paid' : 'cancelled'}`}>{member.active ? 'active' : 'inactive'}</span></td><td><button className="table-action muted" onClick={() => toggleActive(member)}>{member.active ? 'Deactivate' : 'Activate'}</button></td></tr>)}
        {!staff.length && <tr><td colSpan="5"><div className="empty-table"><Users size={21} />No staff accounts yet. Add your care team to begin.</div></td></tr>}
      </tbody></table></div>
    </section>
    {showForm && <section className="panel inline-form"><div className="modal-heading"><div><p className="eyebrow">NEW ACCOUNT</p><h2>Add a staff member</h2></div><button className="icon-button" aria-label="Close" onClick={() => setShowForm(false)}>×</button></div>
      <p className="form-note">Passwords must contain at least 12 characters. Share credentials out-of-band.</p>
      <form onSubmit={createStaff}><div className="form-grid">
        <label>Full name<input required minLength="2" maxLength="120" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Work email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Temporary password<input type="password" required minLength="12" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((role) => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select></label>
        <label>Department<select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}><option value="">Unassigned</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label>
      </div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Creating…' : 'Create staff account'}</button></div></form>
    </section>}
  </div>
}
