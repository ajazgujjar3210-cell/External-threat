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
  // Ensure we have valid data
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No asset data available</p>
      </div>
    )
  }

  // Group ALL assets by type - dynamically discover all types
  const typeCounts = {}
  const typeLabels = {}
  
  // Count ALL assets by their actual type
  assets.forEach(asset => {
    const type = asset.asset_type
    if (type) {
      if (!typeCounts[type]) {
        typeCounts[type] = 0
        // Create human-readable label
        typeLabels[type] = type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
      typeCounts[type]++
    } else {
      // Handle assets without type
      if (!typeCounts['unknown']) {
        typeCounts['unknown'] = 0
        typeLabels['unknown'] = 'Unknown Type'
      }
      typeCounts['unknown']++
    }
  })
  
  // Build arrays for chart - include ALL types found
  const labels = []
  const counts = []
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(34, 197, 94, 0.8)',    // Green
    'rgba(245, 158, 11, 0.8)',   // Amber
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(14, 165, 233, 0.8)',   // Sky
    'rgba(168, 85, 247, 0.8)',   // Violet
    'rgba(251, 146, 60, 0.8)',   // Orange
    'rgba(20, 184, 166, 0.8)',   // Teal
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(217, 70, 239, 0.8)',   // Fuchsia
  ]
  const borderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(14, 165, 233, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(251, 146, 60, 1)',
    'rgba(20, 184, 166, 1)',
    'rgba(99, 102, 241, 1)',
    'rgba(217, 70, 239, 1)',
  ]
  
  // Sort by count (descending) for better visualization
  const sortedTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])
  
  sortedTypes.forEach((type, index) => {
    labels.push(typeLabels[type])
    counts.push(typeCounts[type])
  })

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Assets Discovered',
        data: counts,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: borderColors.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} assets`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  )
}

export default AssetDiscoveryChart


