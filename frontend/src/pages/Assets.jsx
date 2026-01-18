import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'
import { Link } from 'react-router-dom'

const Assets = () => {
  const [assets, setAssets] = useState([])
  const [filteredAssets, setFilteredAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    asset_type: '',
    is_active: '',
    is_unknown: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    unknown: 0,
  })
  const [showOwnershipModal, setShowOwnershipModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [ownershipForm, setOwnershipForm] = useState({
    department: '',
    owner_name: '',
    owner_email: ''
  })
  const [savingOwnership, setSavingOwnership] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [filters])

  useEffect(() => {
    filterAssets()
  }, [searchQuery, assets])

  const fetchAssets = async () => {
    try {
      const params = {}
      if (filters.asset_type) params.asset_type = filters.asset_type
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true'
      if (filters.is_unknown !== '') params.is_unknown = filters.is_unknown === 'true'

      const response = await axios.get('/api/assets/', { params })
      const data = response.data.results || response.data || []
      setAssets(data)
      setFilteredAssets(data)
      
      // Calculate statistics
      setStats({
        total: data.length,
        active: data.filter(a => a.is_active).length,
        inactive: data.filter(a => !a.is_active).length,
        unknown: data.filter(a => a.is_unknown).length,
      })
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAssets = () => {
    if (!searchQuery.trim()) {
      setFilteredAssets(assets)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = assets.filter(asset =>
      asset.name.toLowerCase().includes(query) ||
      asset.asset_type.toLowerCase().includes(query) ||
      (asset.discovery_source && asset.discovery_source.toLowerCase().includes(query))
    )
    setFilteredAssets(filtered)
  }

  const getAssetIcon = (type) => {
    const icons = {
      domain: 'fa-globe',
      subdomain: 'fa-sitemap',
      ip: 'fa-network-wired',
      api: 'fa-server',
      web_service: 'fa-cloud',
      web_application: 'fa-window-maximize',
      port: 'fa-plug',
      service: 'fa-cogs',
    }
    return icons[type] || 'fa-cube'
  }

  const getAssetTypeColor = (type) => {
    const colors = {
      domain: 'bg-blue-100 text-blue-700 border-blue-200',
      subdomain: 'bg-purple-100 text-purple-700 border-purple-200',
      ip: 'bg-green-100 text-green-700 border-green-200',
      api: 'bg-amber-100 text-amber-700 border-amber-200',
      web_service: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      web_application: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      port: 'bg-orange-100 text-orange-700 border-orange-200',
      service: 'bg-pink-100 text-pink-700 border-pink-200',
    }
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your external assets</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/org/asset-discovery"
              className="px-5 py-2.5 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg shadow-md hover:from-[#00B8E6] hover:to-[#0055E6] transition-all duration-200 flex items-center text-sm"
            >
              <i className="fas fa-search mr-2"></i>
              Asset Discovery
            </Link>
            <Link
              to="/org/security-scans"
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg shadow-md hover:from-red-600 hover:to-rose-600 transition-all duration-200 flex items-center text-sm"
            >
              <i className="fas fa-shield-alt mr-2"></i>
              Security Scans
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Assets</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-network-wired text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Active</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">Inactive</p>
                <p className="text-3xl font-bold">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-times-circle text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Unknown</p>
                <p className="text-3xl font-bold">{stats.unknown}</p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-question-circle text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets by name, type, or source..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i className="fas fa-times text-gray-400 hover:text-gray-600"></i>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-filter mr-2 text-gray-500"></i>Asset Type
                </label>
                <select
                  value={filters.asset_type}
                  onChange={(e) => setFilters({ ...filters, asset_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Types</option>
                  <option value="domain">Domain</option>
                  <option value="subdomain">Subdomain</option>
                  <option value="ip">IP Address</option>
                  <option value="api">API Endpoint</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-toggle-on mr-2 text-gray-500"></i>Status
                </label>
                <select
                  value={filters.is_active}
                  onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-question-circle mr-2 text-amber-600"></i>Unknown Assets
                </label>
                <select
                  value={filters.is_unknown}
                  onChange={(e) => setFilters({ ...filters, is_unknown: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Assets</option>
                  <option value="true">Unknown Only</option>
                  <option value="false">Known Only</option>
                </select>
              </div>
              <div className="flex items-end">
                {(filters.asset_type || filters.is_active || filters.is_unknown || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilters({ asset_type: '', is_active: '', is_unknown: '' })
                      setSearchQuery('')
                    }}
                    className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Results Count */}
            {searchQuery && (
              <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
                Showing <span className="font-semibold text-gray-900">{filteredAssets.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{assets.length}</span> assets
              </div>
            )}
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading assets...</p>
            </div>
          ) : filteredAssets.length > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assets ({filteredAssets.length})
                  </h3>
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                    <i className="fas fa-download mr-2"></i>
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Discovery Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        First Seen
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Last Seen
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ownership
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-blue-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              asset.asset_type === 'domain' ? 'bg-blue-100 text-blue-600' :
                              asset.asset_type === 'subdomain' ? 'bg-purple-100 text-purple-600' :
                              asset.asset_type === 'ip' ? 'bg-green-100 text-green-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              <i className={`fas ${getAssetIcon(asset.asset_type)}`}></i>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{asset.name}</div>
                              {asset.is_unknown && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white mt-1 shadow-sm border border-amber-500">
                                  <i className="fas fa-exclamation-triangle mr-1.5"></i>
                                  UNKNOWN ASSET
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getAssetTypeColor(asset.asset_type)}`}>
                            <i className={`fas ${getAssetIcon(asset.asset_type)} mr-2`}></i>
                            {asset.asset_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              asset.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <i className={`fas ${asset.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-1.5`}></i>
                            {asset.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {asset.discovery_source ? (
                              <span className="inline-flex items-center">
                                <i className="fas fa-search mr-1.5 text-gray-400"></i>
                                {asset.discovery_source}
                              </span>
                            ) : (
                              <span className="text-gray-400">Manual</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {asset.first_seen ? (
                            <div>
                              <div>{new Date(asset.first_seen).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-400">{new Date(asset.first_seen).toLocaleTimeString()}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {asset.last_seen ? (
                            <div>
                              <div>{new Date(asset.last_seen).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-400">{new Date(asset.last_seen).toLocaleTimeString()}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {asset.ownership ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">{asset.ownership.owner_name || 'Unassigned'}</div>
                              <div className="text-xs text-gray-500">{asset.ownership.department || '-'}</div>
                              {asset.ownership.owner_email && (
                                <div className="text-xs text-blue-600">{asset.ownership.owner_email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAsset(asset)
                                setOwnershipForm({
                                  department: asset.ownership?.department || '',
                                  owner_name: asset.ownership?.owner_name || '',
                                  owner_email: asset.ownership?.owner_email || ''
                                })
                                setShowOwnershipModal(true)
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Edit Ownership"
                            >
                              <i className="fas fa-user-edit mr-1"></i>
                              Edit
                            </button>
                            {asset.is_unknown && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  if (window.confirm(`Mark "${asset.name}" as known/managed?`)) {
                                    try {
                                      await axios.post(`/api/assets/${asset.id}/mark-known/`)
                                      await fetchAssets()
                                      alert('Asset marked as known!')
                                    } catch (error) {
                                      console.error('Error marking asset as known:', error)
                                      alert('Failed to mark asset as known')
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                title="Mark as Known"
                              >
                                <i className="fas fa-check-circle mr-1"></i>
                                Mark Known
                              </button>
                            )}
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
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-network-wired text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {searchQuery || filters.asset_type || filters.is_active || filters.is_unknown
                  ? 'No assets match your filters'
                  : 'No assets found'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {searchQuery || filters.asset_type || filters.is_active || filters.is_unknown
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by running an asset discovery scan'}
              </p>
              {!searchQuery && !filters.asset_type && !filters.is_active && !filters.is_unknown && (
                <Link
                  to="/org/asset-discovery"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg shadow-md hover:from-[#00B8E6] hover:to-[#0055E6] transition-all"
                >
                  <i className="fas fa-search mr-2"></i>
                  Run Asset Discovery
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Ownership Edit Modal */}
        {showOwnershipModal && selectedAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user-edit text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Ownership</h2>
                    <p className="text-sm text-gray-500">{selectedAsset.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOwnershipModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveOwnership(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-building mr-2 text-blue-600"></i>
                    Department
                  </label>
                  <input
                    type="text"
                    value={ownershipForm.department}
                    onChange={(e) => setOwnershipForm({ ...ownershipForm, department: e.target.value })}
                    placeholder="e.g., IT Operations, Engineering"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-user mr-2 text-blue-600"></i>
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownershipForm.owner_name}
                    onChange={(e) => setOwnershipForm({ ...ownershipForm, owner_name: e.target.value })}
                    placeholder="e.g., John Doe, API Team"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-envelope mr-2 text-blue-600"></i>
                    Owner Email
                  </label>
                  <input
                    type="email"
                    value={ownershipForm.owner_email}
                    onChange={(e) => setOwnershipForm({ ...ownershipForm, owner_email: e.target.value })}
                    placeholder="e.g., owner@example.com"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowOwnershipModal(false)}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOwnership}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#00C8FF] to-[#0066FF] rounded-lg hover:from-[#00B8E6] hover:to-[#0066FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {savingOwnership ? 'Saving...' : 'Save Ownership'}
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

export default Assets

