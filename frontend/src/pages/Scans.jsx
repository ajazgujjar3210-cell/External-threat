import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const Scans = () => {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false)
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  const [discoveryForm, setDiscoveryForm] = useState({ domain: '' })
  const [assetForm, setAssetForm] = useState({ name: '', asset_type: 'domain' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchScans()
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchScans, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchScans = async () => {
    try {
      const response = await axios.get('/api/scans/')
      const data = response.data.results || response.data || []
      setScans(data)
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
        domain: discoveryForm.domain 
      })
      setShowDiscoveryModal(false)
      setDiscoveryForm({ domain: '' })
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

  const handleAddAsset = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await axios.post('/api/assets/', assetForm)
      setShowAddAssetModal(false)
      setAssetForm({ name: '', asset_type: 'domain' })
      alert('Asset added successfully!')
      // Refresh the page to show new asset
      window.location.href = '/assets'
    } catch (error) {
      console.error('Add asset error:', error)
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.response?.data?.non_field_errors?.[0] ||
                      error.message || 
                      'Failed to add asset'
      alert(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    }
    return colors[status] || colors.pending
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scans & Discovery</h1>
            <p className="text-gray-600 mt-1">Manage asset discovery and security scans</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddAssetModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Asset
            </button>
            <button
              onClick={() => setShowDiscoveryModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg shadow-lg hover:from-[#00B8E6] hover:to-[#0055E6] transition-all duration-200 flex items-center"
            >
              <i className="fas fa-search mr-2"></i>
              Run Discovery
            </button>
          </div>
        </div>

        {/* Scans Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading scans...</p>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finished
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
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
                          {scan.scan_type.replace('_', ' ')}
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
                        {scan.duration || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scan.results && Object.keys(scan.results).length > 0 ? (
                          <span className="text-blue-600">
                            {scan.results.assets_discovered || scan.results.open_ports || scan.results.issues_found || 0} found
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
                <i className="fas fa-search text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No scans found</h3>
              <p className="text-sm text-gray-600 mb-4">Start by running a discovery scan or adding an asset manually</p>
            </div>
          )}
        </div>

        {/* Discovery Modal */}
        {showDiscoveryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Run Discovery Scan</h2>
                <button
                  onClick={() => setShowDiscoveryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleDiscoveryScan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain to Discover *
                  </label>
                  <input
                    type="text"
                    required
                    value={discoveryForm.domain}
                    onChange={(e) => setDiscoveryForm({ domain: e.target.value })}
                    placeholder="example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a domain name to discover subdomains and assets
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDiscoveryModal(false)}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#00C8FF] to-[#0066FF] rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Starting...' : 'Start Discovery'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Asset Modal */}
        {showAddAssetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Asset Manually</h2>
                <button
                  onClick={() => setShowAddAssetModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleAddAsset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    placeholder="example.com or 192.168.1.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Type *
                  </label>
                  <select
                    required
                    value={assetForm.asset_type}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="domain">Domain</option>
                    <option value="subdomain">Subdomain</option>
                    <option value="ip">IP Address</option>
                    <option value="api">API Endpoint</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddAssetModal(false)}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Adding...' : 'Add Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Scans

