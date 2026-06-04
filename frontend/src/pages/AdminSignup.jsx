import { useNavigate, Link } from 'react-router-dom'

const AdminSignup = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Admin Signup Disabled</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Admin accounts can only be created manually by developers or through a protected backend-only process.
          </p>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 font-medium transition-all shadow-lg"
          >
            Go to Admin Login
          </button>
        </div>

        <div className="text-center text-sm text-gray-600">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Patient Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminSignup

/*
  Public admin signup page intentionally disabled.
*/

// Admin signup page intentionally disabled.
// The public UI must not allow creating admin accounts.


