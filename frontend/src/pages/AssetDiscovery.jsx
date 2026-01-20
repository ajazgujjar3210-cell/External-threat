import React, { useState, useEffect } from 'react'
import axios from 'axios'

const AssetDiscovery = () => {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false)
  const [discoveryForm, setDiscoveryForm] = useState({ 
    domain: '',
    enable_port_scan: false,
    enable_service_detection: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [expandedScan, setExpandedScan] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [stopConfirm, setStopConfirm] = useState(null)
  const [stopping, setStopping] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    pending: 0,
    failed: 0,
    stopped: 0,
    totalAssets: 0,
  })

  useEffect(() => {
    fetchScans()
    const interval = setInterval(fetchScans, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchScans = async () => {
    try {
      const response = await axios.get('/api/scans/?scan_type=discovery')
      const data = response.data.results || response.data || []
      const discoveryScans = data.filter(scan => scan.scan_type === 'discovery')
      setScans(discoveryScans)
      
      const totalAssets = discoveryScans.reduce((sum, scan) => 
        sum + (scan.results?.assets_discovered || 0), 0
      )
      setStats({
        total: discoveryScans.length,
        completed: discoveryScans.filter(s => s.status === 'completed').length,
        running: discoveryScans.filter(s => s.status === 'running').length,
        pending: discoveryScans.filter(s => s.status === 'pending').length,
        failed: discoveryScans.filter(s => s.status === 'failed').length,
        stopped: discoveryScans.filter(s => s.status === 'stopped').length,
        totalAssets: totalAssets,
      })
    } catch (error) {
      console.error('Error fetching scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDiscoveryScan = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.post('/api/assets/discover/', { 
        domain: discoveryForm.domain,
        enable_port_scan: discoveryForm.enable_port_scan,
        enable_service_detection: discoveryForm.enable_service_detection
      })
      setShowDiscoveryModal(false)
      setDiscoveryForm({ domain: '', enable_port_scan: false, enable_service_detection: false })
      fetchScans()
    } catch (error) {
      console.error('Discovery scan error:', error)
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to start discovery scan'
      alert(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteScan = async (scanId) => {
    setDeleting(true)
    try {
      await axios.delete(`/api/scans/${scanId}/`)
      setDeleteConfirm(null)
      fetchScans()
    } catch (error) {
      console.error('Delete scan error:', error)
      alert(error.response?.data?.error || 'Failed to delete scan')
    } finally {
      setDeleting(false)
    }
  }

  const handleStopScan = async (scanId) => {
    setStopping(true)
    try {
      await axios.post(`/api/scans/${scanId}/stop/`)
      setStopConfirm(null)
      fetchScans()
    } catch (error) {
      console.error('Stop scan error:', error)
      alert(error.response?.data?.error || 'Failed to stop scan')
    } finally {
      setStopping(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        icon: 'fa-clock',
        gradient: 'from-amber-500 to-orange-500'
      },
      running: { 
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: 'fa-spinner animate-spin',
        gradient: 'from-blue-500 to-cyan-500'
      },
      completed: { 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
        icon: 'fa-circle-check',
        gradient: 'from-green-500 to-emerald-500'
      },
      failed: { 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        icon: 'fa-circle-xmark',
        gradient: 'from-red-500 to-rose-500'
      },
      stopped: { 
        color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        icon: 'fa-circle-stop',
        gradient: 'from-slate-500 to-slate-600'
      },
    }
    return configs[status] || configs.pending
  }

  const formatDuration = (duration) => {
    if (!duration) return '-'
    if (typeof duration === 'string') return duration
    return `${duration}s`
  }

  const StatCard = ({ title, value, icon, gradient, delay = 0 }) => (
    <div 
      className="stat-card group animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {loading ? (
              <span className="inline-block w-12 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span>
            ) : (
              value?.toLocaleString()
            )}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
          <i className={`fa-solid ${icon} text-white text-lg`}></i>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Asset Discovery
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Discover external assets using safe, passive scanning methods
          </p>
        </div>
        <button
          onClick={() => setShowDiscoveryModal(true)}
          className="btn btn-primary btn-lg"
        >
          <i className="fa-solid fa-satellite-dish"></i>
          <span>Run Discovery Scan</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Scans"
          value={stats.total}
          icon="fa-list"
          gradient="from-primary-500 to-primary-600"
          delay={0}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon="fa-circle-check"
          gradient="from-green-500 to-emerald-600"
          delay={50}
        />
        <StatCard
          title="Running"
          value={stats.running}
          icon="fa-spinner"
          gradient="from-blue-500 to-cyan-600"
          delay={100}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon="fa-clock"
          gradient="from-amber-500 to-orange-600"
          delay={150}
        />
        <StatCard
          title="Assets Found"
          value={stats.totalAssets}
          icon="fa-server"
          gradient="from-purple-500 to-violet-600"
          delay={200}
        />
      </div>

      {/* Info Banner */}
      {stats.pending > 0 && (
        <div className="card p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400"></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {stats.pending} scan(s) pending
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Make sure Celery worker is running for scans to execute
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scans Table */}
      <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-satellite-dish text-white text-xl"></i>
              </div>
            </div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Loading discovery scans...</p>
          </div>
        ) : scans.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Discovery Scans
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {scans.length} total scans
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchScans}
                  className="btn btn-ghost btn-sm"
                >
                  <i className="fa-solid fa-rotate"></i>
                  <span>Refresh</span>
                </button>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Auto-refresh: 5s
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Assets
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {scans.map((scan, index) => {
                    const statusConfig = getStatusConfig(scan.status)
                    return (
                      <React.Fragment key={scan.id}>
                        <tr 
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          style={{ animationDelay: `${350 + index * 30}ms` }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center`}>
                                <i className="fa-solid fa-globe text-white"></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                  {scan.config?.domain || 'N/A'}
                                </p>
                                {scan.error_message && (
                                  <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]">
                                    {scan.error_message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusConfig.color}`}>
                              <i className={`fa-solid ${statusConfig.icon}`}></i>
                              <span className="capitalize">{scan.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {scan.started_at ? (
                              <div>
                                <p className="text-sm text-slate-900 dark:text-white">
                                  {new Date(scan.started_at).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(scan.started_at).toLocaleTimeString()}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {formatDuration(scan.duration)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {scan.results?.assets_discovered ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {scan.results.assets_discovered}
                                </span>
                                <span className="text-xs text-slate-500">found</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {scan.results?.assets?.length > 0 && (
                                <button
                                  onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                                  className="btn btn-ghost btn-sm"
                                >
                                  <i className={`fa-solid ${expandedScan === scan.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                  <span>{expandedScan === scan.id ? 'Hide' : 'View'}</span>
                                </button>
                              )}
                              {(scan.status === 'running' || scan.status === 'pending') && (
                                <button
                                  onClick={() => setStopConfirm(scan.id)}
                                  className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                  title="Stop Scan"
                                >
                                  <i className="fa-solid fa-stop"></i>
                                </button>
                              )}
                              {scan.status !== 'running' && scan.status !== 'pending' && (
                                <button
                                  onClick={() => setDeleteConfirm(scan.id)}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Delete Scan"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Assets View */}
                        {expandedScan === scan.id && scan.results?.assets?.length > 0 && (
                          <tr>
                            <td colSpan="6" className="p-0">
                              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <i className="fa-solid fa-server text-primary-500"></i>
                                    Discovered Assets ({scan.results.assets.length})
                                  </h4>
                                  <button
                                    onClick={() => {
                                      const csv = 'data:text/csv;charset=utf-8,' + 
                                        'Name,Type,Source\n' +
                                        scan.results.assets.map(a => 
                                          `"${a.name}","${a.type}","${a.source || 'unknown'}"`
                                        ).join('\n')
                                      const link = document.createElement('a')
                                      link.href = encodeURI(csv)
                                      link.download = `discovered_assets_${scan.id}.csv`
                                      link.click()
                                    }}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <i className="fa-solid fa-download"></i>
                                    <span>Export CSV</span>
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-2">
                                  {scan.results.assets.map((asset, idx) => (
                                    <div
                                      key={`${asset.name}_${idx}`}
                                      className="card p-3 hover:border-primary-500 transition-colors"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          asset.type === 'domain' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                          asset.type === 'subdomain' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                          asset.type === 'ip' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}>
                                          <i className={`fa-solid ${
                                            asset.type === 'domain' ? 'fa-globe' :
                                            asset.type === 'subdomain' ? 'fa-sitemap' :
                                            asset.type === 'ip' ? 'fa-network-wired' :
                                            'fa-server'
                                          } text-sm`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={asset.name}>
                                            {asset.name}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 capitalize">
                                              {asset.type?.replace('_', ' ')}
                                            </span>
                                            {asset.source && (
                                              <span className="text-xs text-slate-400">
                                                via {asset.source}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-satellite-dish text-2xl text-slate-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No discovery scans yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Start by running a discovery scan to find external assets
            </p>
            <button
              onClick={() => setShowDiscoveryModal(true)}
              className="btn btn-primary"
            >
              <i className="fa-solid fa-satellite-dish"></i>
              <span>Run Discovery Scan</span>
            </button>
          </div>
        )}
      </div>

      {/* Discovery Modal */}
      {showDiscoveryModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowDiscoveryModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 p-4">
            <div className="card p-6 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <i className="fa-solid fa-satellite-dish text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Run Discovery Scan</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Find external assets</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDiscoveryModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleDiscoveryScan} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Domain to Discover
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fa-solid fa-globe text-slate-400"></i>
                    </div>
                    <input
                      type="text"
                      required
                      value={discoveryForm.domain}
                      onChange={(e) => setDiscoveryForm({ ...discoveryForm, domain: e.target.value })}
                      placeholder="example.com"
                      className="input pl-11"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Enter a domain name to discover subdomains, IPs, and services
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-sliders text-primary-500"></i>
                    Enhanced Options
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={discoveryForm.enable_port_scan}
                        onChange={(e) => setDiscoveryForm({ ...discoveryForm, enable_port_scan: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                          Enable Port Scanning
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Discover exposed ports on assets
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={discoveryForm.enable_service_detection}
                        onChange={(e) => setDiscoveryForm({ ...discoveryForm, enable_service_detection: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                          Enable Service Detection
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Identify services on open ports
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
                    <i className="fa-solid fa-shield-halved mt-0.5"></i>
                    <span>Basic discovery uses safe, passive methods. Enhanced options may perform limited active scanning.</span>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowDiscoveryModal(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-play"></i>
                        <span>Start Discovery</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4">
            <div className="card p-6 animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <i className="fa-solid fa-trash text-red-600 dark:text-red-400 text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Scan</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to delete this scan? The discovered assets will not be deleted.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-ghost"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteScan(deleteConfirm)}
                  className="btn btn-danger"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-trash"></i>
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stop Confirmation Modal */}
      {stopConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setStopConfirm(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4">
            <div className="card p-6 animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <i className="fa-solid fa-stop text-amber-600 dark:text-amber-400 text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Stop Scan</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This will stop the running scan</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to stop this scan? Any assets discovered so far will be saved.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setStopConfirm(null)}
                  className="btn btn-ghost"
                  disabled={stopping}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStopScan(stopConfirm)}
                  className="btn bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={stopping}
                >
                  {stopping ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Stopping...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-stop"></i>
                      <span>Stop Scan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AssetDiscovery
