import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const TopVulnerabilitiesChart = ({ vulnerabilities }) => {
  // Handle empty or invalid data
  if (!vulnerabilities || !Array.isArray(vulnerabilities) || vulnerabilities.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <i className="fa-solid fa-ranking-star text-2xl text-slate-400 dark:text-slate-500"></i>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No vulnerability data available</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Scan your assets to detect vulnerabilities</p>
      </div>
    )
  }

  // Sort by CVSS score and take top 10
  const topVulns = [...vulnerabilities]
    .filter(v => v.cvss != null)
    .sort((a, b) => (b.cvss || 0) - (a.cvss || 0))
    .slice(0, 10)

  if (topVulns.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <i className="fa-solid fa-shield text-2xl text-green-500"></i>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No vulnerabilities found</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your assets appear to be secure</p>
      </div>
    )
  }

  // Truncate labels
  const labels = topVulns.map(v => {
    const title = v.title || 'Unknown'
    return title.length > 25 ? title.substring(0, 25) + '...' : title
  })

  const cvssScores = topVulns.map(v => v.cvss || 0)
  const severities = topVulns.map(v => v.severity || 'low')

  // Color based on severity
  const getColorForSeverity = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.9)', border: 'rgba(220, 38, 38, 1)' }
      case 'high':
        return { bg: 'rgba(245, 158, 11, 0.9)', border: 'rgba(217, 119, 6, 1)' }
      case 'medium':
        return { bg: 'rgba(59, 130, 246, 0.9)', border: 'rgba(37, 99, 235, 1)' }
      default:
        return { bg: 'rgba(34, 197, 94, 0.9)', border: 'rgba(22, 163, 74, 1)' }
    }
  }

  const bgColors = severities.map(s => getColorForSeverity(s).bg)
  const borderColors = severities.map(s => getColorForSeverity(s).border)

  const data = {
    labels,
    datasets: [
      {
        label: 'CVSS Score',
        data: cvssScores,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        titleFont: {
          size: 13,
          weight: '600',
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 6,
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex
            return topVulns[index]?.title || 'Unknown'
          },
          label: function (context) {
            const index = context.dataIndex
            const cvss = context.parsed.x
            const severity = severities[index]
            return [
              ` CVSS Score: ${cvss.toFixed(1)}`,
              ` Severity: ${severity.charAt(0).toUpperCase() + severity.slice(1)}`
            ]
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 2,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#94a3b8',
        },
        title: {
          display: true,
          text: 'CVSS Score',
          font: {
            size: 11,
            weight: '500',
            family: "'Inter', sans-serif",
          },
          color: '#64748b',
          padding: { top: 8 },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
            family: "'Inter', sans-serif",
          },
          color: '#64748b',
        },
      },
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
  }

  return (
    <div className="h-full">
      <Bar data={data} options={options} />
    </div>
  )
}

export default TopVulnerabilitiesChart
