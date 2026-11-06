import { Activity, ArrowUpRight, CalendarDays, CreditCard, UserRound, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { http } from '../api/http.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'
import { Feedback } from '../components/Feedback.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { StatCard } from '../components/StatCard.jsx'
import { useAuth } from '../hooks/useAuth.js'

const greeting = (hour) => {
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export function DashboardPage() {
  const { user } = useAuth()
  const [renderedAt] = useState(() => Date.now())
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    http.get('/dashboard/dashboard')
      .then(({ data }) => setDashboard(data.dashboard))
      .catch((err) => setError(err.response?.data?.error ?? 'Could not load your dashboard.'))
  }, [])

  const welcome = `${greeting(new Date(renderedAt).getHours())}, ${user.name.split(' ')[0]}`
  return (
    <div className="page-stack">
      <PageHeader eyebrow={formatDate(renderedAt, { weekday: 'long', month: 'long', day: 'numeric' })} title={welcome} description="Here's what's happening across your hospital today." />
      <Feedback error={error} />
      {!dashboard && !error && <div className="skeleton-grid"><div /><div /><div /><div /></div>}
      {dashboard && (
        <>
          <section className="stats-grid">
            <StatCard label="Registered patients" value={dashboard.patients.toLocaleString()} note="Patients in your care" icon={UserRound} tone="mint" />
            <StatCard label="Visits in progress" value={user.role === 'doctor' ? dashboard.assignedVisits : dashboard.activeVisits} note="Scheduled or underway" icon={Activity} tone="blue" />
            <StatCard label="Appointments today" value={dashboard.todayVisits.toLocaleString()} note="Across all departments" icon={CalendarDays} tone="purple" />
            {['admin', 'finance'].includes(user.role)
              ? <StatCard label="Pending invoices" value={dashboard.pendingInvoices.toLocaleString()} note={`Collected today · ${formatCurrency(dashboard.paidToday)}`} icon={CreditCard} tone="amber" />
              : <StatCard label="Care team members" value={dashboard.staff.toLocaleString()} note="Active staff accounts" icon={Users} tone="amber" />}
          </section>
          <section className="dashboard-grid">
            <article className="panel upcoming-panel">
              <div className="panel-heading"><div><p className="eyebrow">ON THE SCHEDULE</p><h2>Upcoming visits</h2></div><span className="panel-count">{dashboard.upcomingVisits.length} visits</span></div>
              {dashboard.upcomingVisits.length ? (
                <div className="visit-list">
                  {dashboard.upcomingVisits.map((visit) => (
                    <div className="visit-row" key={visit._id}>
                      <div className="visit-time">{new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="visit-person"><div className="mini-avatar">{visit.patient?.firstName?.[0]}{visit.patient?.lastName?.[0]}</div><div><strong>{visit.patient?.firstName} {visit.patient?.lastName}</strong><small>{visit.reason}</small></div></div>
                      <span className="visit-doctor">{visit.assignedDoctor?.name ?? 'Care team'}</span>
                      <span className={`status-badge ${visit.status}`}>{visit.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-state"><CalendarDays size={23} /><strong>Your schedule is clear</strong><span>Newly assigned visits will show up here.</span></div>}
            </article>
            <article className="panel patients-panel">
              <div className="panel-heading"><div><p className="eyebrow">RECENTLY ADDED</p><h2>New patients</h2></div><Link className="text-link" to="/patients">View all <ArrowUpRight size={15} /></Link></div>
              {dashboard.recentPatients.length ? (
                <div className="recent-list">{dashboard.recentPatients.map((patient) => (
                  <div className="recent-row" key={patient._id}><div className="mini-avatar soft">{patient.firstName?.[0]}{patient.lastName?.[0]}</div><div><strong>{patient.firstName} {patient.lastName}</strong><small>{patient.patientId}</small></div><span>{new Date(patient.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
                ))}</div>
              ) : <div className="empty-state compact"><UserRound size={23} /><strong>No patients yet</strong><span>New registrations will appear here.</span></div>}
              <div className="panel-footnote"><span className="online-dot" /> Patient records are accessible only to authorized staff</div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}
