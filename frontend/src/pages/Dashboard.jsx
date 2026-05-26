import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import api from '../services/api.js'
import toast from 'react-hot-toast'
import { 
  FiCalendar, 
  FiBell, 
  FiFileText, 
  FiActivity, 
  FiClipboard,
  FiX,
  FiClock,
  FiHeart,
  FiArrowRight,
  FiUser,
  FiDollarSign
} from 'react-icons/fi'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch all dashboard data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(res => res.data),
  })

  const { data: appointmentsData, isLoading: apptsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments/my').then(res => res.data),
  })

  const { data: notificationsData, isLoading: notifsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(res => res.data),
  })

  const { data: prescriptions, isLoading: prescLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => api.get('/users/prescriptions').then(res => res.data),
    onError: (err) => console.error('Failed to load prescriptions', err),
  })

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['records'],
    queryFn: () => api.get('/users/records').then(res => res.data),
    onError: (err) => console.error('Failed to load records', err),
  })




  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors').then(res => res.data.doctors),
  })

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: (id) => api.put(`/appointments/cancel/${id}`),
    onSuccess: () => {
      toast.success('Appointment cancelled')
      queryClient.invalidateQueries(['appointments'])
    },
    onError: () => toast.error('Failed to cancel'),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => {
      if (id === 'all') {
        return api.patch('/notifications/read-all')
      }
      return api.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  })

  const bookMutation = useMutation({
    mutationFn: ({ doctorId, date, time }) => api.post('/appointments/book', { doctorId, date, time }),
    onSuccess: () => {
      toast.success('Appointment booked successfully!')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Booking failed'),
  })

  const appointments = appointmentsData || []
  const notifications = notificationsData?.notifications || []
  const unreadCount = notificationsData?.unreadCount || 0
  const doctors = doctorsData || []

  // Stats
  const upcomingAppts = appointments.filter(a => a.status !== 'cancelled')
  const totalPrescriptions = prescriptions?.length || 0
  const totalRecords = records?.length || 0

  // BMI calculation display
  const bmi = profile?.healthProfile?.bmi
  const getBmiStatus = (bmi) => {
    if (!bmi) return { label: 'Not calculated', color: 'text-gray-500', bg: 'bg-gray-100' }
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (bmi < 25) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-100' }
  }
  const bmiStatus = getBmiStatus(bmi)

  const handleBook = (doctorId) => {
    const date = prompt('Enter date (YYYY-MM-DD):')
    const time = prompt('Enter time (e.g., 10:30 AM):')
    if (!date || !time) return
    bookMutation.mutate({ doctorId, date, time })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.firstName || user?.firstName || 'User'}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Here is your health overview for today
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <FiHeart className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Health Score: Good</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="card hover:shadow-xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <FiCalendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{upcomingAppts.length}</p>
            <p className="text-sm text-gray-500 mt-1">Upcoming Appointments</p>
          </div>

          <div className="card hover:shadow-xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <FiFileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalPrescriptions}</p>
            <p className="text-sm text-gray-500 mt-1">Prescriptions</p>
          </div>

          <div className="card hover:shadow-xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <FiClipboard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalRecords}</p>
            <p className="text-sm text-gray-500 mt-1">Medical Records</p>
          </div>

          <div className="card hover:shadow-xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
                <FiBell className="w-6 h-6 text-yellow-600" />
              </div>
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-white bg-red-500 px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{notifications.length}</p>
            <p className="text-sm text-gray-500 mt-1">Notifications</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Health Metrics */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl mr-4">
                    <FiActivity className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Health Metrics</h3>
                    <p className="text-sm text-gray-500">Your latest health profile data</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Update Profile →
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Height</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile?.healthProfile?.height ? `${profile.healthProfile.height} cm` : '--'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Weight</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile?.healthProfile?.weight ? `${profile.healthProfile.weight} kg` : '--'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">BMI</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bmi || '--'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${bmiStatus.bg} ${bmiStatus.color}`}>
                    {bmiStatus.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Available Doctors */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 rounded-xl mr-4">
                    <FiUser className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Available Doctors</h3>
                    <p className="text-sm text-gray-500">Book an appointment with our specialists</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/doctors')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </button>
              </div>

              {doctorsLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1,2].map(i => (
                    <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-xl">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : doctors.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {doctors.slice(0, 4).map(doctor => (
                    <div key={doctor._id} className="p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">Dr. {doctor.name}</p>
                          <p className="text-sm text-indigo-600 font-medium">{doctor.specialization}</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {doctor.name?.[0] || 'D'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center"><FiClipboard className="w-3 h-3 mr-1" />{doctor.experience} yrs exp</span>
                        <span className="flex items-center"><FiDollarSign className="w-3 h-3 mr-1" />₹{doctor.fees}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {doctor.availability?.days?.slice(0, 3).map(day => (
                          <span key={day} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200">{day}</span>
                        ))}
                        {doctor.availability?.days?.length > 3 && (
                          <span className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200">+{doctor.availability.days.length - 3}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleBook(doctor._id)}
                        disabled={bookMutation.isLoading}
                        className="w-full py-2 btn-primary text-sm font-medium transition-colors"
                      >
                        {bookMutation.isLoading ? 'Booking...' : 'Book Now'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No doctors available right now</p>
                </div>
              )}
            </div>

            {/* Appointments */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <FiCalendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Upcoming Appointments</h3>
                    <p className="text-sm text-gray-500">Your scheduled consultations</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/doctors')}
                  className="btn-primary text-sm"
                >
                  Book New
                </button>
              </div>

              {apptsLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse flex items-center p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingAppts.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppts.slice(0, 5).map(apt => (
                    <div key={apt._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {apt.doctorId?.firstName?.[0] || 'D'}
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-gray-900">
                            Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FiClock className="w-4 h-4 mr-1" />
                            {apt.date} at {apt.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {apt.status}
                        </span>
                        <button
                          onClick={() => cancelMutation.mutate(apt._id)}
                          disabled={cancelMutation.isLoading}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel appointment"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No upcoming appointments</p>
                  <button 
                    onClick={() => navigate('/doctors')}
                    className="btn-primary"
                  >
                    Book an Appointment
                  </button>
                </div>
              )}
            </div>

            {/* Recent Prescriptions */}
            {totalPrescriptions > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-xl mr-4">
                      <FiFileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Recent Prescriptions</h3>
                      <p className="text-sm text-gray-500">Your latest medications</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {prescriptions.slice(0, 3).map(presc => (
                    <div key={presc._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Prescription from Dr. {presc.doctorId?.firstName} {presc.doctorId?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {presc.medicines?.length || 0} medications prescribed
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(presc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-8">
            
            {/* Notifications */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-xl mr-4">
                    <FiBell className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-500">Stay updated</p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markReadMutation.mutate('all')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-xl">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.slice(0, 8).map(notif => (
                    <div 
                      key={notif._id} 
                      onClick={() => !notif.read && markReadMutation.mutate(notif._id)}
                      className={`p-4 rounded-xl cursor-pointer transition-colors ${
                        notif.read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/doctors')}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <FiCalendar className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-900">Book Appointment</span>
                  </div>
                  <FiArrowRight className="w-5 h-5 text-blue-600" />
                </button>
                <button 
                  onClick={() => navigate('/ai-tools')}
                  className="w-full flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <FiActivity className="w-5 h-5 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Symptom Checker</span>
                  </div>
                  <FiArrowRight className="w-5 h-5 text-green-600" />
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <FiClipboard className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="font-medium text-gray-900">Update Profile</span>
                  </div>
                  <FiArrowRight className="w-5 h-5 text-purple-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard;

