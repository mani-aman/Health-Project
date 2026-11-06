import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'

const ROLE_HOME = {
  protected_admin: '/protected-admin',
  admin: '/protected-admin',
  super_admin: '/super-admin',
  doctor: '/doctor/dashboard',
  user: '/dashboard',
  patient: '/dashboard',
}

const getRoleHome = (role) => ROLE_HOME[role] || '/dashboard'

/**
 * ProtectedRoute — guards a route by authentication and optional role list.
 *
 * Props:
 *   allowedRoles?: string[]  — if supplied, user.role must be in this list
 *   redirectTo?: string      — override redirect destination on auth failure
 */
const ProtectedRoute = ({ children, allowedRoles, redirectTo }) => {
  const { token, user } = useAuthStore()

  if (!token) {
    return <Navigate to={redirectTo || '/auth'} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard, not a generic page
    return <Navigate to={getRoleHome(user.role)} replace />
  }

  return children
}

export default ProtectedRoute
