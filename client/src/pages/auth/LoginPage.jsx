import { Activity, ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Feedback } from '../../components/Feedback.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export function LoginPage() {
  const { user, loading, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) {
    return <div className="page-loading">Preparing your workspace…</div>
  }

  if (user) {
    return (
      <main className="login-shell">
        <section className="login-brand-panel">
          <div className="login-brand">
            <div className="brand-mark"><Activity size={21} strokeWidth={2.5} /></div>
            <div><strong>CareFlow</strong><span>HOSPITAL SYSTEM</span></div>
          </div>
          <div className="login-message">
            <span className="welcome-pill"><span /> YOUR CARE TEAM, IN SYNC</span>
            <h1>Better care<br />starts <em>together.</em></h1>
            <p>One thoughtful workspace for the people who make every patient feel seen.</p>
          </div>
          <div className="login-brand-footer"><ShieldCheck size={17} /> Secure access for authorized care teams only</div>
          <div className="login-decoration decoration-one" /><div className="login-decoration decoration-two" />
        </section>
        <section className="login-form-panel">
          <div className="login-form-wrap">
            <p className="eyebrow">ACTIVE SESSION</p>
            <h2>You’re already signed in</h2>
            <p className="login-intro">Currently signed in as <strong>{user.name}</strong> ({user.role}). To add a doctor, open Staff from the workspace first. To sign in as another person, switch accounts below.</p>
            <button type="button" className="button button-primary login-submit" onClick={signOut}>Sign out and switch account</button>
            <button type="button" className="button button-quiet login-submit" onClick={() => navigate('/', { replace: true })}>Continue to workspace</button>
            <div className="login-privacy"><ShieldCheck size={15} /> Your session is private and protected</div>
          </div>
        </section>
      </main>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Unable to reach the CareFlow service. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="login-brand">
          <div className="brand-mark"><Activity size={21} strokeWidth={2.5} /></div>
          <div><strong>CareFlow</strong><span>HOSPITAL SYSTEM</span></div>
        </div>
        <div className="login-message">
          <span className="welcome-pill"><span /> YOUR CARE TEAM, IN SYNC</span>
          <h1>Better care<br />starts <em>together.</em></h1>
          <p>One thoughtful workspace for the people who make every patient feel seen.</p>
        </div>
        <div className="login-brand-footer"><ShieldCheck size={17} /> Secure access for authorized care teams only</div>
        <div className="login-decoration decoration-one" /><div className="login-decoration decoration-two" />
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to CareFlow</h2>
          <p className="login-intro">Use your hospital account to continue to your workspace.</p>
          <Feedback error={error} />
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email">Work email</label>
            <div className="input-with-icon"><Mail size={18} /><input id="email" type="email" autoComplete="username" placeholder="you@hospital.org" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <label htmlFor="password">Password</label>
            <div className="input-with-icon"><LockKeyhole size={18} /><input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
            <button type="submit" className="button button-primary login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowRight size={17} />}</button>
          </form>
          <div className="login-help">Need access? Contact your hospital administrator.</div>
          <div className="login-privacy"><ShieldCheck size={15} /> Your session is private and protected</div>
        </div>
      </section>
    </main>
  )
}
