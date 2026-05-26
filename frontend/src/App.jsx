import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore.js'
import Login from './pages/Login.jsx'
import DoctorLogin from './pages/DoctorLogin.jsx'
import DoctorRegister from './pages/DoctorRegister.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import Doctors from './pages/Doctors.jsx'
import Profile from './pages/Profile.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AITools from './pages/AITools.jsx'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useEffect } from 'react'

function App() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
        <Navbar />
        <Routes>
          <Route path="/login" element={!useAuthStore.getState().token ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/doctor/login" element={!useAuthStore.getState().token ? <DoctorLogin /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="/doctor/register" element={!useAuthStore.getState().token ? <DoctorRegister /> : <Navigate to="/doctor/dashboard" />} />
          <Route path="/register" element={!useAuthStore.getState().token ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/admin/login" element={!useAuthStore.getState().token ? <AdminLogin /> : <Navigate to="/admin" />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {useAuthStore.getState().user?.role === 'doctor' ? <Navigate to="/doctor/dashboard" /> : <Dashboard />}
            </ProtectedRoute>
          } />
          <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

