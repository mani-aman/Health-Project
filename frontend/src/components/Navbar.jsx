import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import {
  FaBars, FaTimes, FaHome, FaUserMd, FaRobot,
  FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaHeartbeat
} from 'react-icons/fa'
import { FiShield } from 'react-icons/fi'

const Navbar = () => {
  const { user, token, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
  }

  // Display name — works for all roles (firstName + lastName stored in authStore)
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : ''

  const getLinks = () => {
    if (!token) {
      return [
        { to: '/auth',   label: 'Login / Sign Up', icon: <FaSignInAlt /> },
      ]
    }

    const role = user?.role
    if (role === 'protected_admin' || role === 'admin') {
      return [
        { to: '/protected-admin', label: 'Admin Dashboard', icon: <FiShield /> },
      ]
    }
    if (role === 'super_admin') {
      return [
        { to: '/super-admin', label: 'Super Admin', icon: <FiShield /> },
      ]
    }
    if (role === 'doctor') {
      return [
        { to: '/doctor/dashboard', label: 'Dashboard', icon: <FaHome /> },
      ]
    }
    // user / patient
    return [
      { to: '/dashboard',     label: 'Dashboard',   icon: <FaHome />        },
      { to: '/doctors',       label: 'Doctors',      icon: <FaUserMd />      },
      { to: '/ai-tools',      label: 'AI Tools',     icon: <FaRobot />       },
      { to: '/profile',       label: 'Profile',      icon: <FaUserCircle />  },
    ]
  }

  const links = getLinks()
  const activeCls = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
    }`

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <NavLink to={token ? (links[0]?.to || '/') : '/'} className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <FaHeartbeat className="text-2xl" />
            <span className="text-xl font-bold tracking-tight">HealthAI</span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} className={activeCls}>
                {l.icon}{l.label}
              </NavLink>
            ))}

            {token && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FaUserCircle className="text-primary-600" />
                  <span className="font-medium">{displayName}</span>
                </span>
                <button onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <FaSignOutAlt /><span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            {mobileOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {token && (
              <div className="flex items-center gap-3 px-4 py-3 mb-2 border-b border-gray-100">
                <FaUserCircle className="text-2xl text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
            )}
            {links.map(l => (
              <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-primary-50'
                  }`}>
                {l.icon}{l.label}
              </NavLink>
            ))}
            {token && (
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 mt-2">
                <FaSignOutAlt />Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
