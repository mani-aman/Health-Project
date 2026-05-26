import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import toast from 'react-hot-toast'

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(formData)
      if (data.user.role !== 'admin') {
        toast.error('Admin access only. Please use patient or doctor login.')
        return
      }
      navigate('/admin')
    } catch {
      // Error handled in store
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage doctors and appointments
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              className="input-field w-full"
              placeholder="admin@healthai.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="input-field w-full"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 font-medium transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="text-center space-y-2 text-sm text-gray-600">
          <p>Patient? <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Patient Login</Link></p>
          <p>Doctor? <Link to="/doctor/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Doctor Login</Link></p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
