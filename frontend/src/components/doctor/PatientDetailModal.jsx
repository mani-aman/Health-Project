import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api.js'
import { FiX, FiUser, FiHeart, FiCalendar, FiFileText, FiClipboard } from 'react-icons/fi'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-800',
}

const PatientDetailModal = ({ patient, onClose, onUploadRecord }) => {
  const [activeSection, setActiveSection] = useState('info')

  const { data: detail, isLoading } = useQuery({
    queryKey: ['patient-details', patient._id],
    queryFn: () => api.get(`/doctors/patients/${patient._id}`).then(res => res.data),
    enabled: !!patient._id
  })

  const d = detail || {}

  const tabs = [
    { key: 'info', label: 'Info', icon: FiUser },
    { key: 'history', label: 'History', icon: FiHeart },
    { key: 'appointments', label: 'Visits', icon: FiCalendar },
    { key: 'prescriptions', label: 'Rx', icon: FiClipboard },
    { key: 'records', label: 'Records', icon: FiFileText },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {patient.firstName?.[0] || 'P'}
            </div>
            <div>
              <h3 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h3>
              <p className="text-sm text-gray-500">{patient.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
        </div>

        <div className="p-6">
          <div className="flex gap-1 mb-4 border-b pb-2 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === tab.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <>
              {activeSection === 'info' && (
                <div className="grid grid-cols-2 gap-3">
                  {[ 
                    { label: 'Phone', value: d.patient?.mobile || '--' },
                    { label: 'Appointments', value: patient.totalAppointments || 0 },
                    { label: 'Height', value: d.patient?.healthProfile?.height ? `${d.patient.healthProfile.height} cm` : '--' },
                    { label: 'Weight', value: d.patient?.healthProfile?.weight ? `${d.patient.healthProfile.weight} kg` : '--' },
                    { label: 'BMI', value: d.patient?.healthProfile?.bmi || '--' },
                    { label: 'Blood Group', value: d.patient?.healthProfile?.bloodGroup || '--' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="font-medium text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'history' && (
                d.medicalHistory ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Blood Group', value: d.medicalHistory.bloodGroup || '--' },
                      { label: 'Allergies', value: d.medicalHistory.allergies?.join(', ') || 'None' },
                      { label: 'Chronic Diseases', value: d.medicalHistory.chronicDiseases?.join(', ') || 'None' },
                      { label: 'Medications', value: d.medicalHistory.medications?.join(', ') || 'None' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="font-medium text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center py-8 text-gray-500">No medical history</p>
              )}

              {activeSection === 'appointments' && (
                <div className="space-y-2">
                  {d.appointments?.length > 0 ? d.appointments.map(apt => (
                    <div key={apt._id} className="p-3 bg-gray-50 rounded-xl flex justify-between">
                      <span className="text-sm font-medium">{apt.date} at {apt.time}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[apt.status]}`}>{apt.status}</span>
                    </div>
                  )) : <p className="text-center py-8 text-gray-500">No appointments</p>}
                </div>
              )}

              {activeSection === 'prescriptions' && (
                <div className="space-y-2">
                  {d.prescriptions?.length > 0 ? d.prescriptions.map(presc => (
                    <div key={presc._id} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium">{presc.medicines?.length || 0} medicines</p>
                      <p className="text-xs text-gray-400">{new Date(presc.createdAt).toLocaleDateString()}</p>
                    </div>
                  )) : <p className="text-center py-8 text-gray-500">No prescriptions</p>}
                </div>
              )}

              {activeSection === 'records' && (
                <div className="space-y-2">
                  {d.records?.length > 0 ? d.records.map(rec => (
                    <div key={rec._id} className="p-3 bg-gray-50 rounded-xl flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{rec.filename}</p>
                        <p className="text-xs text-gray-500 capitalize">{rec.type}</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                  )) : <p className="text-center py-8 text-gray-500">No records</p>}
                  {onUploadRecord && (
                    <button onClick={onUploadRecord} className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                      Upload Record
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientDetailModal

