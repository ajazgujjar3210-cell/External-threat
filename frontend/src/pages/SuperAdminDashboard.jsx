import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    total_organizations: 0,
    total_users: 0,
    active_organizations: 0,
  })
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const orgsRes = await axios.get('/api/auth/orgs/')
      const orgsData = orgsRes.data.results || orgsRes.data || []
      const activeOrgs = orgsData.filter((org) => org.status === 'active').length

      setOrganizations(orgsData)
      setStats({
        total_organizations: orgsData.length,
        active_organizations: activeOrgs,
        total_users: 0, // Would need separate endpoint
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform-wide analytics and management</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Organizations</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent">
                  {stats.total_organizations}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-900 to-purple-600 shadow-lg flex items-center justify-center">
                <i className="fas fa-building text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Active Organizations</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {stats.active_organizations}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  {stats.total_users}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-users text-white text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Organizations</h2>
            <a
              href="/organizations"
              className="px-6 py-3 bg-gradient-to-r from-blue-900 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-800 hover:to-purple-700 transition-all duration-200 flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Manage Organizations
            </a>
          </div>

          {organizations.length > 0 ? (
            <div className="space-y-4">
              {organizations.slice(0, 5).map((org) => (
                <div
                  key={org.id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{org.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            org.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {org.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(org.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-building text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No organizations found</h3>
              <p className="text-sm text-gray-600 mb-4">Create your first organization to get started</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SuperAdminDashboard

