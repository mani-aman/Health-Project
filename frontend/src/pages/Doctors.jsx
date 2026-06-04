import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api.js'
import { FiSearch, FiMapPin, FiClock, FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import AppointmentDateTimeModal from '../components/AppointmentDateTimeModal.jsx'

const Doctors = () => {
  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors').then(res => res.data.doctors),
  })

  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [pendingDoctorId, setPendingDoctorId] = useState(null)

  const todayMin = useMemo(() => {
    return new Date().toISOString().slice(0, 10)
  }, [])

  const bookAppointment = async (doctorId, { date, time }) => {
    const toastId = toast.loading('Booking appointment...')
    try {
      await api.post('/appointments/book', {
        doctorId,
        date,
        time,
      })

      toast.success('Appointment booked successfully!', { id: toastId })
      setBookingModalOpen(false)
      setPendingDoctorId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed', { id: toastId })
    }

  }

  const openBooking = (doctorId) => {
    setPendingDoctorId(doctorId)
    setBookingModalOpen(true)
  }


  if (error) return <div className="text-center py-20 text-red-500">Error loading doctors</div>

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Find the Right Doctor</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse our verified specialists and book appointments instantly
        </p>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search doctors by name or specialty..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
        </div>
        <button className="btn-primary px-8 whitespace-nowrap">
          Advanced Search
        </button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <div className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors?.map((doctor) => (
            <div key={doctor._id} className="card hover:shadow-xl transition-all group cursor-pointer">
              <div className="relative mb-4">
                <div className="w-full h-48 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-end p-6 text-white">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <div className="w-20 h-20 bg-white/30 rounded-full mx-auto mb-2"></div>
                  </div>
                </div>
                <button
                  onClick={() => openBooking(doctor._id)}
                  className="absolute top-4 right-4 btn-primary px-4 py-2 text-sm opacity-0 group-hover:opacity-100 transition-all"
                >
                  Book Now
                </button>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Dr. {doctor.name}</h3>
                <p className="text-primary-600 font-semibold mb-4">{doctor.specialization}</p>
                <div className="flex items-center justify-center mb-4">
                  <FiStar className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="font-semibold text-gray-900">4.9 (124 reviews)</span>
                </div>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiMapPin className="w-4 h-4 mr-1" />
                    Available Today
                  </div>
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 mr-1" />
                    30 min consult
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppointmentDateTimeModal
        open={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false)
          setPendingDoctorId(null)
        }}
        title="Select Appointment Date"
        onConfirm={({ date, time }) => {
          if (!pendingDoctorId) return
          bookAppointment(pendingDoctorId, { date, time })
        }}
      />
    </div>
  )
}

export default Doctors





