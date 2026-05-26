import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import toast from 'react-hot-toast'

const DoctorLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(formData)
      if (data.user.role !== 'doctor') {
        logout()
        toast.error('This portal is for doctors only. Please use the patient login.')
        return
      }
      navigate('/doctor/dashboard')
    } catch {
      // Error handled in store
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Doctor Portal
          </h2>
          <p className="mt-2 text-center text-sm text-primary-600 font-medium">
            Sign in to manage appointments, prescriptions, and patient records
          </p>
        </div>
        <form className="mt-8 space-y-6 card" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/doctor/register" className="font-medium text-primary-600 hover:text-primary-500">
              Register as Doctor
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Not a doctor?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Patient Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default DoctorLogin

