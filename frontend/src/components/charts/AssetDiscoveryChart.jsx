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

const AssetDiscoveryChart = ({ assets }) => {
  // Handle empty or invalid data
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <i className="fa-solid fa-chart-bar text-2xl text-slate-400 dark:text-slate-500"></i>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No asset data available</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Assets will appear here after discovery</p>
      </div>
    )
  }

  const totalAssets = assets.reduce((sum, a) => sum + (a.count || 0), 0)

  // Process and sort assets by count
  const processedAssets = assets
    .filter(a => a.count > 0)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8) // Limit to top 8 for better visualization

  const labels = processedAssets.map(asset => {
    const type = asset.asset_type || 'Unknown'
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  })

  const counts = processedAssets.map(a => a.count || 0)
  const percentages = processedAssets.map(a => 
    totalAssets > 0 ? ((a.count || 0) / totalAssets * 100).toFixed(1) : 0
  )

  // Modern gradient colors
  const gradientColors = [
    { start: 'rgba(59, 130, 246, 0.9)', end: 'rgba(37, 99, 235, 0.9)' },   // Blue
    { start: 'rgba(139, 92, 246, 0.9)', end: 'rgba(109, 40, 217, 0.9)' },  // Purple
    { start: 'rgba(236, 72, 153, 0.9)', end: 'rgba(219, 39, 119, 0.9)' },  // Pink
    { start: 'rgba(34, 197, 94, 0.9)', end: 'rgba(22, 163, 74, 0.9)' },    // Green
    { start: 'rgba(245, 158, 11, 0.9)', end: 'rgba(217, 119, 6, 0.9)' },   // Amber
    { start: 'rgba(239, 68, 68, 0.9)', end: 'rgba(220, 38, 38, 0.9)' },    // Red
    { start: 'rgba(20, 184, 166, 0.9)', end: 'rgba(13, 148, 136, 0.9)' },  // Teal
    { start: 'rgba(99, 102, 241, 0.9)', end: 'rgba(79, 70, 229, 0.9)' },   // Indigo
  ]

  const bgColors = labels.map((_, i) => gradientColors[i % gradientColors.length].start)
  const borderColors = labels.map((_, i) => gradientColors[i % gradientColors.length].end)

  const data = {
    labels,
    datasets: [
      {
        label: 'Assets',
        data: percentages,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: borderColors,
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
          label: function (context) {
            const index = context.dataIndex
            const count = counts[index]
            const percentage = context.parsed.x
            return ` ${count} assets (${percentage}%)`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          callback: (value) => `${value}%`,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#94a3b8',
        },
        title: {
          display: true,
          text: 'Percentage of Total Assets',
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
            size: 11,
            weight: '500',
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Total: {totalAssets} assets
        </span>
      </div>
      <div className="h-[calc(100%-24px)]">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

export default AssetDiscoveryChart
