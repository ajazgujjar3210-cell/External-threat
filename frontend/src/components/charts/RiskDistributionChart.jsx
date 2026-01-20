import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const RiskDistributionChart = ({ risks }) => {
  // Handle empty or invalid data
  if (!risks || !Array.isArray(risks) || risks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <i className="fa-solid fa-chart-pie text-2xl text-slate-400 dark:text-slate-500"></i>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No risk data available</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Run a vulnerability scan to see risk distribution</p>
      </div>
    )
  }

  // Check if all values are 0
  const totalRisks = risks.reduce((sum, r) => sum + (r.count || 0), 0)
  if (totalRisks === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <i className="fa-solid fa-shield text-2xl text-green-500"></i>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No risks detected</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your assets are in good health</p>
      </div>
    )
  }

  const riskColors = {
    high: {
      bg: 'rgba(239, 68, 68, 0.9)',
      border: 'rgba(239, 68, 68, 1)',
      hover: 'rgba(220, 38, 38, 1)',
    },
    medium: {
      bg: 'rgba(245, 158, 11, 0.9)',
      border: 'rgba(245, 158, 11, 1)',
      hover: 'rgba(217, 119, 6, 1)',
    },
    low: {
      bg: 'rgba(34, 197, 94, 0.9)',
      border: 'rgba(34, 197, 94, 1)',
      hover: 'rgba(22, 163, 74, 1)',
    },
  }

  const labels = []
  const dataValues = []
  const bgColors = []
  const borderColors = []
  const hoverColors = []

  risks.forEach((risk) => {
    const level = risk.level?.toLowerCase() || 'low'
    const colors = riskColors[level] || riskColors.low
    labels.push(level.charAt(0).toUpperCase() + level.slice(1) + ' Risk')
    dataValues.push(risk.count || 0)
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
            const percentage = ((value / total) * 100).toFixed(1)
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
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalRisks}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Risks</p>
        </div>
      </div>
    </div>
  )
}

export default RiskDistributionChart
