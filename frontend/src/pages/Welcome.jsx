import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaHeartbeat, FaUserMd } from 'react-icons/fa'
import { FiShield, FiUsers, FiActivity } from 'react-icons/fi'


const Welcome = () => {
  const navigate = useNavigate()

  const primaryButtons = useMemo(
    () => [
      {
        key: 'patient-login',
        label: 'Patient Login',
        sub: 'Access your dashboard & appointments',
        icon: <FiUsers className="w-5 h-5" />,
        className:
          'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white border-transparent',
        onClick: () => navigate('/login'),
      },
      {
        key: 'patient-signup',
        label: 'Patient Signup',
        sub: 'Create your HealthAI patient account',
        icon: <FiShield className="w-5 h-5" />,
        className:
          'bg-white hover:bg-primary-50 text-primary-700 border-primary-200',
        onClick: () => navigate('/register'),
      },
      {
        key: 'doctor-login',
        label: 'Doctor Login',
        sub: 'Manage patients, appointments & prescriptions',
        icon: <FaUserMd className="w-5 h-5" />,
        className:
          'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200',
        onClick: () => navigate('/doctor/login'),
      },
      {
      key: 'doctor-signup',
        label: 'Doctor Signup',
        sub: 'Register to get started with the doctor portal',
        icon: <FiActivity className="w-5 h-5" />,

        className:
          'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-transparent',
        onClick: () => navigate('/doctor/register'),
      },
      {
        key: 'admin-login',
        label: 'Admin Login',
        sub: 'Manage doctors, patients, appointments & analytics',
        icon: <FiUsers className="w-5 h-5" />,
        className:
          'bg-gray-900 hover:bg-gray-700 text-white border-transparent',
        onClick: () => navigate('/admin/login'),
      },
      {
        key: 'admin-signup',
        label: 'Admin Signup',
        sub: 'Create first admin account',
        icon: <FiUsers className="w-5 h-5" />,
        className:
          'bg-white hover:bg-gray-50 text-gray-800 border-gray-200',
        onClick: () => navigate('/admin/signup'),
      },
    ],
    [navigate]
  )


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50" />
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: hero */}
            <div className="p-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-white/80 shadow-sm">
                <FaHeartbeat className="text-primary-600" />
                <span className="text-sm font-medium text-gray-700">
                  HealthAI Portals
                </span>
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Welcome to HealthAI
              </h1>
              <p className="mt-4 text-gray-600 text-base sm:text-lg">
                Choose the right portal for you. Patients can book appointments and
                manage records. Doctors can handle appointments, prescriptions, and
                patient details.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/80 border border-white/90 shadow-sm flex items-center justify-center">
                    <FiShield className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Secure access</p>
                    <p className="text-sm text-gray-600">Login with your role</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/80 border border-white/90 shadow-sm flex items-center justify-center">
                    <FiUsers className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Role-based dashboards</p>
                    <p className="text-sm text-gray-600">Patient vs Doctor workflows</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-sm text-gray-500">
                Tip: Use Patient Login/Signup for personal health services.
              </div>
            </div>

            {/* Right: cards */}
            <div className="bg-white/85 backdrop-blur-md border border-white/90 shadow-xl rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Get started
                </h2>
                <div className="text-sm text-gray-500">Select your role</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {primaryButtons.map((b) => (
                  <button
                    key={b.key}
                    onClick={b.onClick}
                    className={`group rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${b.className}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-current">{b.icon}</span>
                          <span className="font-bold text-base">{b.label}</span>
                        </div>
                        <div
                          className={`mt-1 text-sm ${
                            b.className.includes('text-white')
                              ? 'text-white/90'
                              : 'text-gray-600'
                          }`}
                        >
                          {b.sub}
                        </div>
                      </div>

                      <div
                        className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center border ${
                          b.className.includes('text-white')
                            ? 'border-white/30 bg-white/10'
                            : 'border-gray-200 bg-gray-50'
                        } group-hover:scale-105 transition-transform`}
                      >
                        <span className="text-lg">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
                Need doctor access? Use <span className="font-semibold text-gray-700">Doctor Login</span> or{' '}
                <span className="font-semibold text-gray-700">Doctor Signup</span>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome


