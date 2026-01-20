import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    total_organizations: 0,
    total_users: 0,
    active_organizations: 0,
    total_assets: 0,
    total_vulnerabilities: 0,
    total_scans: 0,
  })
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    
    try {
      // Fetch organizations
      const orgsRes = await axios.get('/api/auth/orgs/')
      const orgsData = orgsRes.data.results || orgsRes.data || []
      const activeOrgs = orgsData.filter((org) => org.status === 'active').length

      // Fetch users count
      let totalUsers = 0
      try {
        const usersRes = await axios.get('/api/auth/users/')
        const usersData = usersRes.data.results || usersRes.data || []
        totalUsers = usersData.length
      } catch (e) {
        // Users endpoint may not be accessible for super_admin
        console.log('Could not fetch users count')
      }

      // Fetch platform-wide stats
      let platformStats = {
        total_assets: 0,
        total_vulnerabilities: 0,
        total_scans: 0,
        running_scans: 0,
      }
      try {
        const statsRes = await axios.get('/api/assets/dashboard/stats/')
        platformStats = {
          total_assets: statsRes.data.total_assets || 0,
          total_vulnerabilities: statsRes.data.total_vulnerabilities || 0,
          total_scans: statsRes.data.total_scans || 0,
          running_scans: statsRes.data.running_scans || 0,
        }
      } catch (e) {
        console.log('Could not fetch platform stats')
      }

      setOrganizations(orgsData)
      setStats({
        total_organizations: orgsData.length,
        active_organizations: activeOrgs,
        total_users: totalUsers,
        ...platformStats,
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData(true)
  }, [fetchDashboardData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchDashboardData(false)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboardData])

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header with Refresh Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Platform-wide analytics and management
              {lastUpdated && (
                <span className="text-xs text-gray-400 ml-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-refresh (30s)</span>
            </label>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gradient-to-r from-blue-900 to-purple-600 text-white rounded-lg hover:from-blue-800 hover:to-purple-700 transition-all flex items-center space-x-2"
            >
              <i className="fas fa-sync-alt"></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards - Row 1: Organizations & Users */}
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

        {/* Statistics Cards - Row 2: Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Assets</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {stats.total_assets}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-network-wired text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Vulnerabilities</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
                  {stats.total_vulnerabilities}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-shield-alt text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Scans</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {stats.total_scans}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-search text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Running Scans</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  {stats.running_scans}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-spinner text-white text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Organizations</h2>
            <Link
              to="/organizations"
              className="px-6 py-3 bg-gradient-to-r from-blue-900 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-800 hover:to-purple-700 transition-all duration-200 flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Manage Organizations
            </Link>
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
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          Created: {new Date(org.created_at).toLocaleDateString()}
                        </span>
                        {org.admin_email && (
                          <span>
                            <i className="fas fa-envelope mr-1"></i>
                            {org.admin_email}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/organizations/${org.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              ))}
              {organizations.length > 5 && (
                <div className="text-center pt-4">
                  <Link
                    to="/organizations"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all {organizations.length} organizations <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-building text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No organizations found</h3>
              <p className="text-sm text-gray-600 mb-4">Create your first organization to get started</p>
              <Link
                to="/organizations"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Organization
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/organizations"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
            >
              <i className="fas fa-building text-blue-600 text-xl"></i>
              <span className="font-medium text-gray-900">Organizations</span>
            </Link>
            <Link
              to="/users"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all"
            >
              <i className="fas fa-users text-amber-600 text-xl"></i>
              <span className="font-medium text-gray-900">Users</span>
            </Link>
            <Link
              to="/assets"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all"
            >
              <i className="fas fa-network-wired text-green-600 text-xl"></i>
              <span className="font-medium text-gray-900">All Assets</span>
            </Link>
            <Link
              to="/scans"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all"
            >
              <i className="fas fa-search text-red-600 text-xl"></i>
              <span className="font-medium text-gray-900">All Scans</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SuperAdminDashboard
