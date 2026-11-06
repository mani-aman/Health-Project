import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore.js'

// Auth
import AuthPage from './pages/AuthPage.jsx'

// Dashboards
import Dashboard from './pages/Dashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProtectedAdminDashboard from './pages/ProtectedAdminDashboard.jsx'
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx'

// Patient pages
import Doctors from './pages/Doctors.jsx'
import Profile from './pages/Profile.jsx'
import Prescriptions from './pages/Prescriptions.jsx'
import MedicalRecords from './pages/MedicalRecords.jsx'
import AITools from './pages/AITools.jsx'
import Welcome from './pages/Welcome.jsx'

import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const ROLE_HOME = {
  protected_admin: '/protected-admin',
  admin: '/protected-admin',
  super_admin: '/super-admin',
  doctor: '/doctor/dashboard',
  user: '/dashboard',
  patient: '/dashboard',
}

function App() {
  const { checkAuth, isLoading, token, user } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Redirect already-logged-in users away from /auth
  const authElement = token
    ? <Navigate to={ROLE_HOME[user?.role] || '/dashboard'} replace />
    : <AuthPage />

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
        <Navbar />
        <Routes>
          {/* ── Home: logged-in users go to their dashboard, others go to /auth ─── */}
          <Route path="/" element={token ? <Navigate to={ROLE_HOME[user?.role] || '/dashboard'} replace /> : <Navigate to="/auth" replace />} />

          {/* ── Landing (deprecated, kept for compatibility) ───────────────────── */}
          <Route path="/welcome" element={<Welcome />} />

          {/* ── Single unified auth page ────────────────────────────────────────── */}
          <Route path="/auth" element={authElement} />

          {/* Legacy login URLs → redirect to single auth page */}
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth?tab=signup" replace />} />
          <Route path="/doctor/login" element={<Navigate to="/auth" replace />} />
          <Route path="/doctor/register" element={<Navigate to="/auth" replace />} />
          <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
          <Route path="/admin/signup" element={<Navigate to="/auth" replace />} />

          {/* ── Patient / User dashboard ─────────────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'patient']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/doctors" element={
            <ProtectedRoute allowedRoles={['user', 'patient']}>
              <Doctors />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/prescriptions" element={
            <ProtectedRoute allowedRoles={['user', 'patient']}>
              <Prescriptions />
            </ProtectedRoute>
          } />
          <Route path="/medical-records" element={
            <ProtectedRoute allowedRoles={['user', 'patient']}>
              <MedicalRecords />
            </ProtectedRoute>
          } />
          <Route path="/ai-tools" element={
            <ProtectedRoute allowedRoles={['user', 'patient']}>
              <AITools />
            </ProtectedRoute>
          } />

          {/* ── Doctor dashboard ─────────────────────────────────────────── */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />

          {/* ── Legacy admin route ────────────────────────────────────────── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'protected_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Protected Admin dashboard ─────────────────────────────────── */}
          <Route path="/protected-admin" element={
            <ProtectedRoute allowedRoles={['protected_admin', 'admin']}>
              <ProtectedAdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Super Admin dashboard ─────────────────────────────────────── */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Catch-all ────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
