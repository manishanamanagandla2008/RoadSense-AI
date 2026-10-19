import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        font: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 11
        },
        boxWidth: 12,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleFont: {
        family: "'Plus Jakarta Sans', sans-serif",
        size: 12,
        weight: 'bold' as const
      },
      bodyFont: {
        family: "'JetBrains Mono', monospace",
        size: 11
      },
      padding: 10,
      cornerRadius: 6,
      boxPadding: 4
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 11
        },
        color: '#64748B'
      }
    },
    y: {
      grid: {
        color: 'rgba(226, 232, 240, 0.8)'
      },
      ticks: {
        font: {
          family: "'JetBrains Mono', monospace",
          size: 11
        },
        color: '#64748B',
        precision: 0
      }
    }
  }
};
