import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_assets: 0,
    total_vulnerabilities: 0,
    critical_vulnerabilities: 0,
    high_risk_assets: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Use optimized dashboard stats endpoint (single API call with database aggregations)
      const statsRes = await axios.get('/api/assets/dashboard/stats/')
      const data = statsRes.data

      setStats({
        total_assets: data.total_assets || 0,
        total_vulnerabilities: data.total_vulnerabilities || 0,
        critical_vulnerabilities: data.critical_vulnerabilities || 0,
        high_risk_assets: data.high_risk_assets || 0,
      })
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your external threat surface</p>
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

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/assets"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
            >
              <i className="fas fa-network-wired text-blue-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Assets</span>
            </a>
            <a
              href="/vulnerabilities"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all"
            >
              <i className="fas fa-shield-alt text-amber-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Vulnerabilities</span>
            </a>
            <a
              href="/risks"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all"
            >
              <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Top Risks</span>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard

