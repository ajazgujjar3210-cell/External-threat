import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import VulnerabilityTrendChart from '../../components/charts/VulnerabilityTrendChart'
import AssetDiscoveryChart from '../../components/charts/AssetDiscoveryChart'
import TopVulnerabilitiesChart from '../../components/charts/TopVulnerabilitiesChart'
import ExposureMetricsChart from '../../components/charts/ExposureMetricsChart'

const OrgDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_assets: 0,
    total_vulnerabilities: 0,
    critical_vulnerabilities: 0,
    high_risk_assets: 0,
    unknown_assets: 0,
    known_assets: 0,
    exposed_assets: 0,
    active_assets: 0,
  })
  const [assets, setAssets] = useState([])
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [risks, setRisks] = useState([])
  const [recentChanges, setRecentChanges] = useState([])
  const [recentScans, setRecentScans] = useState([])
  const [vulnerabilityTrends, setVulnerabilityTrends] = useState({})
  const [assetDiscoveryTrends, setAssetDiscoveryTrends] = useState({})
  const [topVulnerabilities, setTopVulnerabilities] = useState([])
  const [exposureMetrics, setExposureMetrics] = useState({})
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const response = await axios.get('/api/assets/dashboard/stats/')
      const data = response.data

      setStats({
        total_assets: data.total_assets || 0,
        total_vulnerabilities: data.total_vulnerabilities || 0,
        critical_vulnerabilities: data.critical_vulnerabilities || 0,
        high_vulnerabilities: data.high_vulnerabilities || 0,
        medium_vulnerabilities: data.medium_vulnerabilities || 0,
        low_vulnerabilities: data.low_vulnerabilities || 0,
        high_risk_assets: data.high_risk_assets || 0,
        unknown_assets: data.unknown_assets || 0,
        known_assets: data.known_assets || 0,
        exposed_assets: data.exposed_assets || 0,
        active_assets: data.active_assets || 0,
      })

      // Process assets by type for chart
      if (data.assets_by_type) {
        const assetsList = Object.entries(data.assets_by_type).map(([type, count]) => ({
          asset_type: type,
          count: count
        }))
        setAssets(assetsList)
      }

      // Process vulnerabilities by severity
      if (data.vulnerabilities_by_severity) {
        const vulnsList = Object.entries(data.vulnerabilities_by_severity).map(([severity, count]) => ({
          severity,
          count
        }))
        setVulnerabilities(vulnsList)
      }

      // Risk distribution
      setRisks([
        { level: 'high', count: data.high_risk_assets || 0 },
        { level: 'medium', count: data.medium_risk_assets || 0 },
        { level: 'low', count: data.low_risk_assets || 0 },
      ])

      setRecentChanges(data.recent_changes || [])
      setRecentScans(data.recent_scans || [])
      setVulnerabilityTrends(data.vulnerability_trends || {})
      setAssetDiscoveryTrends(data.asset_discovery_trends || {})
      setTopVulnerabilities(data.top_vulnerabilities || [])
      setExposureMetrics({
        exposed_assets: data.exposed_assets || 0,
        known_assets: data.known_assets || 0,
        unknown_assets: data.unknown_assets || 0,
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => fetchDashboardData(true), 30000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboardData])

  const StatCard = ({ title, value, icon, iconBg, trend, trendUp, subtitle, delay = 0 }) => (
    <div 
      className="stat-card group animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span>
              ) : (
                value?.toLocaleString()
              )}
            </p>
            {trend && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                <i className={`fa-solid fa-arrow-${trendUp ? 'up' : 'down'} text-[10px]`}></i>
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
          <i className={`fa-solid ${icon} text-white text-lg`}></i>
        </div>
      </div>
    </div>
  )

  const ScanStatusBadge = ({ status }) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: 'fa-check-circle' },
      running: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: 'fa-spinner animate-spin' },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: 'fa-times-circle' },
      pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: 'fa-clock' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <i className={`fa-solid ${config.icon}`}></i>
        <span className="capitalize">{status}</span>
      </span>
    )
  }

  const ChangeTypeBadge = ({ type }) => {
    const typeConfig = {
      new: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: 'fa-plus' },
      removed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: 'fa-minus' },
      modified: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: 'fa-pen' },
    }
    const config = typeConfig[type] || typeConfig.new
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${config.bg} ${config.text}`}>
        <i className={`fa-solid ${config.icon} text-[10px]`}></i>
        <span className="capitalize">{type}</span>
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Security posture overview</span>
            {lastUpdated && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary-500 transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span>Auto-refresh</span>
          </label>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <i className={`fa-solid fa-arrows-rotate ${refreshing ? 'animate-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          <Link to="/org/asset-discovery" className="btn btn-primary">
            <i className="fa-solid fa-satellite-dish"></i>
            <span>Run Discovery</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Assets"
          value={stats.total_assets}
          icon="fa-server"
          iconBg="bg-gradient-to-br from-primary-500 to-primary-600"
          subtitle={`${stats.active_assets} active`}
          delay={0}
        />
        <StatCard
          title="Vulnerabilities"
          value={stats.total_vulnerabilities}
          icon="fa-bug"
          iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
          subtitle={`${stats.critical_vulnerabilities} critical`}
          delay={50}
        />
        <StatCard
          title="Critical Issues"
          value={stats.critical_vulnerabilities}
          icon="fa-triangle-exclamation"
          iconBg="bg-gradient-to-br from-red-500 to-rose-600"
          delay={100}
        />
        <StatCard
          title="High Risk"
          value={stats.high_risk_assets}
          icon="fa-chart-line-up"
          iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
          delay={150}
        />
        <StatCard
          title="Unknown Assets"
          value={stats.unknown_assets}
          icon="fa-circle-question"
          iconBg="bg-gradient-to-br from-slate-500 to-slate-600"
          subtitle={`${stats.known_assets} known`}
          delay={200}
        />
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Risk Distribution</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Asset risk levels</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center">
              <i className="fa-solid fa-chart-pie text-red-500"></i>
            </div>
          </div>
          <div className="h-64">
            <RiskDistributionChart risks={risks} />
          </div>
        </div>

        {/* Exposure Metrics */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Exposure Metrics</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Asset exposure status</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center">
              <i className="fa-solid fa-shield-halved text-cyan-500"></i>
            </div>
          </div>
          <div className="h-64">
            <ExposureMetricsChart assets={[
              { status: 'exposed', count: exposureMetrics.exposed_assets || 0 },
              { status: 'known', count: exposureMetrics.known_assets || 0 },
              { status: 'unknown', count: exposureMetrics.unknown_assets || 0 },
            ]} />
          </div>
        </div>

        {/* Assets by Type */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assets by Type</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Distribution overview</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
              <i className="fa-solid fa-chart-bar text-purple-500"></i>
            </div>
          </div>
          <div className="h-64">
            <AssetDiscoveryChart assets={assets} />
          </div>
        </div>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Vulnerability Trends */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Vulnerability Trends</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Last 30 days</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-amber-500"></i>
            </div>
          </div>
          <div className="h-72">
            <VulnerabilityTrendChart vulnerabilities={vulnerabilities} trends={vulnerabilityTrends} />
          </div>
        </div>

        {/* Top Vulnerabilities */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top Vulnerabilities</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">By CVSS score</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 flex items-center justify-center">
              <i className="fa-solid fa-ranking-star text-red-500"></i>
            </div>
          </div>
          <div className="h-72">
            <TopVulnerabilitiesChart vulnerabilities={topVulnerabilities} />
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Scans</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest discovery activities</p>
            </div>
            <Link 
              to="/org/security-scans" 
              className="text-sm font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1 group"
            >
              View all
              <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : recentScans.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-satellite-dish text-2xl text-slate-400"></i>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No scans yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Run your first discovery scan</p>
                <Link to="/org/asset-discovery" className="btn btn-primary mt-4">
                  <i className="fa-solid fa-play"></i>
                  Start Discovery
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {recentScans.slice(0, 5).map((scan, index) => {
                    const duration = scan.finished_at && scan.started_at
                      ? Math.round((new Date(scan.finished_at) - new Date(scan.started_at)) / 1000)
                      : null
                    return (
                      <tr key={scan.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <i className="fa-solid fa-satellite-dish text-primary-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                              {scan.scan_type || 'Discovery'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <ScanStatusBadge status={scan.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(scan.started_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {duration ? `${duration}s` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Changes */}
        <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '550ms' }}>
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Changes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Asset modifications</p>
            </div>
            <Link 
              to="/org/assets/changes" 
              className="text-sm font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1 group"
            >
              View all
              <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
            </Link>
          </div>
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : recentChanges.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-clock text-2xl text-slate-400"></i>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No changes recorded</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Changes will appear here after scans</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentChanges.slice(0, 10).map((change, index) => (
                  <div key={change.id || index} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          change.change_type === 'new' ? 'bg-green-100 dark:bg-green-900/30' :
                          change.change_type === 'removed' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <i className={`fa-solid ${
                            change.change_type === 'new' ? 'fa-plus text-green-500' :
                            change.change_type === 'removed' ? 'fa-minus text-red-500' :
                            'fa-pen text-blue-500'
                          } text-sm`}></i>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ChangeTypeBadge type={change.change_type} />
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {change.asset?.name || change.asset?.value || 'Unknown Asset'}
                            </span>
                          </div>
                          {change.details && typeof change.details === 'string' && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                              {change.details}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                        {new Date(change.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'fa-server', label: 'View Assets', path: '/org/assets/inventory', color: 'from-blue-500 to-cyan-500' },
            { icon: 'fa-bug', label: 'Vulnerabilities', path: '/org/vulnerabilities/all', color: 'from-amber-500 to-orange-500' },
            { icon: 'fa-chart-line', label: 'Risk Analysis', path: '/org/risk/prioritization', color: 'from-purple-500 to-pink-500' },
            { icon: 'fa-file-lines', label: 'Generate Report', path: '/org/reports/generate', color: 'from-green-500 to-emerald-500' },
          ].map((action, index) => (
            <Link
              key={action.path}
              to={action.path}
              className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-transparent hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${650 + index * 50}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${action.icon} text-white text-lg`}></i>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                {action.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OrgDashboard
