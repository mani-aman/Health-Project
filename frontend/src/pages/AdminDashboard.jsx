import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api.js'
import toast from 'react-hot-toast'
import { FiUsers, FiUserPlus, FiUserX, FiCalendar, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { useState } from 'react'

const AdminDashboard = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('doctors')
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [doctorForm, setDoctorForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    specialization: '',
    experience: '',
    fees: '',
  })

  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => api.get('/admin/doctors').then(res => res.data),
  })

  const { data: appointmentsData } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => api.get('/admin/appointments').then(res => res.data),
  })

  const createDoctorMutation = useMutation({
    mutationFn: (formData) => api.post('/admin/doctors', formData),
    onSuccess: () => {
      toast.success('Doctor created successfully!')
      setShowDoctorForm(false)
      setDoctorForm({ firstName: '', lastName: '', email: '', mobile: '', password: '', specialization: '', experience: '', fees: '' })
      queryClient.invalidateQueries(['admin-doctors'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create doctor'),
  })

  const deleteDoctorMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/doctors/${id}`),
    onSuccess: () => {
      toast.success('Doctor deleted!')
      queryClient.invalidateQueries(['admin-doctors'])
    },
    onError: () => toast.error('Failed to delete doctor'),
  })

  const approveDoctorMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/doctors/${id}`, { status: 'active' }),
    onSuccess: () => {
      toast.success('Doctor approved!')
      queryClient.invalidateQueries(['admin-doctors'])
    },
  })

  const doctors = doctorsData || []

  const handleCreateDoctor = (e) => {
    e.preventDefault()
    createDoctorMutation.mutate(doctorForm)
  }

  const handleApprove = (id) => approveDoctorMutation.mutate(id)
  const handleDelete = (id) => {
    if (confirm('Delete this doctor?')) deleteDoctorMutation.mutate(id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage doctors and appointments
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-white rounded-xl p-1 shadow-sm mb-8">
          <button
            className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            Doctors
            <FiUsers className="ml-1" />
          </button>
          <button
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
            <FiCalendar className="ml-1" />
          </button>
        </div>

        {activeTab === 'doctors' && (
          <div>
            {/* Add Doctor Button */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
              <button
                onClick={() => setShowDoctorForm(!showDoctorForm)}
                className="btn-primary flex items-center gap-2"
              >
                <FiUserPlus />
                {showDoctorForm ? 'Cancel' : 'Add Doctor'}
              </button>
            </div>

            {/* Add Doctor Form */}
            {showDoctorForm && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-xl font-bold mb-6">Create New Doctor</h3>
                <form onSubmit={handleCreateDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    placeholder="First Name"
                    className="input-field"
                    value={doctorForm.firstName}
                    onChange={(e) => setDoctorForm({...doctorForm, firstName: e.target.value})}
                    required
                  />
                  <input
                    placeholder="Last Name"
                    className="input-field"
                    value={doctorForm.lastName}
                    onChange={(e) => setDoctorForm({...doctorForm, lastName: e.target.value})}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="input-field"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Mobile"
                    className="input-field"
                    value={doctorForm.mobile}
                    onChange={(e) => setDoctorForm({...doctorForm, mobile: e.target.value})}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="input-field"
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({...doctorForm, password: e.target.value})}
                    required
                  />
                  <input
                    placeholder="Specialization"
                    className="input-field"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({...doctorForm, specialization: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Experience (years)"
                    className="input-field"
                    value={doctorForm.experience}
                    onChange={(e) => setDoctorForm({...doctorForm, experience: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Consultation Fees"
                    className="input-field"
                    value={doctorForm.fees}
                    onChange={(e) => setDoctorForm({...doctorForm, fees: e.target.value})}
                  />
                  <div className="md:col-span-2 flex gap-4">
                    <button type="submit" className="btn-primary flex-1">
                      Create Doctor
                    </button>
                    <button
                      type="button"
                      className="btn-secondary flex-1"
                      onClick={() => setShowDoctorForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Doctors Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fees</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {doctorsLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                          Loading doctors...
                        </td>
                      </tr>
                    ) : doctors.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          No doctors found. Create your first doctor!
                        </td>
                      </tr>
                    ) : (
                      doctors.map((doctor) => (
                        <tr key={doctor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            Dr. {doctor.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doctor.specialization}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doctor.experience} yrs
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{doctor.fees}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                              doctor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {doctor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {doctor.status === 'pending' && (
                              <button
                                onClick={() => handleApprove(doctor._id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <FiCheckCircle />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(doctor._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Appointments</h2>
            {appointmentsData && appointmentsData.length > 0 ? (
              <div className="grid gap-4">
                {appointmentsData.slice(0, 10).map((apt) => (
                  <div key={apt._id} className="flex items-center p-4 border rounded-lg hover:shadow-md">
                    <div className="flex-1">
                      <p className="font-medium">{apt.userId?.firstName} {apt.userId?.lastName}</p>
                      <p className="text-sm text-gray-500">{apt.doctorId?.firstName} {apt.doctorId?.lastName}</p>
                      <p className="text-sm">{apt.date} at {apt.time}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs bg-gray-100">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No appointments</p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 500;
          border: none;
          background: transparent;
          color: #6b7280;
          transition: all 0.2s;
          cursor: pointer;
        }
        .tab-btn.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .input-field {
          @apply w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm;
        }
        .btn-primary {
          @apply bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 font-medium transition-colors shadow-md;
        }
        .btn-secondary {
          @apply bg-gray-200 text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-300 font-medium transition-colors;
        }
      `}</style>
    </div>
  )
}

export default AdminDashboard

