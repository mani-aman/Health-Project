import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import api from '../services/api.js'
import toast from 'react-hot-toast'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']

const DoctorRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    specialization: '',
    experience: '',
    fees: '',
    selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    selectedSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
  })

  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }))
  }

  const toggleSlot = (slot) => {
    setFormData((prev) => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slot)
        ? prev.selectedSlots.filter((s) => s !== slot)
        : [...prev.selectedSlots, slot],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (formData.selectedDays.length === 0) {
      toast.error('Select at least one day')
      setLoading(false)
      return
    }

    if (formData.selectedSlots.length === 0) {
      toast.error('Select at least one slot')
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        experience: Number(formData.experience),
        fees: Number(formData.fees),
        availability: {
          days: formData.selectedDays,
          slots: formData.selectedSlots,
        },
      }

      const { data } = await api.post('/auth/doctor-signup', payload)

      if (data.success) {
        setAuth(data.token, data.user)
        toast.success('Registered successfully')
        navigate('/doctor/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl">
        
        <h2 className="text-3xl font-bold text-center mb-6">
          Doctor Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="First Name"
              required
              className="input-field"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
            <input
              placeholder="Last Name"
              required
              className="input-field"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            required
            className="input-field"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />

          {/* Phone */}
          <input
            placeholder="Phone"
            className="input-field"
            value={formData.mobile}
            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            required
            className="input-field"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          {/* Specialization */}
          <input
            placeholder="Specialization (e.g. Cardiologist)"
            required
            className="input-field"
            value={formData.specialization}
            onChange={(e) => setFormData({...formData, specialization: e.target.value})}
          />

          {/* Experience + Fees */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Experience"
              className="input-field"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
            />
            <input
              type="number"
              placeholder="Fees ₹"
              className="input-field"
              value={formData.fees}
              onChange={(e) => setFormData({...formData, fees: e.target.value})}
            />
          </div>

          {/* Days */}
          <div>
            <p className="font-medium mb-2">Available Days</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 rounded-full ${
                    formData.selectedDays.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Slots */}
          <div>
            <p className="font-medium mb-2">Time Slots</p>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  className={`px-3 py-1 rounded-full ${
                    formData.selectedSlots.includes(slot)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Already have account? <Link to="/doctor/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default DoctorRegister;