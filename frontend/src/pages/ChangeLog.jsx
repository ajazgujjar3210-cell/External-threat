import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const ChangeLog = () => {
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    change_type: '',
  })

  useEffect(() => {
    fetchChanges()
  }, [filters])

  const fetchChanges = async () => {
    try {
      const params = {}
      if (filters.change_type) params.change_type = filters.change_type

      const response = await axios.get('/api/assets/changes/', { params })
      setChanges(response.data)
    } catch (error) {
      console.error('Error fetching changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChangeTypeColor = (type) => {
    const colors = {
      new: 'bg-emerald-100 text-emerald-700',
      removed: 'bg-red-100 text-red-700',
      status_change: 'bg-amber-100 text-amber-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    removed: 0,
    status_change: 0,
  })

  useEffect(() => {
    fetchChanges()
  }, [filters])

  useEffect(() => {
    const new_count = changes.filter(c => c.change_type === 'new').length
    const removed = changes.filter(c => c.change_type === 'removed').length
    const status_change = changes.filter(c => c.change_type === 'status_change').length
    
    setStats({
      total: changes.length,
      new: new_count,
      removed,
      status_change,
    })
  }, [changes])

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 fade-in">
        {/* Header Section - Enterprise Grade */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#00C8FF] via-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent tracking-tight">
            Change Log
          </h1>
          <p className="text-gray-600 text-base md:text-lg font-medium">Timeline of asset and vulnerability changes</p>
        </div>

        {/* Statistics Cards - Enterprise Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-emerald-500/90 to-green-600/90 rounded-2xl p-6 text-white shadow-2xl shadow-emerald-500/20 border border-white/20 hover:shadow-3xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-emerald-100 text-sm font-bold uppercase tracking-wide">New Assets</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.new}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-plus-circle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-red-500/90 to-rose-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-red-500/20 border border-white/20 hover:shadow-3xl hover:shadow-red-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-red-100 text-sm font-bold uppercase tracking-wide">Removed</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.removed}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-minus-circle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-amber-500/90 to-orange-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-amber-500/20 border border-white/20 hover:shadow-3xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-amber-100 text-sm font-bold uppercase tracking-wide">Status Changes</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.status_change}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-sync-alt text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-gray-500/90 to-slate-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-gray-500/20 border border-white/20 hover:shadow-3xl hover:shadow-gray-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-100 text-sm font-bold uppercase tracking-wide">Total Changes</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.total}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-history text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Modern Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/20 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center">
                <i className="fas fa-filter mr-2 text-[#00C8FF]"></i>Change Type
              </label>
              <select
                value={filters.change_type}
                onChange={(e) => setFilters({ ...filters, change_type: e.target.value })}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-[#00C8FF]/50 focus:border-[#00C8FF] transition-all duration-300 font-medium text-gray-800"
              >
                <option value="">All Types</option>
                <option value="new">New Assets</option>
                <option value="removed">Removed Assets</option>
                <option value="status_change">Status Changes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline View - Modern Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/20 p-6 md:p-8">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#00C8FF] border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading changes...</p>
            </div>
          ) : changes.length > 0 ? (
            <div className="relative">
              {/* Timeline line - Enhanced */}
              <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00C8FF] via-[#0066FF] to-[#7C3AED] rounded-full"></div>
              
              <div className="space-y-6">
                {changes.map((change, index) => (
                  <div 
                    key={change.id} 
                    className="relative flex items-start space-x-4 fade-in group"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Timeline dot - Enhanced */}
                    <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-4 border-white shadow-xl ${
                      change.change_type === 'new' ? 'bg-emerald-500' :
                      change.change_type === 'removed' ? 'bg-red-500' :
                      'bg-amber-500'
                    }`}></div>
                    
                    {/* Content - Enhanced */}
                    <div className="flex-1 backdrop-blur-sm bg-gradient-to-r from-gray-50/80 to-white/60 rounded-xl p-5 border-2 border-gray-200/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
                        <div className="flex items-center space-x-3 flex-wrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold capitalize border-2 ${
                            change.change_type === 'new' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400 shadow-lg' :
                            change.change_type === 'removed' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-400 shadow-lg' :
                            'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-lg'
                          }`}>
                            <i className={`fas ${
                              change.change_type === 'new' ? 'fa-plus-circle' :
                              change.change_type === 'removed' ? 'fa-minus-circle' :
                              'fa-sync-alt'
                            } mr-1.5`}></i>
                            {change.change_type.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{change.asset_name}</span>
                          <span className="text-xs text-gray-500 font-medium">({change.asset_type})</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 bg-white/60 px-3 py-1.5 rounded-lg">
                          <i className="fas fa-clock mr-1.5 text-[#00C8FF]"></i>
                          {new Date(change.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-history text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No changes found</h3>
              <p className="text-sm text-gray-600">Changes will appear here as assets are discovered or modified</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ChangeLog

