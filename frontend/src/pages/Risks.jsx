import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const Risks = () => {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRisks()
  }, [])

  const fetchRisks = async () => {
    try {
      const response = await axios.get('/api/risks/')
      const data = response.data.results || response.data || []
      setRisks(data)
    } catch (error) {
      console.error('Error fetching risks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score) => {
    if (score >= 80) return 'bg-red-100 text-red-700'
    if (score >= 60) return 'bg-orange-100 text-orange-700'
    if (score >= 40) return 'bg-amber-100 text-amber-700'
    return 'bg-blue-100 text-blue-700'
  }

  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  })

  useEffect(() => {
    fetchRisks()
  }, [])

  useEffect(() => {
    // Calculate statistics
    const critical = risks.filter(r => parseFloat(r.score) >= 80).length
    const high = risks.filter(r => parseFloat(r.score) >= 60 && parseFloat(r.score) < 80).length
    const medium = risks.filter(r => parseFloat(r.score) >= 40 && parseFloat(r.score) < 60).length
    const low = risks.filter(r => parseFloat(r.score) < 40).length
    
    setStats({
      total: risks.length,
      critical,
      high,
      medium,
      low,
    })
  }, [risks])

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 fade-in">
        {/* Header Section - Enterprise Grade */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#00C8FF] via-[#0066FF] to-[#7C3AED] bg-clip-text text-transparent tracking-tight">
            Top Risks
          </h1>
          <p className="text-gray-600 text-base md:text-lg font-medium">Prioritized risks with explainable scoring</p>
        </div>

        {/* Statistics Cards - Enterprise Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-red-500/90 to-rose-500/90 rounded-2xl p-6 text-white shadow-2xl shadow-red-500/20 border border-white/20 hover:shadow-3xl hover:shadow-red-500/30 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-red-100 text-sm font-bold uppercase tracking-wide">Critical (80+)</p>
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
                <p className="text-orange-100 text-sm font-bold uppercase tracking-wide">High (60-79)</p>
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
                <p className="text-amber-100 text-sm font-bold uppercase tracking-wide">Medium (40-59)</p>
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
                <p className="text-blue-100 text-sm font-bold uppercase tracking-wide">Low (0-39)</p>
                <p className="text-4xl font-extrabold drop-shadow-lg">{stats.low}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <i className="fas fa-info text-white text-xl"></i>
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
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Risks Cards - Enterprise Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#00C8FF] border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading risks...</p>
            </div>
          ) : risks.length > 0 ? (
            <div className="divide-y divide-gray-200/30">
              {risks.map((risk, index) => (
                <div 
                  key={risk.id} 
                  className="p-6 md:p-8 hover:bg-white/60 backdrop-blur-sm transition-all duration-300 fade-in group"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3 flex-wrap">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          parseFloat(risk.score) >= 80 ? 'bg-red-100 text-red-600' :
                          parseFloat(risk.score) >= 60 ? 'bg-orange-100 text-orange-600' :
                          parseFloat(risk.score) >= 40 ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <i className="fas fa-exclamation-triangle text-xl"></i>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 flex-1">{risk.vulnerability_title}</h3>
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 ${
                          parseFloat(risk.score) >= 80 ? 'bg-red-50 text-red-700 border-red-200' :
                          parseFloat(risk.score) >= 60 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          parseFloat(risk.score) >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <i className="fas fa-chart-line mr-2"></i>
                          Risk Score: {risk.score}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        <i className="fas fa-network-wired mr-2 text-[#00C8FF]"></i>
                        Asset: <span className="font-bold text-gray-900">{risk.asset_name}</span>
                      </p>
                      {risk.explanation && (
                        <div className="mt-4 p-4 backdrop-blur-sm bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-xl border-2 border-gray-200/50 shadow-md">
                          <p className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                            <i className="fas fa-info-circle mr-2 text-[#00C8FF]"></i>
                            Risk Explanation:
                          </p>
                          <div className="text-xs text-gray-700 font-medium whitespace-pre-wrap bg-white/60 p-3 rounded-lg">
                            {typeof risk.explanation === 'string' ? risk.explanation : JSON.stringify(risk.explanation, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-exclamation-triangle text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No risks found</h3>
              <p className="text-sm text-gray-600">Risks will appear here once calculated</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Risks

