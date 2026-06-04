import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import toast from 'react-hot-toast'

const Profile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [healthData, setHealthData] = useState({})

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(res => res.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', { healthProfile: data }),
    onSuccess: () => {
      toast.success('Profile updated!')
      queryClient.invalidateQueries(['profile'])
      setEditMode(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || err.response?.data?.msg || 'Update failed'),
  })

  const handleInputChange = (e) => {
    setHealthData({
      ...healthData,
      [e.target.name]: parseFloat(e.target.value) || e.target.value
    })
  }

  if (isLoading) return <div className="max-w-4xl mx-auto py-12 px-4">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Health Profile</h1>
        <p className="text-xl text-gray-600">Keep your medical information up to date</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Profile Info */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Info</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span className="font-semibold">{profile?.firstName} {profile?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span>{profile?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span>{profile?.phone || 'Not set'}</span>
            </div>
            {profile?.healthProfile?.bmi && (
              <div className="flex justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                <span className="text-gray-500">BMI:</span>
                <span className="font-bold text-success-600">{profile.healthProfile.bmi}</span>
              </div>
            )}
          </div>
        </div>

        {/* Health Data Form */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Health Metrics</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                editMode
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'text-primary-600 hover:text-primary-700'
              }`}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            updateMutation.mutate(healthData)
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
              <input
                name="height"
                type="number"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 175"
                value={healthData.height || profile?.healthProfile?.height || ''}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                name="weight"
                type="number"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 70.5"
                value={healthData.weight || profile?.healthProfile?.weight || ''}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Health Goals</label>
              <input
                name="goal"
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Weight loss, Muscle gain"
                value={healthData.goal || profile?.healthProfile?.goal || ''}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </div>
            {editMode && (
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
              >
                {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="card p-8 text-center hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Prescriptions</h3>
          <p className="text-gray-500 mb-6">View your medication history</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-6 py-2 text-sm">View Prescriptions</button>
        </div>
        <div className="card p-8 text-center hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Medical Records</h3>
          <p className="text-gray-500 mb-6">Upload & manage documents</p>
          <button onClick={() => navigate('/medical-records')} className="btn-primary px-6 py-2 text-sm">Upload Record</button>


        </div>
        <div className="card p-8 text-center hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">BMI Calculator</h3>
          <p className="text-gray-500 mb-6">Track your health metrics</p>
          <button onClick={() => toast(`Your BMI: ${profile?.healthProfile?.bmi || 'Not calculated'}`)} className="btn-primary px-6 py-2 text-sm">Calculate BMI</button>

        </div>
      </div>
    </div>
  )
}

export default Profile

