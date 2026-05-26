import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

