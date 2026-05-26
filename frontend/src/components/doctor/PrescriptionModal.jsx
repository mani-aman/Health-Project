import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiX } from 'react-icons/fi'

const PrescriptionModal = ({ appointment, onClose, onSubmit }) => {
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '', frequency: '' }])
  const [notes, setNotes] = useState('')
  const [instructions, setInstructions] = useState('')

  const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', duration: '', frequency: '' }])
  const removeMedicine = (idx) => setMedicines(medicines.filter((_, i) => i !== idx))
  const updateMedicine = (idx, field, value) => {
    const updated = [...medicines]; updated[idx][field] = value; setMedicines(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validMeds = medicines.filter(m => m.name.trim())
    if (validMeds.length === 0) { toast.error('Add at least one medicine'); return }
    onSubmit({ appointmentId: appointment._id, medicines: validMeds, notes, instructions })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Create Prescription</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm">Patient: <b>{appointment.patientName}</b></p>
            <p className="text-sm">{appointment.date} at {appointment.time}</p>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Medicines</label>
              <button type="button" onClick={addMedicine} className="text-sm text-primary-600 flex items-center gap-1">
                <FiPlus /> Add
              </button>
            </div>
            {medicines.map((med, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                <input placeholder="Name" className="col-span-4 input-field text-sm" value={med.name} onChange={e => updateMedicine(idx, 'name', e.target.value)} required />
                <input placeholder="Dosage" className="col-span-3 input-field text-sm" value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} />
                <input placeholder="Duration" className="col-span-3 input-field text-sm" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} />
                <button type="button" onClick={() => removeMedicine(idx)} className="col-span-2 p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiX /></button>
                <input placeholder="Frequency" className="col-span-12 input-field text-sm" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} />
              </div>
            ))}
          </div>
          <textarea className="input-field text-sm w-full" rows={2} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <textarea className="input-field text-sm w-full" rows={2} placeholder="Instructions" value={instructions} onChange={e => setInstructions(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PrescriptionModal

