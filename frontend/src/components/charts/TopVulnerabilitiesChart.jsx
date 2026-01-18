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
  // Get top 10 vulnerabilities by CVSS score
  const topVulns = [...vulnerabilities]
    .sort((a, b) => parseFloat(b.cvss || 0) - parseFloat(a.cvss || 0))
    .slice(0, 10)

  const labels = topVulns.map(v => v.title?.substring(0, 30) + (v.title?.length > 30 ? '...' : '') || 'Unknown')
  const cvssScores = topVulns.map(v => parseFloat(v.cvss || 0))

  // Color based on CVSS score
  const backgroundColors = cvssScores.map(score => {
    if (score >= 9.0) return 'rgba(239, 68, 68, 0.8)'      // Critical - Red
    if (score >= 7.0) return 'rgba(245, 158, 11, 0.8)'     // High - Amber
    if (score >= 4.0) return 'rgba(59, 130, 246, 0.8)'      // Medium - Blue
    return 'rgba(34, 197, 94, 0.8)'                         // Low - Green
  })

  const borderColors = cvssScores.map(score => {
    if (score >= 9.0) return 'rgba(239, 68, 68, 1)'
    if (score >= 7.0) return 'rgba(245, 158, 11, 1)'
    if (score >= 4.0) return 'rgba(59, 130, 246, 1)'
    return 'rgba(34, 197, 94, 1)'
  })

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'CVSS Score',
        data: cvssScores,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  }

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `CVSS: ${context.parsed.x.toFixed(1)}`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="h-96">
      <Bar data={data} options={options} />
    </div>
  )
}

export default TopVulnerabilitiesChart


