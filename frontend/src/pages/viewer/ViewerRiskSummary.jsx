import { useState, useEffect } from 'react'
// Layout is now handled by ProtectedRoute
import axios from 'axios'

const ViewerRiskSummary = () => {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRisks()
  }, [])

  const fetchRisks = async () => {
    try {
      const response = await axios.get('/api/risks/top/?limit=50')
      const data = response.data || []
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

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Summary</h1>
          <p className="text-gray-600 mt-1">Prioritized risks with explainable scoring (Read-Only)</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading risks...</p>
            </div>
          ) : risks.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {risks.map((risk) => (
                <div key={risk.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{risk.vulnerability_title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(parseFloat(risk.score))}`}>
                          Risk Score: {risk.score}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Asset: <span className="font-medium">{risk.asset_name}</span>
                      </p>
                      {risk.explanation && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Risk Explanation:</p>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(risk.explanation, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No risks found</h3>
              <p className="text-sm text-gray-600">Risks will appear here once calculated</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ViewerRiskSummary


