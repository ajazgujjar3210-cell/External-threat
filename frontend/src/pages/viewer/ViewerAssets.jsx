import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'

const ViewerAssets = () => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    asset_type: '',
    is_active: '',
  })

  useEffect(() => {
    fetchAssets()
  }, [filters])

  const fetchAssets = async () => {
    try {
      const params = {}
      if (filters.asset_type) params.asset_type = filters.asset_type
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true'

      const response = await axios.get('/api/assets/', { params })
      const data = response.data.results || response.data || []
      setAssets(data)
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-1">View-only asset inventory</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select
                value={filters.asset_type}
                onChange={(e) => setFilters({ ...filters, asset_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="domain">Domain</option>
                <option value="subdomain">Subdomain</option>
                <option value="ip">IP Address</option>
                <option value="api">API Endpoint</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.is_active}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading assets...</p>
            </div>
          ) : assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Seen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Seen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                          {asset.asset_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            asset.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {asset.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(asset.first_seen).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(asset.last_seen).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-network-wired text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No assets found</h3>
              <p className="text-sm text-gray-600">Assets will appear here once discovered</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ViewerAssets


