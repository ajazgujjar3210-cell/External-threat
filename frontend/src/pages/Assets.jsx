import { useState, useEffect } from 'react'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    total_pages: 1
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  useEffect(() => {
    fetchAssets()
  }, [filters, currentPage])

  useEffect(() => {
    filterAssets()
  }, [searchQuery, assets])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        page_size: 10
      }
      if (filters.asset_type) params.asset_type = filters.asset_type
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true'
      if (filters.is_unknown !== '') params.is_unknown = filters.is_unknown === 'true'

      const response = await axios.get('/api/assets/', { params })
      
      if (response.data.results) {
        const data = response.data.results
        setAssets(data)
        setFilteredAssets(data)
        setPagination({
          count: response.data.count || 0,
          next: response.data.next,
          previous: response.data.previous,
          total_pages: Math.ceil((response.data.count || 0) / 10)
        })
        
        setStats({
          total: response.data.count || data.length,
          active: data.filter(a => a.is_active).length,
          inactive: data.filter(a => !a.is_active).length,
          unknown: data.filter(a => a.is_unknown).length,
        })
      } else {
        const data = response.data || []
        setAssets(data)
        setFilteredAssets(data)
        setStats({
          total: data.length,
          active: data.filter(a => a.is_active).length,
          inactive: data.filter(a => !a.is_active).length,
          unknown: data.filter(a => a.is_unknown).length,
        })
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOwnership = async () => {
    if (!selectedAsset) return
    
    setSavingOwnership(true)
    try {
      await axios.put(`/api/assets/${selectedAsset.id}/ownership/`, ownershipForm)
      setShowOwnershipModal(false)
      setOwnershipForm({ department: '', owner_name: '', owner_email: '' })
      setSelectedAsset(null)
      fetchAssets()
    } catch (error) {
      console.error('Error saving ownership:', error)
    } finally {
      setSavingOwnership(false)
    }
  }

  const handleEditOwnership = (asset) => {
    setSelectedAsset(asset)
    if (asset.ownership) {
      setOwnershipForm({
        department: asset.ownership.department || '',
        owner_name: asset.ownership.owner_name || '',
        owner_email: asset.ownership.owner_email || ''
      })
    } else {
      setOwnershipForm({ department: '', owner_name: '', owner_email: '' })
    }
    setShowOwnershipModal(true)
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
      domain: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      subdomain: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      ip: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      api: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      web_service: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
      web_application: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
      port: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      service: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
    }
    return colors[type] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
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
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
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
            Asset Inventory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and monitor your external attack surface
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/org/asset-discovery" className="btn btn-primary">
            <i className="fa-solid fa-satellite-dish"></i>
            <span>Asset Discovery</span>
          </Link>
          <Link to="/org/security-scans" className="btn btn-secondary">
            <i className="fa-solid fa-shield"></i>
            <span>Security Scans</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assets"
          value={stats.total}
          icon="fa-server"
          gradient="bg-gradient-to-br from-primary-500 to-primary-600"
          delay={0}
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon="fa-circle-check"
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          delay={50}
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon="fa-circle-xmark"
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
          delay={100}
        />
        <StatCard
          title="Unknown"
          value={stats.unknown}
          icon="fa-circle-question"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={150}
        />
      </div>

      {/* Search and Filters */}
      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
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
              placeholder="Search assets by name, type, or source..."
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Asset Type
              </label>
              <select
                value={filters.asset_type}
                onChange={(e) => setFilters({ ...filters, asset_type: e.target.value })}
                className="input"
              >
                <option value="">All Types</option>
                <option value="domain">Domain</option>
                <option value="subdomain">Subdomain</option>
                <option value="ip">IP Address</option>
                <option value="port">Port</option>
                <option value="service">Service</option>
                <option value="web_service">Web Service</option>
                <option value="web_application">Web Application</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filters.is_active}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                className="input"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Classification
              </label>
              <select
                value={filters.is_unknown}
                onChange={(e) => setFilters({ ...filters, is_unknown: e.target.value })}
                className="input"
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
                    setCurrentPage(1)
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

      {/* Assets Table */}
      <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '250ms' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-server text-white text-xl"></i>
              </div>
            </div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Loading assets...</p>
          </div>
        ) : filteredAssets.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Assets
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {pagination.count} total assets
                </p>
              </div>
              <button className="btn btn-ghost">
                <i className="fa-solid fa-download"></i>
                <span>Export</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      First Seen
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredAssets.map((asset, index) => (
                    <tr 
                      key={asset.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      style={{ animationDelay: `${300 + index * 30}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAssetTypeColor(asset.asset_type)}`}>
                            <i className={`fa-solid ${getAssetIcon(asset.asset_type)}`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {asset.name}
                            </p>
                            {asset.is_unknown && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mt-1">
                                <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
                                Unknown
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getAssetTypeColor(asset.asset_type)}`}>
                          <i className={`fa-solid ${getAssetIcon(asset.asset_type)} text-[10px]`}></i>
                          {asset.asset_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          asset.is_active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          <i className={`fa-solid ${asset.is_active ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
                          {asset.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {asset.discovery_source || 'Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {asset.first_seen ? new Date(asset.first_seen).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditOwnership(asset)}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Edit Ownership"
                          >
                            <i className="fa-solid fa-user-pen"></i>
                          </button>
                          {asset.is_unknown && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Mark "${asset.name}" as known?`)) {
                                  try {
                                    await axios.post(`/api/assets/${asset.id}/mark-known/`)
                                    await fetchAssets()
                                  } catch (error) {
                                    console.error('Error marking asset as known:', error)
                                  }
                                }
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              title="Mark as Known"
                            >
                              <i className="fa-solid fa-circle-check"></i>
                            </button>
                          )}
                          <Link
                            to={`/org/assets/${asset.id}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="View Details"
                          >
                            <i className="fa-solid fa-arrow-right"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{pagination.total_pages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-ghost btn-sm"
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                      disabled={currentPage === pagination.total_pages}
                      className="btn btn-ghost btn-sm"
                    >
                      <span>Next</span>
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-server text-2xl text-slate-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery || filters.asset_type || filters.is_active || filters.is_unknown
                ? 'No assets match your filters'
                : 'No assets found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery || filters.asset_type || filters.is_active || filters.is_unknown
                ? 'Try adjusting your search or filter criteria'
                : 'Start by running an asset discovery scan'}
            </p>
            {!searchQuery && !filters.asset_type && !filters.is_active && !filters.is_unknown && (
              <Link to="/org/asset-discovery" className="btn btn-primary">
                <i className="fa-solid fa-satellite-dish"></i>
                <span>Run Asset Discovery</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Ownership Modal */}
      {showOwnershipModal && selectedAsset && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowOwnershipModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4">
            <div className="card p-6 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <i className="fa-solid fa-user-pen text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Ownership</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedAsset.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOwnershipModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveOwnership(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={ownershipForm.department}
                    onChange={(e) => setOwnershipForm({ ...ownershipForm, department: e.target.value })}
                    placeholder="e.g., IT Operations"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownershipForm.owner_name}
                    onChange={(e) => setOwnershipForm({ ...ownershipForm, owner_name: e.target.value })}
                    placeholder="e.g., John Doe"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    value={ownershipForm.owner_email}
                    onChange={(e) => setOwnershipForm({ ...ownershipForm, owner_email: e.target.value })}
                    placeholder="e.g., john@example.com"
                    className="input"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowOwnershipModal(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOwnership}
                    className="btn btn-primary"
                  >
                    {savingOwnership ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i>
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Assets
