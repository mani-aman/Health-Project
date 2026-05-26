import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore.js'
import api from '../services/api.js'
import toast from 'react-hot-toast'
import {
  FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiActivity,
  FiClipboard, FiUsers, FiFileText, FiSearch, FiArrowRight
} from 'react-icons/fi'
import PrescriptionModal from '../components/doctor/PrescriptionModal.jsx'
import UploadRecordModal from '../components/doctor/UploadRecordModal.jsx'
import PatientDetailModal from '../components/doctor/PatientDetailModal.jsx'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-800',
}

const TAB_LABELS = {
  all: 'All', pending: 'Pending', confirmed: 'Confirmed',
  completed: 'Completed', cancelled: 'Cancelled', rejected: 'Rejected'
}

const StatCard = ({ icon: Icon, color, value, label }) => (
  <div className="card hover:shadow-xl transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 ${color} rounded-lg`}><Icon className="w-5 h-5" /></div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
)

const DoctorDashboard = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState(null) // 'prescription' | 'upload' | 'patient'
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const { data: appointmentsData, isLoading: apptsLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api.get('/appointments/doctor').then(res => res.data),
  })

  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: () => api.get('/doctors/mypatients').then(res => res.data),
  })

  const { data: prescriptionsData } = useQuery({
    queryKey: ['doctor-prescriptions'],
    queryFn: () => api.get('/prescriptions/my').then(res => res.data),
  })

  const confirmMutation = useMutation({
    mutationFn: (id) => api.put(`/appointments/confirm/${id}`),
    onSuccess: () => { toast.success('Confirmed'); queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError: (error) => toast.error(error.response?.data?.msg || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => api.put(`/appointments/reject/${id}`),
    onSuccess: () => { toast.success('Rejected'); queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError: (error) => toast.error(error.response?.data?.msg || 'Failed'),
  })

  const completeMutation = useMutation({
    mutationFn: (id) => api.put(`/appointments/complete/${id}`),
    onSuccess: () => { toast.success('Completed'); queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError: (error) => toast.error(error.response?.data?.msg || 'Failed'),
  })

  const createPrescriptionMutation = useMutation({
    mutationFn: (data) => api.post('/prescriptions/create', data),
    onSuccess: () => {
      toast.success('Prescription created')
      setModal(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] })
    },
    onError: (error) => toast.error(error.response?.data?.msg || 'Failed'),
  })

  const uploadRecordMutation = useMutation({
    mutationFn: (formData) => api.post('/doctors/records', formData),
    onSuccess: () => {
      toast.success('Uploaded')
      setModal(null)
      setSelectedPatient(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient-details'] })
    },
    onError: (error) => toast.error(error.response?.data?.msg || 'Upload failed'),
  })

  const appointments = appointmentsData || []
  const patients = patientsData || []
  const prescriptions = prescriptionsData || []

  const filteredAppointments = activeTab === 'all'
    ? appointments : appointments.filter(a => a.status === activeTab)

  const filteredPatients = searchTerm
    ? patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    : patients

  const today = new Date().toISOString().split('T')[0]
  const todaysAppointments = appointments.filter(a => a.date === today)

const openPrescription = (apt) => {
    setSelectedAppointment({ _id: apt._id, patientName: `${apt.userId?.firstName} ${apt.userId?.lastName}`, date: apt.date, time: apt.time })
    setModal('prescription')
  }

  const openPatient = (patient) => { setSelectedPatient(patient); setModal('patient') }

  const openUploadRecord = (patient) => { setSelectedPatient(patient); setModal('upload') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, Dr. {user?.firstName || 'Doctor'}!</h1>
          <p className="text-lg text-gray-600">Manage your appointments, patients, and prescriptions</p>
          
          {/* Welcome banner for new doctors */}
          {appointments.length === 0 && !apptsLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Getting Started:</strong> Your profile is active and visible to patients. 
                Patients can find you on the Doctors page and book appointments. 
                Once a patient books, you'll see them here!
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <StatCard icon={FiCalendar} color="bg-blue-100 text-blue-600" value={appointments.length} label="Total Appointments" />
          <StatCard icon={FiClock} color="bg-yellow-100 text-yellow-600" value={appointments.filter(a => a.status === 'pending').length} label="Pending" />
          <StatCard icon={FiCheckCircle} color="bg-green-100 text-green-600" value={appointments.filter(a => a.status === 'completed').length} label="Completed" />
          <StatCard icon={FiUsers} color="bg-purple-100 text-purple-600" value={patients.length} label="Total Patients" />
          <StatCard icon={FiActivity} color="bg-orange-100 text-orange-600" value={todaysAppointments.length} label="Today's" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Appointments */}
            <div className="card">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-xl mr-4"><FiClipboard className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <h3 className="text-xl font-bold">Appointments</h3>
                  <p className="text-sm text-gray-500">Manage patient appointments</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(TAB_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {label}
                    {key !== 'all' && <span className="ml-1.5 text-xs opacity-75">{appointments.filter(a => a.status === key).length}</span>}
                  </button>
                ))}
              </div>

              {apptsLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="ml-4 flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/4"></div></div>
                  </div>
                ))}</div>
              ) : filteredAppointments.length > 0 ? (
                <div className="space-y-3">
                  {filteredAppointments.map(apt => (
                    <div key={apt._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors gap-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer"
                          onClick={() => openPatient(apt.userId)}>{apt.userId?.firstName?.[0] || 'P'}</div>
                        <div className="ml-4">
                          <p className="font-semibold cursor-pointer hover:text-primary-600" onClick={() => openPatient(apt.userId)}>
                            {apt.userId?.firstName} {apt.userId?.lastName}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1"><FiClock className="w-4 h-4 mr-1" />{apt.date} at {apt.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[apt.status] || 'bg-gray-100 text-gray-800'}`}>{apt.status}</span>
                        {apt.status === 'pending' && (
                          <>
                            <button onClick={() => confirmMutation.mutate(apt._id)} disabled={confirmMutation.isLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Confirm"><FiCheckCircle className="w-5 h-5" /></button>
                            <button onClick={() => rejectMutation.mutate(apt._id)} disabled={rejectMutation.isLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Reject"><FiXCircle className="w-5 h-5" /></button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <>
                            <button onClick={() => openPrescription(apt)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                              <FiFileText className="w-4 h-4" /> Prescribe
                            </button>
                            <button onClick={() => completeMutation.mutate(apt._id)} disabled={completeMutation.isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                              <FiCheckCircle className="w-4 h-4" /> Complete
                            </button>
                          </>
                        )}
                        <button onClick={() => openPatient(apt.userId)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="View">
                          <FiArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No appointments found</p></div>
              )}
            </div>

            {/* Patients */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-xl mr-4"><FiUsers className="w-6 h-6 text-purple-600" /></div>
                  <div>
                    <h3 className="text-xl font-bold">My Patients</h3>
                    <p className="text-sm text-gray-500">All patients you have consulted</p>
                  </div>
                </div>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {patientsLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="ml-3 flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/4"></div></div>
                  </div>
                ))}</div>
              ) : filteredPatients.length > 0 ? (
                <div className="space-y-3">
                  {filteredPatients.map(patient => (
                    <div key={patient._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">{patient.firstName?.[0] || 'P'}</div>
                        <div className="ml-3">
                          <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openUploadRecord(patient)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg" title="Upload Record"><FiFileText /></button>
                        <button onClick={() => openPatient(patient)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="View"><FiArrowRight /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8"><FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No patients found</p></div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Today's Appointments */}
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-orange-100 rounded-lg mr-3"><FiCalendar className="w-5 h-5 text-orange-600" /></div>
                <h3 className="font-bold">Today's Schedule</h3>
              </div>
              {todaysAppointments.length > 0 ? (
                <div className="space-y-2">
                  {todaysAppointments.map(apt => (
                    <div key={apt._id} className="p-3 bg-gray-50 rounded-xl">
                      <p className="font-medium text-sm">{apt.userId?.firstName} {apt.userId?.lastName}</p>
                      <p className="text-xs text-gray-500">{apt.time} • <span className={STATUS_STYLES[apt.status]?.replace('bg-', '').replace('text-', '')}>{apt.status}</span></p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center py-4 text-gray-500 text-sm">No appointments today</p>}
            </div>

            {/* Recent Prescriptions */}
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3"><FiFileText className="w-5 h-5 text-green-600" /></div>
                <h3 className="font-bold">Recent Prescriptions</h3>
              </div>
              {prescriptions.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {prescriptions.slice(0, 5).map(presc => (
                    <div key={presc._id} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium">{presc.medicines?.length || 0} medicines</p>
                      <p className="text-xs text-gray-500">{new Date(presc.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center py-4 text-gray-500 text-sm">No prescriptions yet</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'prescription' && selectedAppointment && (
        <PrescriptionModal
          appointment={selectedAppointment}
          onClose={() => setModal(null)}
          onSubmit={createPrescriptionMutation.mutate}
        />
      )}
      {modal === 'upload' && selectedPatient && (
        <UploadRecordModal
          patientId={selectedPatient._id}
          onClose={() => setModal(null)}
          onSubmit={uploadRecordMutation.mutate}
        />
      )}
      {modal === 'patient' && selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setModal(null)}
          onUploadRecord={() => openUploadRecord(selectedPatient)}
        />
      )}
    </div>
  )
}

export default DoctorDashboard

