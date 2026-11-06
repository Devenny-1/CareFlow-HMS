import { useAuth } from '../hooks/useAuth.js'
import { AssignedVisitsPage } from './doctor/AssignedVisitsPage.jsx'
import { TriagePage } from './nurse/TriagePage.jsx'
import { VisitsPage } from './visits/VisitsPage.jsx'

export function RoleVisitsPage() {
  const { user } = useAuth()
  if (user.role === 'doctor') {
    return <AssignedVisitsPage />
  }
  if (user.role === 'nurse') {
    return <TriagePage />
  }
  return <VisitsPage />
}
