import { Box, Typography, useTheme } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { HourlyProductivity } from '@/types/pomodoro';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ProductivityByHourChartProps {
  data: HourlyProductivity[];
}

export default function ProductivityByHourChart({ data }: ProductivityByHourChartProps) {
  const theme = useTheme();

  const filteredData = data.filter((item) => item.focus_minutes > 0);

  const chartData = {
    labels: filteredData.map((item) => {
      const hour = item.hour % 12 || 12;
      const period = item.hour < 12 ? 'AM' : 'PM';
      return `${hour}${period}`;
    }),
    datasets: [
      {
        label: 'Focus Time (minutes)',
        data: filteredData.map((item) => item.focus_minutes),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y || 0;
            const hours = Math.floor(value / 60);
            const minutes = Math.floor(value % 60);
            const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            return `Focus time: ${timeStr}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: function (value) {
            return `${value}m`;
          },
        },
      },
    },
  };

  if (filteredData.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No productivity data available yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Complete study sessions to see your most productive hours
        </Typography>
      </Box>
    );
  }

  const mostProductiveHour = filteredData.reduce((max, item) =>
    item.focus_minutes > max.focus_minutes ? item : max
  );

  const hour = mostProductiveHour.hour % 12 || 12;
  const period = mostProductiveHour.hour < 12 ? 'AM' : 'PM';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Bar data={chartData} options={options} height={80} />
      </Box>
      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Most Productive Time
        </Typography>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          {hour}:00 {period}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.floor(mostProductiveHour.focus_minutes)} minutes average
        </Typography>
      </Box>
    </Box>
  );
}
