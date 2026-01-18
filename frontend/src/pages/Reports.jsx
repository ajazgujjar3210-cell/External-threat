import { useState } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const Reports = () => {
  const [reportType, setReportType] = useState('inventory')
  const [format, setFormat] = useState('pdf')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/reports/generate/', {
        params: { type: reportType, format },
        responseType: 'blob', // Important for file downloads
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}_report.${format === 'excel' ? 'xlsx' : format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      alert('Report downloaded successfully!')
    } catch (error) {
      console.error('Error generating report:', error)
      const errorMsg = error.response?.data?.error || 
                      error.message || 
                      'Failed to generate report'
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and download compliance reports</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="inventory">Asset Inventory</option>
                <option value="risk">Risk Summary</option>
                <option value="vulnerabilities">Vulnerabilities</option>
                <option value="iso27001">ISO 27001 Compliance</option>
                <option value="pci_dss">PCI DSS Compliance</option>
                <option value="sbp">SBP Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#00C8FF] to-[#0066FF] text-white font-semibold rounded-lg shadow-lg hover:from-[#00B8E6] hover:to-[#0055E6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <i className="fas fa-download mr-2"></i>
                  Generate Report
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Reports

