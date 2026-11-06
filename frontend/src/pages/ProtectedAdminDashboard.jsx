import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore.js'
import api from '../services/api.js'
import toast from 'react-hot-toast'
import {
  FiUsers, FiUserPlus, FiTrash2, FiCheckCircle, FiXCircle,
  FiShield, FiActivity, FiCalendar, FiFileText, FiClipboard,
  FiSearch, FiRefreshCw
} from 'react-icons/fi'

const BASE = '/protected-admin'

const tabs = [
  { key: 'overview', label: 'Overview', icon: FiActivity },
  { key: 'users', label: 'Users', icon: FiUsers },
  { key: 'doctors', label: 'Doctors', icon: FiUserPlus },
  { key: 'super-admins', label: 'Super Admins', icon: FiShield },
  { key: 'medical', label: 'Medical Records', icon: FiFileText },
  { key: 'audit', label: 'Audit Logs', icon: FiClipboard },
]

const StatusBadge = ({ status }) => {
  const cls = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    blocked: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }[status] || 'bg-gray-100 text-gray-600'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}

export default function ProtectedAdminDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [showCreateDoctor, setShowCreateDoctor] = useState(false)
  const [showCreateSA, setShowCreateSA] = useState(false)
  const [doctorForm, setDoctorForm] = useState({ firstName: '', lastName: '', email: '', mobile: '', password: '', specialization: '', experience: '', fees: '' })
  const [saForm, setSaForm] = useState({ firstName: '', lastName: '', email: '', mobile: '', password: '' })

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: stats } = useQuery({ queryKey: ['pa-stats'], queryFn: () => api.get(`${BASE}/stats`).then(r => r.data), enabled: activeTab === 'overview' })
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ['pa-users', search], queryFn: () => api.get(`${BASE}/users?search=${search}&limit=30`).then(r => r.data), enabled: activeTab === 'users' })
  const { data: doctors, isLoading: doctorsLoading } = useQuery({ queryKey: ['pa-doctors'], queryFn: () => api.get(`${BASE}/doctors`).then(r => r.data), enabled: activeTab === 'doctors' })
  const { data: superAdmins, isLoading: saLoading } = useQuery({ queryKey: ['pa-super-admins'], queryFn: () => api.get(`${BASE}/super-admins`).then(r => r.data), enabled: activeTab === 'super-admins' })
  const { data: medicalData } = useQuery({ queryKey: ['pa-medical'], queryFn: () => api.get(`${BASE}/medical-records?limit=20`).then(r => r.data), enabled: activeTab === 'medical' })
  const { data: auditData } = useQuery({ queryKey: ['pa-audit'], queryFn: () => api.get(`${BASE}/audit-logs?limit=30`).then(r => r.data), enabled: activeTab === 'audit' })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const setStatusMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`${BASE}/users/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['pa-users']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
  const deleteUserMut = useMutation({
    mutationFn: id => api.delete(`${BASE}/users/${id}`),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries(['pa-users']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
  const createDoctorMut = useMutation({
    mutationFn: data => api.post(`${BASE}/doctors`, data),
    onSuccess: () => { toast.success('Doctor created'); setShowCreateDoctor(false); setDoctorForm({ firstName: '', lastName: '', email: '', mobile: '', password: '', specialization: '', experience: '', fees: '' }); qc.invalidateQueries(['pa-doctors']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
  const deleteDoctorMut = useMutation({
    mutationFn: id => api.delete(`${BASE}/doctors/${id}`),
    onSuccess: () => { toast.success('Doctor deleted'); qc.invalidateQueries(['pa-doctors']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
  const createSAMut = useMutation({
    mutationFn: data => api.post(`${BASE}/super-admins`, data),
    onSuccess: () => { toast.success('Super Admin created'); setShowCreateSA(false); setSaForm({ firstName: '', lastName: '', email: '', mobile: '', password: '' }); qc.invalidateQueries(['pa-super-admins']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })
  const deleteSAMut = useMutation({
    mutationFn: id => api.delete(`${BASE}/super-admins/${id}`),
    onSuccess: () => { toast.success('Super Admin deactivated'); qc.invalidateQueries(['pa-super-admins']) },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Protected Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {user?.firstName} {user?.lastName}</p>
        </div>

        {/* Tab nav */}
        <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 shadow-sm mb-8 border border-gray-100">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats?.totalUsers ?? '–', color: 'bg-blue-50 text-blue-700' },
                { label: 'Total Doctors', value: stats?.totalDoctors ?? '–', color: 'bg-green-50 text-green-700' },
                { label: 'Super Admins', value: stats?.totalSuperAdmins ?? '–', color: 'bg-purple-50 text-purple-700' },
                { label: 'Appointments', value: stats?.totalAppointments ?? '–', color: 'bg-orange-50 text-orange-700' },
                { label: 'Medical Records', value: stats?.totalRecords ?? '–', color: 'bg-red-50 text-red-700' },
                { label: 'Active Accounts', value: stats?.activeAccounts ?? '–', color: 'bg-teal-50 text-teal-700' },
                { label: 'Inactive/Blocked', value: stats?.inactiveAccounts ?? '–', color: 'bg-gray-50 text-gray-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs mt-1 opacity-75">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4">Recent Activity</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {stats?.recentActivity?.map(log => (
                  <div key={log._id} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-gray-400">{log.actorId?.email}</span>
                    <span className="text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                )) ?? <p className="text-gray-400 text-sm">No activity yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>{['Name','Email','Role','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {usersLoading ? <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading…</td></tr>
                    : usersData?.users?.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{u.role}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {u.status === 'active'
                            ? <button onClick={() => setStatusMut.mutate({ id: u._id, status: 'blocked' })} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Block"><FiXCircle /></button>
                            : <button onClick={() => setStatusMut.mutate({ id: u._id, status: 'active' })} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Activate"><FiCheckCircle /></button>}
                          <button onClick={() => { if (confirm('Deactivate user?')) deleteUserMut.mutate(u._id) }} className="text-gray-400 hover:bg-gray-100 p-1 rounded" title="Delete"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DOCTORS ── */}
        {activeTab === 'doctors' && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Doctor Management</h2>
              <button onClick={() => setShowCreateDoctor(!showCreateDoctor)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                <FiUserPlus className="w-4 h-4" />{showCreateDoctor ? 'Cancel' : 'Add Doctor'}
              </button>
            </div>
            {showCreateDoctor && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="font-bold mb-4">Create Doctor Account</h3>
                <form onSubmit={e => { e.preventDefault(); createDoctorMut.mutate(doctorForm) }} className="grid grid-cols-2 gap-4">
                  <input placeholder="First Name *" required className={inputCls} value={doctorForm.firstName} onChange={e => setDoctorForm({...doctorForm, firstName: e.target.value})} />
                  <input placeholder="Last Name *" required className={inputCls} value={doctorForm.lastName} onChange={e => setDoctorForm({...doctorForm, lastName: e.target.value})} />
                  <input type="email" placeholder="Email *" required className={inputCls} value={doctorForm.email} onChange={e => setDoctorForm({...doctorForm, email: e.target.value})} />
                  <input placeholder="Mobile" className={inputCls} value={doctorForm.mobile} onChange={e => setDoctorForm({...doctorForm, mobile: e.target.value})} />
                  <input type="password" placeholder="Password (min 8 chars) *" required className={inputCls} value={doctorForm.password} onChange={e => setDoctorForm({...doctorForm, password: e.target.value})} />
                  <input placeholder="Specialization *" required className={inputCls} value={doctorForm.specialization} onChange={e => setDoctorForm({...doctorForm, specialization: e.target.value})} />
                  <input type="number" placeholder="Experience (years)" className={inputCls} value={doctorForm.experience} onChange={e => setDoctorForm({...doctorForm, experience: e.target.value})} />
                  <input type="number" placeholder="Fees" className={inputCls} value={doctorForm.fees} onChange={e => setDoctorForm({...doctorForm, fees: e.target.value})} />
                  <div className="col-span-2">
                    <button type="submit" disabled={createDoctorMut.isLoading} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                      {createDoctorMut.isLoading ? 'Creating…' : 'Create Doctor'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>{['Name','Specialization','Experience','Fees','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {doctorsLoading ? <tr><td colSpan="6" className="text-center py-8 text-gray-400">Loading…</td></tr>
                    : doctors?.map(d => (
                    <tr key={d._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3">{d.specialization}</td>
                      <td className="px-4 py-3">{d.experience} yrs</td>
                      <td className="px-4 py-3">₹{d.fees}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => { if (confirm('Delete doctor?')) deleteDoctorMut.mutate(d._id) }} className="text-red-500 hover:bg-red-50 p-1 rounded"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUPER ADMINS ── */}
        {activeTab === 'super-admins' && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Super Admin Management</h2>
              <button onClick={() => setShowCreateSA(!showCreateSA)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                <FiUserPlus className="w-4 h-4" />{showCreateSA ? 'Cancel' : 'Add Super Admin'}
              </button>
            </div>
            {showCreateSA && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="font-bold mb-4">Create Super Admin</h3>
                <form onSubmit={e => { e.preventDefault(); createSAMut.mutate(saForm) }} className="grid grid-cols-2 gap-4">
                  <input placeholder="First Name *" required className={inputCls} value={saForm.firstName} onChange={e => setSaForm({...saForm, firstName: e.target.value})} />
                  <input placeholder="Last Name *" required className={inputCls} value={saForm.lastName} onChange={e => setSaForm({...saForm, lastName: e.target.value})} />
                  <input type="email" placeholder="Email *" required className={inputCls} value={saForm.email} onChange={e => setSaForm({...saForm, email: e.target.value})} />
                  <input placeholder="Mobile" className={inputCls} value={saForm.mobile} onChange={e => setSaForm({...saForm, mobile: e.target.value})} />
                  <input type="password" placeholder="Password (min 8 chars) *" required className={inputCls} value={saForm.password} onChange={e => setSaForm({...saForm, password: e.target.value})} />
                  <div className="col-span-2">
                    <button type="submit" disabled={createSAMut.isLoading} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                      {createSAMut.isLoading ? 'Creating…' : 'Create Super Admin'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>{['Name','Email','Status','Created','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {saLoading ? <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading…</td></tr>
                    : superAdmins?.length === 0 ? <tr><td colSpan="5" className="text-center py-8 text-gray-400">No Super Admins yet</td></tr>
                    : superAdmins?.map(sa => (
                    <tr key={sa._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{sa.firstName} {sa.lastName}</td>
                      <td className="px-4 py-3 text-gray-500">{sa.email}</td>
                      <td className="px-4 py-3"><StatusBadge status={sa.status} /></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(sa.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { if (confirm('Deactivate Super Admin?')) deleteSAMut.mutate(sa._id) }} className="text-red-500 hover:bg-red-50 p-1 rounded"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEDICAL RECORDS ── */}
        {activeTab === 'medical' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b"><h2 className="font-bold">Medical Records (Read-only — all accesses are logged)</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>{['File','Patient','Type','Size','Uploaded'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {medicalData?.records?.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.filename}</td>
                      <td className="px-4 py-3">{r.userId?.firstName} {r.userId?.lastName}</td>
                      <td className="px-4 py-3">{r.type}</td>
                      <td className="px-4 py-3">{r.size ? `${Math.round(r.size/1024)} KB` : '–'}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )) ?? <tr><td colSpan="5" className="text-center py-8 text-gray-400">No records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AUDIT LOGS ── */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold">Audit Logs</h2>
              <button onClick={() => qc.invalidateQueries(['pa-audit'])} className="text-gray-400 hover:text-gray-600"><FiRefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>{['Action','Actor','Role','Target','Time'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {auditData?.logs?.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{l.action}</span></td>
                      <td className="px-4 py-3">{l.actorId?.email || '–'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{l.actorRole}</span></td>
                      <td className="px-4 py-3 text-gray-500">{l.targetType || '–'}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  )) ?? <tr><td colSpan="5" className="text-center py-8 text-gray-400">No logs</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
