import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff, FiLock, FiMail, FiPhone, FiAlertCircle, FiCheck } from 'react-icons/fi'
import { FaHeartbeat } from 'react-icons/fa'

/**
 * Single unified authentication page for all roles.
 * Login: all roles (redirect determined by DB role in response).
 * Signup: patient only — role is assigned server-side.
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

// Password strength calculator
const calculatePasswordStrength = (password) => {
  if (!password) return { strength: 0, text: '', color: '' }
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  const levels = [
    { text: 'Very Weak', color: 'bg-red-500' },
    { text: 'Weak', color: 'bg-orange-500' },
    { text: 'Fair', color: 'bg-yellow-500' },
    { text: 'Good', color: 'bg-blue-500' },
    { text: 'Strong', color: 'bg-green-500' },
  ]
  return { strength: Math.min(strength, 5), ...levels[Math.min(strength - 1, 4) || 0] }
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, signup } = useAuthStore()
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    firstName: '', lastName: '', email: '', mobile: '', password: '', confirmPassword: ''
  })

  // ── Validation Helpers ───────────────────────────────────────────────────
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  
  const validateSignup = () => {
    const newErrors = {}
    if (!signupForm.firstName.trim()) newErrors.firstName = 'First name required'
    if (!signupForm.lastName.trim()) newErrors.lastName = 'Last name required'
    if (!signupForm.email.trim()) newErrors.email = 'Email required'
    else if (!validateEmail(signupForm.email)) newErrors.email = 'Invalid email format'
    if (signupForm.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (signupForm.password !== signupForm.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please enter email and password')
      return
    }
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

  // ── Signup (patient only) ────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    if (!validateSignup()) return
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

  const passwordStrength = calculatePasswordStrength(signupForm.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary-600">
            <FaHeartbeat className="text-3xl" />
            <span className="text-2xl font-bold tracking-tight">HealthAI</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Your health, managed securely</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                className={`flex-1 py-4 text-sm font-semibold capitalize transition-all ${
                  tab === t
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Login as:</p>
                    <p className="text-xs mt-1">Patient, Doctor, or Administrator</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email" required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      disabled={loading}
                    />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : 'Sign In'}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setTab('signup'); setErrors({}); }}
                    className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                    Create one
                  </button>
                </p>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Patient Registration</p>
                    <p className="text-xs mt-1">Doctor and admin accounts are created by administrators only.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">First Name</label>
                    <input type="text" required
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-colors ${
                        errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                      value={signupForm.firstName}
                      onChange={e => { setSignupForm({ ...signupForm, firstName: e.target.value }); setErrors({...errors, firstName: ''}) }}
                      disabled={loading} />
                    {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Last Name</label>
                    <input type="text" required
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-colors ${
                        errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                      value={signupForm.lastName}
                      onChange={e => { setSignupForm({ ...signupForm, lastName: e.target.value }); setErrors({...errors, lastName: ''}) }}
                      disabled={loading} />
                    {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" required
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-colors ${
                        errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={e => { setSignupForm({ ...signupForm, email: e.target.value }); setErrors({...errors, email: ''}) }}
                      disabled={loading} />
                  </div>
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Phone (Optional)</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="tel"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="+91 98765 43210"
                      value={signupForm.mobile}
                      onChange={e => setSignupForm({ ...signupForm, mobile: e.target.value })}
                      disabled={loading} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type={showPassword ? 'text' : 'password'} required
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-colors ${
                        errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Min. 8 characters with mix of cases, numbers"
                      value={signupForm.password}
                      onChange={e => { setSignupForm({ ...signupForm, password: e.target.value }); setErrors({...errors, password: ''}) }}
                      disabled={loading} />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                  {signupForm.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${passwordStrength.color}`} style={{width: `${(passwordStrength.strength / 5) * 100}%`}} />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type={showConfirm ? 'text' : 'password'} required
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-colors ${
                        errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Repeat password"
                      value={signupForm.confirmPassword}
                      onChange={e => { setSignupForm({ ...signupForm, confirmPassword: e.target.value }); setErrors({...errors, confirmPassword: ''}) }}
                      disabled={loading} />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
                  {signupForm.confirmPassword && signupForm.password === signupForm.confirmPassword && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><FiCheck className="w-3 h-3" /> Passwords match</p>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account…
                    </>
                  ) : 'Create Account'}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setTab('login'); setErrors({}); }}
                    className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By using HealthAI, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
