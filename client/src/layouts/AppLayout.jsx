import { Activity, CalendarDays, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, Stethoscope, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { roleLabels } from '../auth/roles.js'
import { useAuth } from '../hooks/useAuth.js'

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, roles: null },
  { to: '/patients', label: 'Patients', icon: Users, roles: ['admin', 'receptionist', 'nurse', 'doctor'] },
  { to: '/visits', label: 'Visits & triage', icon: Activity, roles: ['admin', 'receptionist', 'nurse', 'doctor'] },
  { to: '/triage', label: 'Nurse triage', icon: Activity, roles: ['admin', 'nurse'] },
  { to: '/invoices', label: 'Billing', icon: CreditCard, roles: ['admin', 'finance'] },
  { to: '/staff', label: 'Staff', icon: Stethoscope, roles: ['admin'] },
  { to: '/departments', label: 'Departments', icon: ClipboardList, roles: ['admin', 'receptionist', 'nurse', 'doctor'] },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = navigation.filter((item) => !item.roles || item.roles.includes(user.role))

  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={21} strokeWidth={2.5} /></div>
          <div><strong>CareFlow</strong><span>HOSPITAL SYSTEM</span></div>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={18} /></button>
        </div>
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon"><CalendarDays size={17} /></div>
            <strong>Care, connected.</strong>
            <p>One calm workspace for your care team.</p>
          </div>
          <button className="profile-button" onClick={signOut} aria-label={`Sign out ${user.name}`} title="Sign out and switch account">
            <div className="avatar">{user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
            <span className="profile-copy"><strong>{user.name}</strong><small>{roleLabels[user.role]} · sign out</small></span>
            <LogOut size={17} className="logout-icon" />
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>CareFlow</span><span className="breadcrumb-slash">/</span><strong>Workspace</strong></div>
          <div className="topbar-right">
            <span className="online-dot" /> <span>Clinic online</span>
            <div className="topbar-avatar">{user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
        <footer className="app-footer"><span>CareFlow HMS</span><span>Confidential patient information · Handle with care</span></footer>
      </div>
    </div>
  )
}
