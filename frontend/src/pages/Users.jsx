import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users/')
      const data = response.data.results || response.data || []
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    mfa_enabled: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const active = users.filter(u => u.is_active).length
    const inactive = users.filter(u => !u.is_active).length
    const mfa_enabled = users.filter(u => u.mfa_enabled).length
    
    setStats({
      total: users.length,
      active,
      inactive,
      mfa_enabled,
    })
  }, [users])

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 fade-in">
        {/* Header Section - Enterprise Grade */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#00C8FF] via-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent tracking-tight">
            Users
          </h1>
          <p className="text-gray-600 text-base md:text-lg font-medium">Manage organization users</p>
        </div>

        {/* Statistics Cards - Enterprise Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-blue-500/90 to-purple-600/90 rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20 border border-white/20 hover:shadow-3xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-blue-100 text-sm font-bold uppercase tracking-wide">Total Users</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.total}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-users text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-emerald-500/90 to-green-600/90 rounded-2xl p-6 text-white shadow-2xl shadow-emerald-500/20 border border-white/20 hover:shadow-3xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-emerald-100 text-sm font-bold uppercase tracking-wide">Active</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.active}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-check-circle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-red-500/90 to-rose-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-red-500/20 border border-white/20 hover:shadow-3xl hover:shadow-red-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-red-100 text-sm font-bold uppercase tracking-wide">Inactive</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.inactive}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-times-circle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-500/90 to-indigo-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-purple-500/20 border border-white/20 hover:shadow-3xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-purple-100 text-sm font-bold uppercase tracking-wide">MFA Enabled</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.mfa_enabled}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-shield-alt text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table - Modern Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#00C8FF] border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="px-6 md:px-8 py-5 border-b border-gray-200/50 bg-white/40 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-gray-900">
                  Users <span className="text-[#00C8FF]">({users.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto modern-scrollbar">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-white/60 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        MFA
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-200/30">
                    {users.map((user, index) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-white/80 transition-all duration-300 cursor-pointer fade-in group"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00C8FF] to-[#0066FF] flex items-center justify-center shadow-lg">
                              <i className="fas fa-user text-white"></i>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{user.email}</div>
                              <div className="text-xs text-gray-500">{user.username || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-400">
                            <i className="fas fa-user-tag mr-1.5"></i>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                            user.mfa_enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            <i className={`fas ${user.mfa_enabled ? 'fa-shield-alt' : 'fa-shield'} mr-1.5`}></i>
                            {user.mfa_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            <i className={`fas ${user.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-1.5`}></i>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-users text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Users

