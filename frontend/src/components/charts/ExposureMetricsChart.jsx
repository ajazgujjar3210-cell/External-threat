import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const ExposureMetricsChart = ({ assets, vulnerabilities }) => {
  const totalAssets = assets.length
  const exposedAssets = vulnerabilities
    .map(v => v.asset_id)
    .filter((value, index, self) => self.indexOf(value) === index).length
  const unknownAssets = assets.filter(a => a.is_unknown).length
  const knownAssets = totalAssets - unknownAssets

  const data = {
    labels: ['Exposed Assets', 'Known Assets', 'Unknown Assets'],
    datasets: [
      {
        label: 'Exposure Metrics',
        data: [
          exposedAssets,
          knownAssets - exposedAssets,
          unknownAssets,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',      // Red for exposed
          'rgba(34, 197, 94, 0.8)',      // Green for known
          'rgba(245, 158, 11, 0.8)',     // Amber for unknown
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  )
}

export default ExposureMetricsChart


