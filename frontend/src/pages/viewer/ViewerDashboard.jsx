import { useState, useEffect } from 'react'
// Layout is now handled by ProtectedRoute
import axios from 'axios'
import { Link } from 'react-router-dom'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import VulnerabilityTrendChart from '../../components/charts/VulnerabilityTrendChart'
import AssetDiscoveryChart from '../../components/charts/AssetDiscoveryChart'
import ExposureMetricsChart from '../../components/charts/ExposureMetricsChart'

const ViewerDashboard = () => {
  const [stats, setStats] = useState({
    total_assets: 0,
    total_vulnerabilities: 0,
    critical_vulnerabilities: 0,
    high_risk_assets: 0,
  })
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState([])
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [risks, setRisks] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Use optimized dashboard stats endpoint (single API call with database aggregations)
      const statsRes = await axios.get('/api/assets/dashboard/stats/')
      const statsData = statsRes.data

      // Set statistics from optimized endpoint
      setStats({
        total_assets: statsData.total_assets || 0,
        total_vulnerabilities: statsData.total_vulnerabilities || 0,
        critical_vulnerabilities: statsData.critical_vulnerabilities || 0,
        high_risk_assets: statsData.high_risk_assets || 0,
      })

      // Fetch chart data in parallel (only what's needed for charts)
      const [assetsRes, vulnsRes, risksRes] = await Promise.all([
        // Fetch limited assets for charts (only first page)
        axios.get('/api/assets/?page_size=100'),
        // Fetch limited vulnerabilities for charts (only first page)
        axios.get('/api/vulnerabilities/?page_size=100'),
        // Fetch top risks for charts
        axios.get('/api/risks/top/?limit=50'),
      ])

      // Extract data from responses
      const assetsData = assetsRes.data.results || assetsRes.data || []
      const vulnsData = vulnsRes.data.results || vulnsRes.data || []
      const risksData = risksRes.data || []

      // Store data for charts (limited data, not all records)
      setAssets(Array.isArray(assetsData) ? assetsData : [])
      setVulnerabilities(Array.isArray(vulnsData) ? vulnsData : [])
      setRisks(Array.isArray(risksData) ? risksData : [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set empty data on error
      setStats({
        total_assets: 0,
        total_vulnerabilities: 0,
        critical_vulnerabilities: 0,
        high_risk_assets: 0,
      })
      setAssets([])
      setVulnerabilities([])
      setRisks([])
    } finally {
      setLoading(false)
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Read-only view of security posture</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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

        {/* Charts Section - Rapid7 Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Risk Distribution</h2>
              <i className="fas fa-chart-pie text-gray-400"></i>
            </div>
            {risks.length > 0 ? (
              <RiskDistributionChart risks={risks} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No risk data available</p>
              </div>
            )}
          </div>

          {/* Exposure Metrics Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Exposure Metrics</h2>
              <i className="fas fa-shield-alt text-gray-400"></i>
            </div>
            {assets.length > 0 ? (
              <ExposureMetricsChart assets={assets} vulnerabilities={vulnerabilities} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No asset data available</p>
              </div>
            )}
          </div>

          {/* Vulnerability Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Vulnerability Trends (Last 7 Days)</h2>
              <i className="fas fa-chart-line text-gray-400"></i>
            </div>
            {vulnerabilities.length > 0 ? (
              <VulnerabilityTrendChart vulnerabilities={vulnerabilities} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <p>No vulnerability data available</p>
              </div>
            )}
          </div>

          {/* Asset Discovery Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Assets by Type</h2>
              <i className="fas fa-network-wired text-gray-400"></i>
            </div>
            {assets.length > 0 ? (
              <AssetDiscoveryChart assets={assets} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No asset data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (Read-Only) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">View Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/viewer/assets/inventory"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
            >
              <i className="fas fa-network-wired text-blue-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Assets</span>
            </Link>
            <Link
              to="/viewer/risk/summary"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all"
            >
              <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              <span className="font-medium text-gray-900">Risk Summary</span>
            </Link>
            <Link
              to="/viewer/reports/generate"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all"
            >
              <i className="fas fa-file-alt text-green-600 text-xl"></i>
              <span className="font-medium text-gray-900">Generate Report</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default ViewerDashboard

