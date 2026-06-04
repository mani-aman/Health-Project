import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api.js'
import { useAuthStore } from '../stores/authStore.js'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiFileText, FiArrowLeft, FiAlertCircle } from 'react-icons/fi'

const Prescriptions = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['prescriptions', 'mine'],
    queryFn: () => api.get('/prescriptions/mine').then((res) => res.data),
    staleTime: 0,
    retry: 1,
  })

  const prescriptions = useMemo(() => data || [], [data])

  if (error) {
    toast.error('Failed to load prescriptions')
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FiFileText className="text-primary-600" />
              My Prescriptions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.firstName ? `Hi ${user.firstName}, here are your prescriptions` : 'Your prescriptions'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="font-semibold text-gray-900">No prescriptions found</h2>
              <p className="text-sm text-gray-600 mt-1">When your doctor creates a prescription, it will appear here.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((presc) => (
              <div key={presc._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{new Date(presc.createdAt).toLocaleDateString()}</p>
                    <h2 className="text-lg font-semibold text-gray-900 mt-1">
                      Dr. {presc.doctorId?.firstName} {presc.doctorId?.lastName}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Appointment: {presc.appointmentId?.date} at {presc.appointmentId?.time}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 font-medium">
                    {presc.medicines?.length || 0} medicines
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Medicines</h3>
                    {presc.medicines?.length ? (
                      <ul className="space-y-2">
                        {presc.medicines.map((m, idx) => (
                          <li key={`${m.name}-${idx}`} className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900">{m.name}</p>
                              <p className="text-sm text-gray-600">Dosage: {m.dosage || '--'}</p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>Duration: {m.duration || '--'}</p>
                              <p>Frequency: {m.frequency || '--'}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No medicines listed.</p>
                    )}
                  </div>

                  {(presc.notes || presc.instructions) && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{presc.notes || '--'}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{presc.instructions || '--'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default Prescriptions

