import { useState, useEffect } from 'react'
// Layout is now handled by ProtectedRoute
import axios from 'axios'

const SecurityScans = () => {
  const [scans, setScans] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanForm, setScanForm] = useState({ scan_type: 'port', asset_id: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchScans()
    fetchAssets()
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchScans, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchScans = async () => {
    try {
      const response = await axios.get('/api/scans/')
      const data = response.data.results || response.data || []
      // Filter only security scans (not discovery)
      const securityScans = data.filter(scan => scan.scan_type !== 'discovery')
      setScans(securityScans)
    } catch (error) {
      console.error('Error fetching scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets/')
      const data = response.data.results || response.data || []
      setAssets(data)
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const handleRunScan = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const scanData = {
        scan_type: scanForm.scan_type,
        asset_id: scanForm.asset_id,
      }
      
      await axios.post('/api/scans/', scanData)
      setShowScanModal(false)
      setScanForm({ scan_type: 'port', asset_id: '' })
      fetchScans()
    } catch (error) {
      console.error('Scan error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    }
    return colors[status] || colors.pending
  }

  const getScanTypeLabel = (type) => {
    const labels = {
      port: 'Port Scan',
      ssl: 'SSL/TLS Check',
      vulnerability: 'Vulnerability Scan',
    }
    return labels[type] || type
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Scans</h1>
            <p className="text-gray-600 mt-1">Run security scans on discovered assets</p>
          </div>
          <button
            onClick={() => setShowScanModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg shadow-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 flex items-center"
          >
            <i className="fas fa-shield-alt mr-2"></i>
            Run Security Scan
          </button>
        </div>

        {/* Scans Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading security scans...</p>
            </div>
          ) : scans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scan Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finished
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Results
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {getScanTypeLabel(scan.scan_type)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {scan.config?.asset_name || scan.config?.asset_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(scan.status)}`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.started_at ? new Date(scan.started_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.finished_at ? new Date(scan.finished_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.results ? (
                          <span className="text-blue-600">
                            {scan.results.open_ports || scan.results.issues_found || scan.results.vulnerabilities_found || 0} found
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No security scans found</h3>
              <p className="text-sm text-gray-600 mb-4">Start by running a security scan on an asset</p>
              <button
                onClick={() => setShowScanModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-rose-600 transition-all"
              >
                Run Security Scan
              </button>
            </div>
          )}
        </div>

        {/* Scan Modal */}
        {showScanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Run Security Scan</h2>
                <button
                  onClick={() => setShowScanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleRunScan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Type *
                  </label>
                  <select
                    required
                    value={scanForm.scan_type}
                    onChange={(e) => setScanForm({ ...scanForm, scan_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="port">Port Scan</option>
                    <option value="ssl">SSL/TLS Check</option>
                    <option value="vulnerability">Vulnerability Scan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Asset *
                  </label>
                  <select
                    required
                    value={scanForm.asset_id}
                    onChange={(e) => setScanForm({ ...scanForm, asset_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select an asset...</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.asset_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScanModal(false)}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !scanForm.asset_id}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Starting...' : 'Start Scan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default SecurityScans


