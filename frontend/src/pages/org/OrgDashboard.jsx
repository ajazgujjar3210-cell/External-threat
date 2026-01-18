import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { Link } from 'react-router-dom'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import VulnerabilityTrendChart from '../../components/charts/VulnerabilityTrendChart'
import AssetDiscoveryChart from '../../components/charts/AssetDiscoveryChart'
import TopVulnerabilitiesChart from '../../components/charts/TopVulnerabilitiesChart'
import ExposureMetricsChart from '../../components/charts/ExposureMetricsChart'

const OrgDashboard = () => {
  const [stats, setStats] = useState({
    total_assets: 0,
    total_vulnerabilities: 0,
    critical_vulnerabilities: 0,
    high_risk_assets: 0,
    unknown_assets: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentChanges, setRecentChanges] = useState([])
  const [assets, setAssets] = useState([])
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [risks, setRisks] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch assets
      const assetsRes = await axios.get('/api/assets/')
      const assetsData = assetsRes.data.results || assetsRes.data || []
      const assetsCount = assetsData.length
      const unknownCount = assetsData.filter(a => a.is_unknown).length

      // Fetch vulnerabilities
      const vulnsRes = await axios.get('/api/vulnerabilities/')
      const vulnsData = vulnsRes.data.results || vulnsRes.data || []
      const vulnsCount = vulnsData.length
      const criticalCount = vulnsData.filter(v => v.severity === 'critical').length

      // Fetch top risks
      const risksRes = await axios.get('/api/risks/top/?limit=50')
      const risksData = risksRes.data || []
      const highRiskCount = risksData.filter(r => parseFloat(r.score) >= 80).length

      // Store full data for charts
      setAssets(assetsData)
      setVulnerabilities(vulnsData)
      setRisks(risksData)

      // Fetch recent changes
      const changesRes = await axios.get('/api/assets/changes/?limit=5')
      const changes = changesRes.data || []

      setStats({
        total_assets: assetsCount,
        total_vulnerabilities: vulnsCount,
        critical_vulnerabilities: criticalCount,
        high_risk_assets: highRiskCount,
        unknown_assets: unknownCount,
      })
      setRecentChanges(changes)
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
          <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
          <p className="text-gray-600 mt-1">Security posture summary</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
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

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
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

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
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

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">High Risk</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {stats.high_risk_assets}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Unknown Assets</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {stats.unknown_assets}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg flex items-center justify-center">
                <i className="fas fa-question-circle text-white text-2xl"></i>
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

          {/* Top Vulnerabilities Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Top 10 Vulnerabilities</h2>
              <i className="fas fa-exclamation-triangle text-gray-400"></i>
            </div>
            {vulnerabilities.length > 0 ? (
              <TopVulnerabilitiesChart vulnerabilities={vulnerabilities} />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <p>No vulnerability data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/org/assets/inventory"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
            >
              <i className="fas fa-network-wired text-blue-600 text-xl"></i>
              <span className="font-medium text-gray-900">View Assets</span>
            </Link>
            <Link
              to="/org/vulnerabilities/all"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all"
            >
              <i className="fas fa-shield-alt text-amber-600 text-xl"></i>
              <span className="font-medium text-gray-900">Vulnerabilities</span>
            </Link>
            <Link
              to="/org/risk/prioritization"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all"
            >
              <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              <span className="font-medium text-gray-900">Top Risks</span>
            </Link>
            <Link
              to="/org/reports/generate"
              className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all"
            >
              <i className="fas fa-file-alt text-green-600 text-xl"></i>
              <span className="font-medium text-gray-900">Generate Report</span>
            </Link>
          </div>
        </div>

        {/* Recent Changes */}
        {recentChanges.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Changes</h2>
            <div className="space-y-3">
              {recentChanges.map((change) => (
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
      </div>
    </Layout>
  )
}

export default OrgDashboard

