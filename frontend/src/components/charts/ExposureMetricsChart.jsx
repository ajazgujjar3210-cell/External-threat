import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const ExposureMetricsChart = ({ assets }) => {
  // Handle empty or invalid data
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <i className="fa-solid fa-shield-halved text-2xl text-slate-400 dark:text-slate-500"></i>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No exposure data available</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Asset exposure metrics will appear here</p>
      </div>
    )
  }

  const totalAssets = assets.reduce((sum, a) => sum + (a.count || 0), 0)
  
  if (totalAssets === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <i className="fa-solid fa-server text-2xl text-slate-400 dark:text-slate-500"></i>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No assets discovered</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Run a discovery scan to find assets</p>
      </div>
    )
  }

  const statusColors = {
    exposed: {
      bg: 'rgba(239, 68, 68, 0.9)',
      border: 'rgba(239, 68, 68, 1)',
      hover: 'rgba(220, 38, 38, 1)',
    },
    known: {
      bg: 'rgba(34, 197, 94, 0.9)',
      border: 'rgba(34, 197, 94, 1)',
      hover: 'rgba(22, 163, 74, 1)',
    },
    unknown: {
      bg: 'rgba(245, 158, 11, 0.9)',
      border: 'rgba(245, 158, 11, 1)',
      hover: 'rgba(217, 119, 6, 1)',
    },
  }

  const labels = []
  const dataValues = []
  const bgColors = []
  const borderColors = []
  const hoverColors = []

  assets.forEach((asset) => {
    const status = asset.status?.toLowerCase() || 'unknown'
    const colors = statusColors[status] || statusColors.unknown
    const label = status.charAt(0).toUpperCase() + status.slice(1) + ' Assets'
    labels.push(label)
    dataValues.push(asset.count || 0)
    bgColors.push(colors.bg)
    borderColors.push(colors.border)
    hoverColors.push(colors.hover)
  })

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: bgColors,
        borderColor: borderColors,
        hoverBackgroundColor: hoverColors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '500',
            family: "'Inter', sans-serif",
          },
          color: '#64748b',
        },
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
          label: function (context) {
            const value = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return ` ${value} assets (${percentage}%)`
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutQuart',
    },
  }

  return (
    <div className="h-full relative">
      <Doughnut data={data} options={options} />
      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center -mt-6">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalAssets}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Assets</p>
        </div>
      </div>
    </div>
  )
}

export default ExposureMetricsChart
