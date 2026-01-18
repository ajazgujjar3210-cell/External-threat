import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const Vulnerabilities = () => {
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
  })

  useEffect(() => {
    fetchVulnerabilities()
  }, [filters])

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

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700',
      info: 'bg-gray-100 text-gray-700',
    }
    return colors[severity] || colors.info
  }

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
    // Calculate statistics
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

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 fade-in">
        {/* Header Section - Enterprise Grade */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#00C8FF] via-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent tracking-tight">
            Vulnerabilities
          </h1>
          <p className="text-gray-600 text-base md:text-lg font-medium">Security vulnerabilities and exposures</p>
        </div>

        {/* Statistics Cards - Enterprise Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-red-500/90 to-rose-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-red-500/20 border border-white/20 hover:shadow-3xl hover:shadow-red-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-red-100 text-sm font-bold uppercase tracking-wide">Critical</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.critical}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-exclamation-triangle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-orange-500/90 to-amber-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-orange-500/20 border border-white/20 hover:shadow-3xl hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-orange-100 text-sm font-bold uppercase tracking-wide">High</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.high}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-exclamation-circle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-amber-500/90 to-yellow-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-amber-500/20 border border-white/20 hover:shadow-3xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-amber-100 text-sm font-bold uppercase tracking-wide">Medium</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.medium}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-info-circle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-blue-500/90 to-cyan-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20 border border-white/20 hover:shadow-3xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-blue-100 text-sm font-bold uppercase tracking-wide">Low</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.low}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-info text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-500/90 to-indigo-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-purple-500/20 border border-white/20 hover:shadow-3xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-purple-100 text-sm font-bold uppercase tracking-wide">Open</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.open}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-clock text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-gray-500/90 to-slate-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-gray-500/20 border border-white/20 hover:shadow-3xl hover:shadow-gray-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-100 text-sm font-bold uppercase tracking-wide">Total</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.total}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-shield-alt text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Modern Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/20 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center">
                <i className="fas fa-filter mr-2 text-[#00C8FF]"></i>Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-[#00C8FF]/50 focus:border-[#00C8FF] transition-all duration-300 font-medium text-gray-800"
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
              <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center">
                <i className="fas fa-toggle-on mr-2 text-[#00C8FF]"></i>Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-[#00C8FF]/50 focus:border-[#00C8FF] transition-all duration-300 font-medium text-gray-800"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
                <option value="risk_accepted">Risk Accepted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vulnerabilities Table - Modern Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#00C8FF] border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading vulnerabilities...</p>
            </div>
          ) : vulnerabilities.length > 0 ? (
            <>
              <div className="px-6 md:px-8 py-5 border-b border-gray-200/50 bg-white/40 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-gray-900">
                  Vulnerabilities <span className="text-[#00C8FF]">({vulnerabilities.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto modern-scrollbar">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-white/60 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        CVSS
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Detected
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-200/30">
                    {vulnerabilities.map((vuln, index) => (
                      <tr 
                        key={vuln.id} 
                        className="hover:bg-white/80 transition-all duration-300 cursor-pointer fade-in group"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              vuln.severity === 'critical' ? 'bg-red-100 text-red-600' :
                              vuln.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                              vuln.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <i className={`fas ${
                                vuln.severity === 'critical' ? 'fa-exclamation-triangle' :
                                vuln.severity === 'high' ? 'fa-exclamation-circle' :
                                'fa-info-circle'
                              }`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-gray-900">{vuln.title}</div>
                              {vuln.description && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{vuln.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{vuln.asset_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{vuln.asset_type || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold capitalize border ${
                            vuln.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            vuln.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            vuln.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            vuln.severity === 'low' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            <i className={`fas ${
                              vuln.severity === 'critical' ? 'fa-exclamation-triangle' :
                              vuln.severity === 'high' ? 'fa-exclamation-circle' :
                              'fa-info-circle'
                            } mr-1.5`}></i>
                            {vuln.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vuln.cvss ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                              {vuln.cvss}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold capitalize border ${
                            vuln.status === 'open' ? 'bg-red-50 text-red-700 border-red-200' :
                            vuln.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            vuln.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {vuln.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            <div>{new Date(vuln.detected_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">{new Date(vuln.detected_at).toLocaleTimeString()}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-shield-alt text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No vulnerabilities found</h3>
              <p className="text-sm text-gray-600">Vulnerabilities will appear here once detected</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Vulnerabilities

