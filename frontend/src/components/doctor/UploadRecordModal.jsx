import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiX } from 'react-icons/fi'

const UploadRecordModal = ({ patientId, onClose, onSubmit }) => {
  const [file, setFile] = useState(null)
  const [type, setType] = useState('report')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) { toast.error('Please select a file'); return }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('patientId', patientId)
    formData.append('type', type)
    formData.append('description', description)
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Upload Medical Record</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Record Type</label>
            <select className="input-field text-sm w-full" value={type} onChange={e => setType(e.target.value)}>
              <option value="report">Report</option>
              <option value="scan">Scan</option>
              <option value="lab-result">Lab Result</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input className="input-field text-sm w-full" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">File</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Upload</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadRecordModal

