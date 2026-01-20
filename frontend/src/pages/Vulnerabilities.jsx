import { useState, useEffect } from 'react'
import axios from 'axios'

const Vulnerabilities = () => {
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
  })
  const [selectedVuln, setSelectedVuln] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    open: 0,
  })

  useEffect(() => {
    fetchVulnerabilities()
  }, [filters])

  useEffect(() => {
    const critical = vulnerabilities.filter(v => v.severity === 'critical').length
    const high = vulnerabilities.filter(v => v.severity === 'high').length
    const medium = vulnerabilities.filter(v => v.severity === 'medium').length
    const low = vulnerabilities.filter(v => v.severity === 'low').length
    const open = vulnerabilities.filter(v => v.status === 'open').length
    
    setStats({
      total: vulnerabilities.length,
      critical,
      high,
      medium,
      low,
      open,
    })
  }, [vulnerabilities])

  const fetchVulnerabilities = async () => {
    try {
      const params = {}
      if (filters.severity) params.severity = filters.severity
      if (filters.status) params.status = filters.status

      const response = await axios.get('/api/vulnerabilities/', { params })
      const data = response.data.results || response.data || []
      setVulnerabilities(data)
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: { 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        icon: 'fa-skull-crossbones',
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50 dark:bg-red-900/20'
      },
      high: { 
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        icon: 'fa-triangle-exclamation',
        gradient: 'from-orange-500 to-amber-600',
        bgLight: 'bg-orange-50 dark:bg-orange-900/20'
      },
      medium: { 
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        icon: 'fa-circle-exclamation',
        gradient: 'from-amber-500 to-yellow-600',
        bgLight: 'bg-amber-50 dark:bg-amber-900/20'
      },
      low: { 
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: 'fa-circle-info',
        gradient: 'from-blue-500 to-cyan-600',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20'
      },
      info: { 
        color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        icon: 'fa-info',
        gradient: 'from-slate-500 to-slate-600',
        bgLight: 'bg-slate-50 dark:bg-slate-800/50'
      },
    }
    return configs[severity] || configs.info
  }

  const getStatusConfig = (status) => {
    const configs = {
      open: { 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        icon: 'fa-circle-dot'
      },
      in_progress: { 
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        icon: 'fa-spinner'
      },
      resolved: { 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        icon: 'fa-circle-check'
      },
      false_positive: { 
        color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400',
        icon: 'fa-ban'
      },
      risk_accepted: { 
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        icon: 'fa-hand'
      },
    }
    return configs[status] || configs.open
  }

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      vuln.title?.toLowerCase().includes(query) ||
      vuln.description?.toLowerCase().includes(query) ||
      vuln.asset_name?.toLowerCase().includes(query)
    )
  })

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
            Vulnerabilities
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Security vulnerabilities and exposures across your assets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <i className="fa-solid fa-download"></i>
            <span>Export</span>
          </button>
          <button 
            onClick={fetchVulnerabilities}
            className="btn btn-primary"
          >
            <i className="fa-solid fa-rotate"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Critical"
          value={stats.critical}
          icon="fa-skull-crossbones"
          gradient="from-red-500 to-rose-600"
          delay={0}
        />
        <StatCard
          title="High"
          value={stats.high}
          icon="fa-triangle-exclamation"
          gradient="from-orange-500 to-amber-600"
          delay={50}
        />
        <StatCard
          title="Medium"
          value={stats.medium}
          icon="fa-circle-exclamation"
          gradient="from-amber-500 to-yellow-600"
          delay={100}
        />
        <StatCard
          title="Low"
          value={stats.low}
          icon="fa-circle-info"
          gradient="from-blue-500 to-cyan-600"
          delay={150}
        />
        <StatCard
          title="Open"
          value={stats.open}
          icon="fa-circle-dot"
          gradient="from-purple-500 to-violet-600"
          delay={200}
        />
        <StatCard
          title="Total"
          value={stats.total}
          icon="fa-bug"
          gradient="from-slate-500 to-slate-600"
          delay={250}
        />
      </div>

      {/* Search and Filters */}
      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vulnerabilities by title, description, or asset..."
              className="input pl-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="input"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Informational</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
                <option value="risk_accepted">Risk Accepted</option>
              </select>
            </div>
            <div className="flex items-end">
              {(filters.severity || filters.status || searchQuery) && (
                <button
                  onClick={() => {
                    setFilters({ severity: '', status: '' })
                    setSearchQuery('')
                  }}
                  className="btn btn-ghost w-full"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerabilities Table */}
      <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '350ms' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-bug text-white text-xl"></i>
              </div>
            </div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Loading vulnerabilities...</p>
          </div>
        ) : filteredVulnerabilities.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Vulnerabilities
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredVulnerabilities.length} vulnerabilities found
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Vulnerability
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      CVSS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Detected
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredVulnerabilities.map((vuln, index) => {
                    const severityConfig = getSeverityConfig(vuln.severity)
                    const statusConfig = getStatusConfig(vuln.status)
                    return (
                      <tr 
                        key={vuln.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedVuln(vuln)}
                        style={{ animationDelay: `${400 + index * 30}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${severityConfig.gradient} flex items-center justify-center flex-shrink-0`}>
                              <i className={`fa-solid ${severityConfig.icon} text-white text-sm`}></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-xs">
                                {vuln.title}
                              </p>
                              {vuln.cve && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1">
                                  {vuln.cve}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {vuln.asset_name || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            {vuln.asset_type?.replace('_', ' ') || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${severityConfig.color}`}>
                            <i className={`fa-solid ${severityConfig.icon}`}></i>
                            <span className="capitalize">{vuln.severity}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {vuln.cvss ? (
                            <div className="flex items-center gap-2">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                                vuln.cvss >= 9 ? 'bg-red-500' :
                                vuln.cvss >= 7 ? 'bg-orange-500' :
                                vuln.cvss >= 4 ? 'bg-amber-500' :
                                'bg-blue-500'
                              }`}>
                                {vuln.cvss}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                            <i className={`fa-solid ${statusConfig.icon}`}></i>
                            <span className="capitalize">{vuln.status?.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {vuln.detected_at ? new Date(vuln.detected_at).toLocaleDateString() : '-'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {vuln.detected_at ? new Date(vuln.detected_at).toLocaleTimeString() : ''}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVuln(vuln)
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="View Details"
                          >
                            <i className="fa-solid fa-arrow-right"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-shield text-2xl text-green-500"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery || filters.severity || filters.status
                ? 'No vulnerabilities match your filters'
                : 'No vulnerabilities found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery || filters.severity || filters.status
                ? 'Try adjusting your search or filter criteria'
                : 'Great! Your assets appear to be secure'}
            </p>
          </div>
        )}
      </div>

      {/* Vulnerability Detail Modal */}
      {selectedVuln && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setSelectedVuln(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 p-4">
            <div className="card p-6 animate-scale-in">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getSeverityConfig(selectedVuln.severity).gradient} flex items-center justify-center`}>
                    <i className={`fa-solid ${getSeverityConfig(selectedVuln.severity).icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedVuln.title}
                    </h2>
                    {selectedVuln.cve && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-2">
                        {selectedVuln.cve}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVuln(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Severity & Status */}
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${getSeverityConfig(selectedVuln.severity).color}`}>
                    <i className={`fa-solid ${getSeverityConfig(selectedVuln.severity).icon}`}></i>
                    <span className="capitalize">{selectedVuln.severity}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusConfig(selectedVuln.status).color}`}>
                    <i className={`fa-solid ${getStatusConfig(selectedVuln.status).icon}`}></i>
                    <span className="capitalize">{selectedVuln.status?.replace('_', ' ')}</span>
                  </span>
                  {selectedVuln.cvss && (
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-bold text-white ${
                      selectedVuln.cvss >= 9 ? 'bg-red-500' :
                      selectedVuln.cvss >= 7 ? 'bg-orange-500' :
                      selectedVuln.cvss >= 4 ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`}>
                      CVSS: {selectedVuln.cvss}
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedVuln.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedVuln.description}
                    </p>
                  </div>
                )}

                {/* Affected Asset */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Affected Asset</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <i className="fa-solid fa-server text-primary-600 dark:text-primary-400"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedVuln.asset_name || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {selectedVuln.asset_type?.replace('_', ' ') || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remediation */}
                {selectedVuln.remediation && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Remediation</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedVuln.remediation}
                    </p>
                  </div>
                )}

                {/* References */}
                {selectedVuln.references && selectedVuln.references.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">References</h3>
                    <ul className="space-y-1">
                      {selectedVuln.references.map((ref, idx) => (
                        <li key={idx}>
                          <a 
                            href={ref} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary-500 hover:text-primary-600 hover:underline flex items-center gap-1"
                          >
                            <i className="fa-solid fa-external-link text-xs"></i>
                            {ref}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline */}
                <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-calendar"></i>
                    <span>Detected: {selectedVuln.detected_at ? new Date(selectedVuln.detected_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  {selectedVuln.resolved_at && (
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-check"></i>
                      <span>Resolved: {new Date(selectedVuln.resolved_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedVuln(null)}
                  className="btn btn-ghost"
                >
                  Close
                </button>
                <button className="btn btn-primary">
                  <i className="fa-solid fa-pen"></i>
                  <span>Update Status</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Vulnerabilities
