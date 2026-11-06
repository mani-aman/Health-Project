import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore.js'
import api from '../services/api.js'
import toast from 'react-hot-toast'
import {
  FiUsers, FiUserPlus, FiTrash2, FiEdit2, FiCheckCircle,
  FiActivity, FiCalendar, FiFileText, FiSearch, FiRefreshCw, FiX
} from 'react-icons/fi'

const BASE = '/super-admin'

const tabs = [
  { key: 'overview',  label: 'Overview',         icon: FiActivity  },
  { key: 'doctors',   label: 'Doctor Management', icon: FiUserPlus  },
  { key: 'medical',   label: 'Medical Records',   icon: FiFileText  },
  { key: 'appointments', label: 'Appointments',   icon: FiCalendar  },
  { key: 'users',     label: 'Users',             icon: FiUsers     },
]

const StatusBadge = ({ status }) => {
  const cls = {
    active:   'bg-green-100 text-green-800',
    inactive: 'bg-gray-100  text-gray-600',
    blocked:  'bg-red-100   text-red-800',
    pending:  'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100  text-red-800',
    rejected:  'bg-gray-100  text-gray-600',
  }[status] || 'bg-gray-100 text-gray-600'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent'

export default function SuperAdminDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab]       = useState('overview')
  const [search,    setSearch]          = useState('')
  const [showCreate, setShowCreate]     = useState(false)
  const [editDoctor, setEditDoctor]     = useState(null)   // doctor object being edited
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', mobile: '',
    password: '', specialization: '', experience: '', fees: '',
  })

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: () => api.get(`${BASE}/stats`).then(r => r.data),
    enabled: activeTab === 'overview',
  })

  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['sa-doctors', search],
    queryFn: () => api.get(`${BASE}/doctors`).then(r => r.data),
    enabled: activeTab === 'doctors',
  })

  const { data: medicalData } = useQuery({
    queryKey: ['sa-medical'],
    queryFn: () => api.get(`${BASE}/medical-records?limit=20`).then(r => r.data),
    enabled: activeTab === 'medical',
  })

  const { data: appointments } = useQuery({
    queryKey: ['sa-appointments'],
    queryFn: () => api.get(`${BASE}/appointments`).then(r => r.data),
    enabled: activeTab === 'appointments',
  })

  const { data: usersData } = useQuery({
    queryKey: ['sa-users'],
    queryFn: () => api.get(`${BASE}/users`).then(r => r.data),
    enabled: activeTab === 'users',
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: data => api.post(`${BASE}/doctors`, data),
    onSuccess: () => {
      toast.success('Doctor created')
      setShowCreate(false)
      resetForm()
      qc.invalidateQueries(['sa-doctors'])
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.put(`${BASE}/doctors/${id}`, data),
    onSuccess: () => {
      toast.success('Doctor updated')
      setEditDoctor(null)
      qc.invalidateQueries(['sa-doctors'])
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`${BASE}/doctors/${id}`),
    onSuccess: () => { toast.success('Doctor deleted'); qc.invalidateQueries(['sa-doctors']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, status }) => api.put(`${BASE}/doctors/${id}`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['sa-doctors']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resetForm = () =>
    setForm({ firstName: '', lastName: '', email: '', mobile: '', password: '', specialization: '', experience: '', fees: '' })

  const openEdit = (doc) => {
    setEditDoctor(doc)
    setShowCreate(false)
  }

  const filteredDoctors = (doctors || []).filter(d =>
    `${d.name} ${d.specialization}`.toLowerCase().includes(search.toLowerCase())
  )

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Doctors',      value: stats?.totalDoctors      ?? '–', color: 'bg-blue-50   text-blue-700'   },
    { label: 'Total Patients',     value: stats?.totalPatients     ?? '–', color: 'bg-green-50  text-green-700'  },
    { label: 'Total Appointments', value: stats?.totalAppointments ?? '–', color: 'bg-orange-50 text-orange-700' },
    { label: 'Medical Records',    value: stats?.totalRecords      ?? '–', color: 'bg-red-50    text-red-700'    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {user?.firstName} {user?.lastName}</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 shadow-sm mb-8 border border-gray-100">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map(s => (
                <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-sm mt-1 opacity-75">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Appointments by status */}
            {stats?.appointmentsByStatus?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4">Appointments by Status</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.appointmentsByStatus.map(s => (
                    <div key={s._id} className="px-4 py-2 bg-gray-50 rounded-lg text-sm">
                      <span className="font-semibold">{s.count}</span>
                      <span className="text-gray-500 ml-2">{s._id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DOCTORS ── */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-48">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Search by name or specialization…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={() => { setShowCreate(!showCreate); setEditDoctor(null) }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                <FiUserPlus className="w-4 h-4" />{showCreate ? 'Cancel' : 'Add Doctor'}
              </button>
            </div>

            {/* Create form */}
            {showCreate && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4">Create Doctor Account</h3>
                <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="First Name *" required className={inputCls} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  <input placeholder="Last Name *" required className={inputCls} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  <input type="email" placeholder="Email *" required className={inputCls} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  <input placeholder="Mobile" className={inputCls} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                  <input type="password" placeholder="Password (min 8 chars) *" required className={inputCls} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <input placeholder="Specialization *" required className={inputCls} value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} />
                  <input type="number" placeholder="Experience (years)" className={inputCls} value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} />
                  <input type="number" placeholder="Consultation Fees" className={inputCls} value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} />
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" disabled={createMut.isLoading}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                      {createMut.isLoading ? 'Creating…' : 'Create Doctor'}
                    </button>
                    <button type="button" onClick={() => { setShowCreate(false); resetForm() }}
                      className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit form */}
            {editDoctor && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Edit: {editDoctor.name}</h3>
                  <button onClick={() => setEditDoctor(null)}><FiX className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={e => {
                  e.preventDefault()
                  const fd = new FormData(e.target)
                  updateMut.mutate({ id: editDoctor._id, data: Object.fromEntries(fd) })
                }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" defaultValue={editDoctor.name} placeholder="Name" className={inputCls} />
                  <input name="specialization" defaultValue={editDoctor.specialization} placeholder="Specialization" className={inputCls} />
                  <input name="experience" type="number" defaultValue={editDoctor.experience} placeholder="Experience" className={inputCls} />
                  <input name="fees" type="number" defaultValue={editDoctor.fees} placeholder="Fees" className={inputCls} />
                  <select name="status" defaultValue={editDoctor.status} className={inputCls}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" disabled={updateMut.isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                      {updateMut.isLoading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Doctor table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['Name','Specialization','Exp','Fees','Status','Actions'].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {doctorsLoading
                    ? <tr><td colSpan="6" className="text-center py-10 text-gray-400">Loading…</td></tr>
                    : filteredDoctors.length === 0
                    ? <tr><td colSpan="6" className="text-center py-10 text-gray-400">No doctors found</td></tr>
                    : filteredDoctors.map(d => (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-gray-600">{d.specialization}</td>
                        <td className="px-4 py-3 text-gray-500">{d.experience} yrs</td>
                        <td className="px-4 py-3">₹{d.fees}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(d)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                            {d.status === 'active'
                              ? <button onClick={() => toggleStatusMut.mutate({ id: d._id, status: 'inactive' })} className="text-orange-500 hover:bg-orange-50 p-1.5 rounded" title="Deactivate"><FiX className="w-4 h-4" /></button>
                              : <button onClick={() => toggleStatusMut.mutate({ id: d._id, status: 'active' })} className="text-green-600 hover:bg-green-50 p-1.5 rounded" title="Activate"><FiCheckCircle className="w-4 h-4" /></button>
                            }
                            <button onClick={() => { if (confirm('Delete this doctor?')) deleteMut.mutate(d._id) }} className="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEDICAL RECORDS ── */}
        {activeTab === 'medical' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b">
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Read-only access. All views are logged in the audit trail.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['File','Patient','Type','Size','Uploaded'].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {medicalData?.records?.length
                    ? medicalData.records.map(r => (
                      <tr key={r._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{r.filename}</td>
                        <td className="px-4 py-3">{r.userId?.firstName} {r.userId?.lastName}</td>
                        <td className="px-4 py-3 capitalize">{r.type}</td>
                        <td className="px-4 py-3">{r.size ? `${Math.round(r.size/1024)} KB` : '–'}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                    : <tr><td colSpan="5" className="text-center py-10 text-gray-400">No records found</td></tr>
                  }
                </tbody>
              </table>
            </div>
            {medicalData?.total > 20 && (
              <div className="p-4 text-sm text-gray-400 border-t">Showing 20 of {medicalData.total} records</div>
            )}
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold">All Appointments</h2>
              <button onClick={() => qc.invalidateQueries(['sa-appointments'])} className="text-gray-400 hover:text-gray-600"><FiRefreshCw className="w-4 h-4" /></button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Patient','Doctor','Date','Time','Status'].map(h =>
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments?.length
                  ? appointments.slice(0, 50).map(a => (
                    <tr key={a._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{a.userId?.firstName} {a.userId?.lastName}</td>
                      <td className="px-4 py-3">{a.doctorId?.name}</td>
                      <td className="px-4 py-3">{a.date}</td>
                      <td className="px-4 py-3">{a.time}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))
                  : <tr><td colSpan="5" className="text-center py-10 text-gray-400">No appointments</td></tr>
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ── USERS (read-only) ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="p-4 border-b">
              <p className="text-sm text-gray-500">Read-only view. User management is restricted to Protected Admin.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Name','Email','Mobile','Status','Joined'].map(h =>
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersData?.length
                  ? usersData.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500">{u.mobile || '–'}</td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                  : <tr><td colSpan="5" className="text-center py-10 text-gray-400">No users found</td></tr>
                }
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
