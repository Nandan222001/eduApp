import { Box, Typography, useTheme } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { DailyFocusTime } from '@/types/pomodoro';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FocusTimeTrendChartProps {
  data: DailyFocusTime[];
}

export default function FocusTimeTrendChart({ data }: FocusTimeTrendChartProps) {
  const theme = useTheme();

  const last30Days = data.slice(-30);

  const chartData = {
    labels: last30Days.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Focus Time (minutes)',
        data: last30Days.map((item) => item.total_minutes),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}33`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
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
            const dataPoint = last30Days[context.dataIndex];
            return [
              `Focus time: ${timeStr}`,
              `Sessions: ${dataPoint?.session_count || 0}`,
              `Completed: ${dataPoint?.completed_sessions || 0}`,
            ];
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
          maxRotation: 45,
          minRotation: 45,
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
            const hours = Math.floor(Number(value) / 60);
            const minutes = Number(value) % 60;
            if (hours > 0) {
              return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
          },
        },
      },
    },
  };

  if (data.length === 0) {
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
          No focus time data available yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Start studying to track your daily progress
        </Typography>
      </Box>
    );
  }

  const totalMinutes = last30Days.reduce((sum, item) => sum + item.total_minutes, 0);
  const averageMinutes = totalMinutes / last30Days.length;
  const totalSessions = last30Days.reduce((sum, item) => sum + item.session_count, 0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Line data={chartData} options={options} height={80} />
      </Box>
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Box
          sx={{
            textAlign: 'center',
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            minWidth: 150,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Average Daily
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {Math.floor(averageMinutes / 60)}h {Math.floor(averageMinutes % 60)}m
          </Typography>
        </Box>
        <Box
          sx={{
            textAlign: 'center',
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            minWidth: 150,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Sessions
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {totalSessions}
          </Typography>
        </Box>
        <Box
          sx={{
            textAlign: 'center',
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            minWidth: 150,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Active Days
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {last30Days.filter((d) => d.total_minutes > 0).length}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
