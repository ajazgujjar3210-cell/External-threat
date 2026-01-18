import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const RiskDistributionChart = ({ risks }) => {
  // Categorize risks by score ranges
  const critical = risks.filter(r => parseFloat(r.score) >= 80).length
  const high = risks.filter(r => parseFloat(r.score) >= 60 && parseFloat(r.score) < 80).length
  const medium = risks.filter(r => parseFloat(r.score) >= 40 && parseFloat(r.score) < 60).length
  const low = risks.filter(r => parseFloat(r.score) < 40).length

  const data = {
    labels: ['Critical (80+)', 'High (60-79)', 'Medium (40-59)', 'Low (<40)'],
    datasets: [
      {
        label: 'Risk Distribution',
        data: [critical, high, medium, low],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',      // Red for critical
          'rgba(245, 158, 11, 0.8)',     // Amber for high
          'rgba(59, 130, 246, 0.8)',    // Blue for medium
          'rgba(34, 197, 94, 0.8)',     // Green for low
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
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

export default RiskDistributionChart


