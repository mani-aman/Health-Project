import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff, FiUser, FiLock, FiMail, FiPhone } from 'react-icons/fi'
import { FaHeartbeat } from 'react-icons/fa'

/**
 * Single authentication page for all roles.
 * Login: all 4 roles (redirect determined by DB role in response).
 * Signup: normal 'user' only — role is assigned server-side.
 */

const ROLE_REDIRECT = {
  protected_admin: '/protected-admin',
  super_admin: '/super-admin',
  admin: '/protected-admin', // legacy
  doctor: '/doctor/dashboard',
  user: '/dashboard',
  patient: '/dashboard', // legacy
}

const getRoleRedirect = (role) => ROLE_REDIRECT[role] || '/dashboard'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, signup } = useAuthStore()
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    firstName: '', lastName: '', email: '', mobile: '', password: '', confirmPassword: ''
  })

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(loginForm)
      const redirect = getRoleRedirect(data.user.role)
      navigate(redirect)
    } catch {
      // error toast handled in store
    } finally {
      setLoading(false)
    }
  }

  // ── Signup (user only) ───────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (signupForm.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = signupForm
      const data = await signup(payload)
      navigate(getRoleRedirect(data.user.role))
    } catch {
      // error toast handled in store
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary-600">
            <FaHeartbeat className="text-3xl" />
            <span className="text-2xl font-bold">HealthAI</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Your health, managed securely</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors ${
                  tab === t
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-8">

            {/* ── LOGIN FORM ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email" required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      disabled={loading}
                    />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setTab('signup')}
                    className="text-primary-600 font-medium hover:underline">
                    Create one
                  </button>
                </p>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  Patient registration only. Doctor &amp; admin accounts are created by administrators.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" required
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      value={signupForm.firstName}
                      onChange={e => setSignupForm({ ...signupForm, firstName: e.target.value })}
                      disabled={loading} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" required
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      value={signupForm.lastName}
                      onChange={e => setSignupForm({ ...signupForm, lastName: e.target.value })}
                      disabled={loading} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                      disabled={loading} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Mobile</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="tel"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="+91 98765 43210"
                      value={signupForm.mobile}
                      onChange={e => setSignupForm({ ...signupForm, mobile: e.target.value })}
                      disabled={loading} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type={showPassword ? 'text' : 'password'} required
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Min. 8 characters"
                      value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                      disabled={loading} />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type={showConfirm ? 'text' : 'password'} required
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Repeat password"
                      value={signupForm.confirmPassword}
                      onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      disabled={loading} />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')}
                    className="text-primary-600 font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
