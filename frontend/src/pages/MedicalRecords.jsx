import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../services/api.js'
import toast from 'react-hot-toast'
import { FiFileText, FiUpload, FiArrowLeft, FiPaperclip } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const MedicalRecords = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [file, setFile] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['records', 'mine'],
    queryFn: () => api.get('/users/records').then((res) => res.data),
    staleTime: 0,
  })

  const records = data || []

  const uploadMutation = useMutation({
    mutationFn: async (selectedFile) => {
      const formData = new FormData()
      // Backend multer is configured as upload.single('file')
      formData.append('file', selectedFile)
      return api.post('/users/records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      toast.success('Record uploaded')
      setFile(null)
      queryClient.invalidateQueries(['records', 'mine'])
    },
    onError: (err) => {
      toast.error(err?.response?.data?.msg || err?.response?.data?.message || 'Upload failed')
    },
  })

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FiFileText className="text-primary-600" />
              My Medical Records
            </h1>
            <p className="text-sm text-gray-500 mt-1">Upload and view your documents</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FiUpload className="text-primary-600" />
          Upload record
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose a file</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <FiPaperclip className="text-gray-500" />
              <input
                type="file"
                className="block w-full text-sm text-gray-600"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {file && <p className="text-xs text-gray-500 mt-2">Selected: {file.name}</p>}
          </div>
          <button
            onClick={() => file && uploadMutation.mutate(file)}
            disabled={!file || uploadMutation.isLoading}
            className="px-5 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {uploadMutation.isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Your uploads</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm text-red-600">
          Failed to load records
        </div>
      ) : records.length === 0 ? (
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm text-gray-600">
          No medical records uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => {
            const fileUrl = rec?.path ? `http://127.0.0.1:5000/${rec.path}` : null
            return (
              <div key={rec._id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{rec.filename || 'Medical record'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploaded: {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{rec.contentType || 'Document'} • {rec.size ? `${Math.round(rec.size / 1024)} KB` : ''}</p>
                  </div>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MedicalRecords

