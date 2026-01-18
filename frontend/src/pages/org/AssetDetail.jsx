import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

const AssetDetail = () => {
  const { asset_id } = useParams()
  const { user } = useAuth()
  const [asset, setAsset] = useState(null)
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [ownership, setOwnership] = useState({ department: '', owner_name: '', owner_email: '' })
  const [metadata, setMetadata] = useState({ criticality: 'low', business_function: '', tags: [] })
  const [saving, setSaving] = useState(false)
  const isViewer = user?.role === 'viewer'

  useEffect(() => {
    fetchAssetData()
  }, [asset_id])

  const fetchAssetData = async () => {
    try {
      const [assetRes, vulnsRes] = await Promise.all([
        axios.get(`/api/assets/${asset_id}/`),
        axios.get(`/api/vulnerabilities/?asset=${asset_id}`)
      ])
      
      setAsset(assetRes.data)
      setVulnerabilities(vulnsRes.data.results || vulnsRes.data || [])
      
      if (assetRes.data.ownership) {
        setOwnership(assetRes.data.ownership)
      }
      if (assetRes.data.metadata) {
        setMetadata(assetRes.data.metadata)
      }
    } catch (error) {
      console.error('Error fetching asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOwnership = async () => {
    setSaving(true)
    try {
      await axios.put(`/api/assets/${asset_id}/ownership/`, ownership)
      alert('Ownership updated successfully')
    } catch (error) {
      alert('Failed to update ownership')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMetadata = async () => {
    setSaving(true)
    try {
      await axios.put(`/api/assets/${asset_id}/metadata/`, metadata)
      alert('Metadata updated successfully')
      fetchAssetData()
    } catch (error) {
      alert('Failed to update metadata')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading asset...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!asset) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Asset not found</h2>
          <Link to="/org/assets/inventory" className="text-[#00C8FF] hover:underline">
            Back to Assets
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/org/assets/inventory" className="text-[#00C8FF] hover:underline mb-2 inline-block">
              ← Back to Assets
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-600 mt-1">Asset details and exposure history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Asset Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-gray-900 capitalize">{asset.asset_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    asset.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {asset.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Seen</label>
                  <p className="mt-1 text-gray-900">{new Date(asset.first_seen).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Seen</label>
                  <p className="mt-1 text-gray-900">{new Date(asset.last_seen).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discovery Source</label>
                  <p className="mt-1 text-gray-900">{asset.discovery_source}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unknown Asset</label>
                  <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    asset.is_unknown ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {asset.is_unknown ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Vulnerabilities */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Linked Vulnerabilities ({vulnerabilities.length})</h2>
              {vulnerabilities.length > 0 ? (
                <div className="space-y-3">
                  {vulnerabilities.map((vuln) => (
                    <Link
                      key={vuln.id}
                      to={`/org/vulnerabilities/${vuln.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{vuln.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{vuln.category}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          vuln.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          vuln.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          vuln.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {vuln.severity}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No vulnerabilities found</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ownership */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ownership</h2>
              {isViewer ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-gray-900">{ownership.department || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                    <p className="mt-1 text-gray-900">{ownership.owner_name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner Email</label>
                    <p className="mt-1 text-gray-900">{ownership.owner_email || 'Not set'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={ownership.department}
                      onChange={(e) => setOwnership({ ...ownership, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                    <input
                      type="text"
                      value={ownership.owner_name}
                      onChange={(e) => setOwnership({ ...ownership, owner_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
                    <input
                      type="email"
                      value={ownership.owner_email}
                      onChange={(e) => setOwnership({ ...ownership, owner_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSaveOwnership}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Ownership'}
                  </button>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Classification</h2>
              {isViewer ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Criticality</label>
                    <p className="mt-1 text-gray-900 capitalize">{metadata.criticality || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Function</label>
                    <p className="mt-1 text-gray-900">{metadata.business_function || 'Not set'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Criticality</label>
                    <select
                      value={metadata.criticality}
                      onChange={(e) => setMetadata({ ...metadata, criticality: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Function</label>
                    <input
                      type="text"
                      value={metadata.business_function}
                      onChange={(e) => setMetadata({ ...metadata, business_function: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C8FF] focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSaveMetadata}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg hover:from-[#00B8E6] hover:to-[#0055E6] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Classification'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AssetDetail


