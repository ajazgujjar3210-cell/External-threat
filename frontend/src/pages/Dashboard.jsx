import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_assets: 0,
    total_vulnerabilities: 0,
    critical_vulnerabilities: 0,
    high_risk_assets: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentChanges, setRecentChanges] = useState([])
  const [recentScans, setRecentScans] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    
    try {
      // Use optimized dashboard stats endpoint (single API call with database aggregations)
      const statsRes = await axios.get('/api/assets/dashboard/stats/')
      const data = statsRes.data

      setStats({
        total_assets: data.total_assets || 0,
        total_vulnerabilities: data.total_vulnerabilities || 0,
        critical_vulnerabilities: data.critical_vulnerabilities || 0,
        high_risk_assets: data.high_risk_assets || 0,
        unknown_assets: data.unknown_assets || 0,
        exposed_assets: data.exposed_assets || 0,
        running_scans: data.running_scans || 0,
      })
      
      setRecentChanges(data.recent_changes || [])
      setRecentScans(data.recent_scans || [])
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to empty stats on error
      setStats({
        total_assets: 0,
        total_vulnerabilities: 0,
        critical_vulnerabilities: 0,
        high_risk_assets: 0,
      })
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header with Refresh Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of your external threat surface
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
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
            >
              <i className="fas fa-sync-alt"></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Assets</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stats.total_assets}
                </p>
                {stats.unknown_assets > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {stats.unknown_assets} unknown
                  </p>
                )}
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg flex items-center justify-center">
                <i className="fas fa-network-wired text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Vulnerabilities</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  {stats.total_vulnerabilities}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-shield-alt text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Critical Issues</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
                  {stats.critical_vulnerabilities}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">High Risk Assets</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {stats.high_risk_assets}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Scans</h2>
              <Link to="/scans" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            <div className="space-y-3">
              {recentScans.slice(0, 3).map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${
                      scan.status === 'completed' ? 'bg-green-500' :
                      scan.status === 'running' ? 'bg-blue-500 animate-pulse' :
                      scan.status === 'failed' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}></span>
                    <span className="font-medium text-gray-900 capitalize">{scan.scan_type} Scan</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      scan.status === 'completed' ? 'bg-green-100 text-green-700' :
                      scan.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      scan.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {scan.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {scan.started_at ? new Date(scan.started_at).toLocaleString() : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Changes */}
        {recentChanges.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Asset Changes</h2>
              <Link to="/changelog" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            <div className="space-y-3">
              {recentChanges.slice(0, 5).map((change) => (
                <div key={change.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      change.change_type === 'new' ? 'bg-green-100 text-green-700' :
                      change.change_type === 'removed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {change.change_type}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{change.asset_name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(change.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/assets"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
            >
              <i className="fas fa-network-wired text-blue-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Assets</span>
            </Link>
            <Link
              to="/vulnerabilities"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all"
            >
              <i className="fas fa-shield-alt text-amber-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Vulnerabilities</span>
            </Link>
            <Link
              to="/risks"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all"
            >
              <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Top Risks</span>
            </Link>
            <Link
              to="/asset-discovery"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all"
            >
              <i className="fas fa-search text-green-600 text-xl"></i>
              <span className="font-medium text-gray-900">Run Discovery</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
