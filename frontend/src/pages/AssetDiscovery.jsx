import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
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
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    pending: 0,
    failed: 0,
    totalAssets: 0,
  })

  useEffect(() => {
    fetchScans()
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchScans, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchScans = async () => {
    try {
      const response = await axios.get('/api/scans/?scan_type=discovery')
      const data = response.data.results || response.data || []
      // Filter only discovery scans
      const discoveryScans = data.filter(scan => scan.scan_type === 'discovery')
      setScans(discoveryScans)
      
      // Calculate statistics
      const totalAssets = discoveryScans.reduce((sum, scan) => 
        sum + (scan.results?.assets_discovered || 0), 0
      )
      setStats({
        total: discoveryScans.length,
        completed: discoveryScans.filter(s => s.status === 'completed').length,
        running: discoveryScans.filter(s => s.status === 'running').length,
        pending: discoveryScans.filter(s => s.status === 'pending').length,
        failed: discoveryScans.filter(s => s.status === 'failed').length,
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
      const response = await axios.post('/api/assets/discover/', { 
        domain: discoveryForm.domain,
        enable_port_scan: discoveryForm.enable_port_scan,
        enable_service_detection: discoveryForm.enable_service_detection
      })
      setShowDiscoveryModal(false)
      setDiscoveryForm({ domain: '', enable_port_scan: false, enable_service_detection: false })
      fetchScans()
      alert('Discovery scan started! Check back in a few moments.')
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
      alert('Scan deleted successfully!')
    } catch (error) {
      console.error('Delete scan error:', error)
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to delete scan'
      alert(errorMsg)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      running: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || colors.pending
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'fa-clock',
      running: 'fa-spinner fa-spin',
      completed: 'fa-check-circle',
      failed: 'fa-exclamation-circle',
    }
    return icons[status] || 'fa-question-circle'
  }

  const formatDuration = (duration) => {
    if (!duration) return '-'
    if (typeof duration === 'string') return duration
    return `${duration}s`
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Asset Discovery</h1>
            <p className="text-gray-600 mt-1">Discover external assets using safe, passive scanning methods</p>
          </div>
          <button
            onClick={() => setShowDiscoveryModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg shadow-lg hover:from-[#00B8E6] hover:to-[#0055E6] transition-all duration-200 flex items-center"
          >
            <i className="fas fa-search mr-2"></i>
            Run Discovery Scan
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Scans</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-list text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm font-medium mb-1">Running</p>
                <p className="text-3xl font-bold">{stats.running}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Assets Found</p>
                <p className="text-3xl font-bold">{stats.totalAssets}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-network-wired text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <i className="fas fa-info-circle text-blue-600 text-lg"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900 mb-2">Discovery Scan Information</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                Discovery scans use safe, passive methods (crt.sh, Subfinder) to find assets without actively probing targets. 
                Scans typically take 30-60 seconds to complete.
              </p>
              {stats.pending > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {stats.pending} scan(s) are pending. Make sure Celery worker is running for scans to execute.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scans Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading discovery scans...</p>
            </div>
          ) : scans.length > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Discovery Scans ({scans.length})
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <i className="fas fa-sync-alt cursor-pointer hover:text-blue-600" onClick={fetchScans}></i>
                    <span>Auto-refresh: 5s</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Finished
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Assets Found
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scans.map((scan) => (
                      <React.Fragment key={scan.id}>
                        <tr className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-globe text-blue-600"></i>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {scan.config?.domain || 'N/A'}
                                </div>
                                {scan.error_message && (
                                  <div className="text-xs text-red-600 mt-1">
                                    <i className="fas fa-exclamation-circle mr-1"></i>
                                    {scan.error_message.substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border ${getStatusColor(scan.status)}`}>
                              <i className={`fas ${getStatusIcon(scan.status)} mr-1.5 ${scan.status === 'running' ? 'animate-spin' : ''}`}></i>
                              {scan.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {scan.started_at ? (
                              <div className="text-sm text-gray-600">
                                <div>{new Date(scan.started_at).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">{new Date(scan.started_at).toLocaleTimeString()}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {scan.finished_at ? (
                              <div className="text-sm text-gray-600">
                                <div>{new Date(scan.finished_at).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">{new Date(scan.finished_at).toLocaleTimeString()}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDuration(scan.duration)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {scan.results?.assets_discovered ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-emerald-600 font-bold text-lg">
                                  {scan.results.assets_discovered}
                                </span>
                                <span className="text-sm text-gray-600">assets</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {scan.results?.assets && scan.results.assets.length > 0 ? (
                                <button
                                  onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm flex items-center transition-colors"
                                >
                                  <i className={`fas ${expandedScan === scan.id ? 'fa-chevron-up' : 'fa-chevron-down'} mr-1.5`}></i>
                                  {expandedScan === scan.id ? 'Hide' : 'View'} Assets
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                              {scan.status !== 'running' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteConfirm(scan.id)
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Delete Scan"
                                >
                                  <i className="fas fa-trash mr-1"></i>
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded row showing discovered assets */}
                        {expandedScan === scan.id && scan.results?.assets && scan.results.assets.length > 0 && (
                          <tr>
                            <td colSpan="7" className="px-6 py-5 bg-gradient-to-br from-gray-50 to-blue-50">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <h4 className="text-base font-bold text-gray-900 flex items-center">
                                    <i className="fas fa-list mr-2 text-blue-600"></i>
                                    Discovered Assets ({scan.results.assets_discovered || scan.results.assets.length}
                                    {scan.results.max_limit && scan.results.limit_reached && (
                                      <span className="ml-2 text-xs font-normal text-amber-600">
                                        (Max limit: {scan.results.max_limit})
                                      </span>
                                    )})
                                  </h4>
                                  <div className="flex items-center gap-4 flex-wrap">
                                    {scan.results.source_breakdown && (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {Object.entries(scan.results.source_breakdown).map(([source, count]) => (
                                          <span key={source} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white border-2 border-gray-300">
                                            <i className={`fas ${source === 'crt.sh' ? 'fa-certificate' : 'fa-search'} mr-2 text-blue-600`}></i>
                                            {source}: <span className="font-bold text-gray-900 ml-1">{count}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {scan.results.assets_saved && (
                                      <span className="text-sm text-gray-600">
                                        <span className="font-semibold text-emerald-600">{scan.results.assets_saved}</span> new assets saved
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {scan.results.limit_reached && (
                                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3">
                                    <p className="text-xs text-amber-800 flex items-center">
                                      <i className="fas fa-exclamation-triangle mr-2"></i>
                                      Maximum limit of {scan.results.max_limit} assets reached. Some results may have been truncated.
                                    </p>
                                  </div>
                                )}
                                <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-700">Showing all discovered assets</span>
                                    <div className="flex gap-2">
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
                                        className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                      >
                                        <i className="fas fa-download mr-1"></i>
                                        Export CSV
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                                  {(() => {
                                    // Deduplicate assets before displaying (extra safety)
                                    const seen = new Set()
                                    const uniqueAssets = scan.results.assets.filter(asset => {
                                      // Normalize name for comparison
                                      const normalizedName = asset.name.toLowerCase().trim()
                                      const key = `${normalizedName}_${asset.type}`
                                      if (seen.has(key)) {
                                        return false
                                      }
                                      seen.add(key)
                                      return true
                                    })
                                    return uniqueAssets.map((asset, index) => (
                                      <div
                                        key={`${asset.name}_${asset.type}_${index}`}
                                        className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 hover:shadow-lg transition-all"
                                      >
                                      <div className="flex items-start space-x-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          asset.type === 'domain' ? 'bg-blue-100 text-blue-600' :
                                          asset.type === 'subdomain' ? 'bg-purple-100 text-purple-600' :
                                          asset.type === 'ip' ? 'bg-green-100 text-green-600' :
                                          asset.type === 'web_service' ? 'bg-cyan-100 text-cyan-600' :
                                          asset.type === 'web_application' ? 'bg-indigo-100 text-indigo-600' :
                                          asset.type === 'port' ? 'bg-orange-100 text-orange-600' :
                                          asset.type === 'service' ? 'bg-pink-100 text-pink-600' :
                                          'bg-amber-100 text-amber-600'
                                        }`}>
                                          <i className={`fas ${
                                            asset.type === 'domain' ? 'fa-globe' :
                                            asset.type === 'subdomain' ? 'fa-sitemap' :
                                            asset.type === 'ip' ? 'fa-network-wired' :
                                            asset.type === 'web_service' ? 'fa-cloud' :
                                            asset.type === 'web_application' ? 'fa-window-maximize' :
                                            asset.type === 'port' ? 'fa-plug' :
                                            asset.type === 'service' ? 'fa-cogs' :
                                            'fa-server'
                                          }`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-semibold text-gray-900 truncate" title={asset.name}>
                                            {asset.name}
                                          </div>
                                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                              asset.type === 'domain' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                              asset.type === 'subdomain' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                              asset.type === 'ip' ? 'bg-green-50 text-green-700 border-green-200' :
                                              asset.type === 'web_service' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                              asset.type === 'web_application' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                              asset.type === 'port' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                              asset.type === 'service' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                                              'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                              {asset.type.replace('_', ' ')}
                                            </span>
                                            {asset.source && (
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                asset.source === 'crt.sh' ? 'bg-green-50 text-green-700' :
                                                asset.source === 'subfinder' ? 'bg-indigo-50 text-indigo-700' :
                                                'bg-gray-50 text-gray-700'
                                              }`}>
                                                <i className={`fas ${asset.source === 'crt.sh' ? 'fa-certificate' : 'fa-search'} mr-1`}></i>
                                                {asset.source}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    ))
                                  })()}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No discovery scans found</h3>
              <p className="text-sm text-gray-600 mb-4">Start by running a discovery scan</p>
              <button
                onClick={() => setShowDiscoveryModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] transition-all"
              >
                Run Discovery Scan
              </button>
            </div>
          )}
        </div>

        {/* Discovery Modal */}
        {showDiscoveryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-search text-white text-xl"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Run Discovery Scan</h2>
                </div>
                <button
                  onClick={() => setShowDiscoveryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleDiscoveryScan} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-globe mr-2 text-blue-600"></i>
                    Domain to Discover *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={discoveryForm.domain}
                      onChange={(e) => setDiscoveryForm({ ...discoveryForm, domain: e.target.value })}
                      placeholder="example.com"
                      className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <i className="fas fa-globe absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <i className="fas fa-info-circle mr-1.5"></i>
                    Enter a domain name to discover subdomains, IPs, web services, and more
                  </p>
                </div>

                {/* Enhanced Discovery Options */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <i className="fas fa-cog mr-2 text-blue-600"></i>
                    Enhanced Discovery Options
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={discoveryForm.enable_port_scan}
                        onChange={(e) => setDiscoveryForm({ ...discoveryForm, enable_port_scan: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          Enable Port Scanning
                        </div>
                        <div className="text-xs text-gray-500">
                          Discover exposed ports on discovered assets (requires Naabu)
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={discoveryForm.enable_service_detection}
                        onChange={(e) => setDiscoveryForm({ ...discoveryForm, enable_service_detection: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          Enable Service Detection
                        </div>
                        <div className="text-xs text-gray-500">
                          Identify services running on open ports (requires port scanning)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 flex items-start">
                    <i className="fas fa-shield-alt mr-2 mt-0.5"></i>
                    <span>Basic discovery uses safe, passive methods. Enhanced options may perform limited active scanning.</span>
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowDiscoveryModal(false)}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#00C8FF] to-[#0066FF] rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Starting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-play mr-2"></i>
                        Start Discovery
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Delete Scan</h2>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this discovery scan? This will remove the scan record but will not delete the discovered assets.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteScan(deleteConfirm)}
                  disabled={deleting}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash mr-2"></i>
                      Delete Scan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AssetDiscovery

