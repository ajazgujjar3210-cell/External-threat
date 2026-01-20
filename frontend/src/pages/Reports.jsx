import { useState } from 'react'
import axios from 'axios'

const Reports = () => {
  const [reportType, setReportType] = useState('inventory')
  const [format, setFormat] = useState('pdf')
  const [loading, setLoading] = useState(false)
  const [recentReports, setRecentReports] = useState([
    { id: 1, name: 'Asset Inventory Report', type: 'inventory', format: 'pdf', date: new Date().toISOString(), size: '2.4 MB' },
    { id: 2, name: 'Vulnerability Summary', type: 'vulnerabilities', format: 'excel', date: new Date(Date.now() - 86400000).toISOString(), size: '1.8 MB' },
    { id: 3, name: 'Risk Assessment Q4', type: 'risk', format: 'pdf', date: new Date(Date.now() - 172800000).toISOString(), size: '3.2 MB' },
  ])

  const reportTypes = [
    { value: 'inventory', label: 'Asset Inventory', description: 'Complete list of all discovered assets', icon: 'fa-server' },
    { value: 'risk', label: 'Risk Summary', description: 'Risk assessment and prioritization', icon: 'fa-chart-line' },
    { value: 'vulnerabilities', label: 'Vulnerabilities', description: 'All detected security vulnerabilities', icon: 'fa-bug' },
    { value: 'iso27001', label: 'ISO 27001 Compliance', description: 'Information security management compliance', icon: 'fa-certificate' },
    { value: 'pci_dss', label: 'PCI DSS Compliance', description: 'Payment card industry data security', icon: 'fa-credit-card' },
    { value: 'sbp', label: 'SBP Compliance', description: 'State Bank of Pakistan regulatory compliance', icon: 'fa-building-columns' },
  ]

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: 'fa-file-pdf', color: 'text-red-500' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: 'fa-file-excel', color: 'text-green-500' },
    { value: 'csv', label: 'CSV File', icon: 'fa-file-csv', color: 'text-blue-500' },
  ]

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/reports/generate/', {
        params: { type: reportType, format },
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}_report.${format === 'excel' ? 'xlsx' : format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      // Add to recent reports
      const newReport = {
        id: Date.now(),
        name: `${reportTypes.find(r => r.value === reportType)?.label} Report`,
        type: reportType,
        format: format,
        date: new Date().toISOString(),
        size: 'Generating...'
      }
      setRecentReports([newReport, ...recentReports.slice(0, 4)])
    } catch (error) {
      console.error('Error generating report:', error)
      alert(error.response?.data?.error || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const getFormatIcon = (format) => {
    const option = formatOptions.find(f => f.value === format)
    return option ? option.icon : 'fa-file'
  }

  const getFormatColor = (format) => {
    const option = formatOptions.find(f => f.value === format)
    return option ? option.color : 'text-slate-500'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Generate and download compliance and security reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Type Selection */}
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-file-lines text-primary-500"></i>
              Select Report Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    reportType === type.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      reportType === type.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      <i className={`fa-solid ${type.icon}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${
                        reportType === type.value
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {type.description}
                      </p>
                    </div>
                    {reportType === type.value && (
                      <i className="fa-solid fa-circle-check text-primary-500"></i>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-file-export text-primary-500"></i>
              Select Format
            </h2>
            <div className="flex flex-wrap gap-3">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 ${
                    format === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <i className={`fa-solid ${option.icon} text-xl ${option.color}`}></i>
                  <span className={`text-sm font-medium ${
                    format === option.value
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {option.label}
                  </span>
                  {format === option.value && (
                    <i className="fa-solid fa-circle-check text-primary-500 ml-auto"></i>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Ready to generate
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {reportTypes.find(r => r.value === reportType)?.label} in {formatOptions.find(f => f.value === format)?.label} format
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-download"></i>
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Reports Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clock text-primary-500"></i>
              Recent Reports
            </h2>
            
            {recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center`}>
                        <i className={`fa-solid ${getFormatIcon(report.format)} ${getFormatColor(report.format)}`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {report.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                            {report.format}
                          </span>
                        </div>
                      </div>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                        <i className="fa-solid fa-download text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <i className="fa-solid fa-file-circle-question text-slate-400"></i>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No recent reports
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card p-6 mt-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-simple text-primary-500"></i>
              Report Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Reports This Month</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Total Downloads</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">48</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Most Generated</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Inventory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
