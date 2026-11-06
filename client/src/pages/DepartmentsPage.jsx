import { Building2, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { http } from '../api/http.js'
import { Feedback } from '../components/Feedback.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { useAuth } from '../hooks/useAuth.js'

export function DepartmentsPage() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const canManage = user.role === 'admin'
  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await http.get('/departments')
      setDepartments(data.departments)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not load departments.')
    }
  }, [])
  useEffect(() => { loadDepartments() }, [loadDepartments])
  async function createDepartment(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await http.post('/departments', form)
      setSuccess('Department created.')
      setForm({ name: '', code: '', description: '' })
      setShowForm(false)
      await loadDepartments()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not create department.')
    } finally {
      setBusy(false)
    }
  }
  async function toggleDepartment(department) {
    setError('')
    try {
      await http.patch(`/departments/${department._id}/active`, { active: !department.active })
      setSuccess(`${department.name} is now ${department.active ? 'inactive' : 'active'}.`)
      await loadDepartments()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not update department.')
    }
  }
  return <div className="page-stack">
    <PageHeader eyebrow="HOSPITAL SETUP" title="Departments" description="Browse clinical services and manage their availability." action={canManage && <button className="button button-primary" onClick={() => setShowForm((open) => !open)}><Plus size={17} /> Add department</button>} />
    <Feedback error={error} success={success} />
    <section className="department-grid">{departments.map((department) => <article className="department-card" key={department._id}><div className="department-icon"><Building2 size={20} /></div><div className="department-code">{department.code}</div><h2>{department.name}</h2><p>{department.description || 'Clinical services and care coordination.'}</p><div className="department-footer"><span className={`status-badge ${department.active ? 'paid' : 'cancelled'}`}>{department.active ? 'active' : 'inactive'}</span>{canManage && <button className="table-action muted" onClick={() => toggleDepartment(department)}>{department.active ? 'Deactivate' : 'Activate'}</button>}</div></article>)}
      {!departments.length && <div className="empty-state"><Building2 size={23} /><strong>No departments available</strong><span>Add a department to start organizing care.</span></div>}
    </section>
    {showForm && <section className="panel inline-form"><div className="modal-heading"><div><p className="eyebrow">HOSPITAL SETUP</p><h2>Create a department</h2></div><button className="icon-button" aria-label="Close" onClick={() => setShowForm(false)}>×</button></div>
      <form onSubmit={createDepartment}><div className="form-grid"><label>Department name<input required minLength="2" maxLength="100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Short code<input required minLength="2" maxLength="12" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label><label className="wide-field">Description<input maxLength="500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label></div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Create department'}</button></div></form>
    </section>}
  </div>
}
