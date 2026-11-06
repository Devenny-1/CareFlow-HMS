import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute.jsx'
import { clinicalRoles } from '../auth/roles.js'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { DepartmentsPage } from '../pages/DepartmentsPage.jsx'
import { InvoicesPage } from '../pages/InvoicesPage.jsx'
import { LoginPage } from '../pages/auth/LoginPage.jsx'
import { StaffPage } from '../pages/admin/StaffPage.jsx'
import { PatientsPage } from '../pages/receptionist/PatientsPage.jsx'
import { RoleVisitsPage } from '../pages/RoleVisitsPage.jsx'
import { TriagePage } from '../pages/nurse/TriagePage.jsx'

export function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route element={<ProtectedRoute roles={clinicalRoles} />}>
          <Route path="patients" element={<PatientsPage />} />
          <Route path="visits" element={<RoleVisitsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin', 'nurse']} />}>
          <Route path="triage" element={<TriagePage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin', 'finance']} />}>
          <Route path="invoices" element={<InvoicesPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="staff" element={<StaffPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
