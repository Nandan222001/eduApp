import { Box, Typography, useTheme, alpha } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import { SubjectDistribution } from '@/types/pomodoro';

ChartJS.register(ArcElement, Tooltip, Legend);

interface SubjectDistributionChartProps {
  data: SubjectDistribution[];
}

export default function SubjectDistributionChart({ data }: SubjectDistributionChartProps) {
  const theme = useTheme();

  const colors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
  ];

  const chartData = {
    labels: data.map((item) => item.subject_name),
    datasets: [
      {
        data: data.map((item) => item.total_minutes),
        backgroundColor: data.map((item, index) => item.color || colors[index % colors.length]),
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 13,
          },
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const hours = Math.floor(value / 60);
            const minutes = value % 60;
            const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            const percentage = data[context.dataIndex]?.percentage || 0;
            return `${label}: ${timeStr} (${percentage.toFixed(1)}%)`;
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
          No subject data available yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Start studying to see your subject distribution
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
        <Pie data={chartData} options={options} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {data.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 1.5,
              bgcolor: alpha(item.color || colors[index % colors.length], 0.1),
              borderRadius: 1,
              minWidth: 100,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {item.subject_name}
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {Math.floor(item.total_minutes / 60)}h {item.total_minutes % 60}m
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.session_count} sessions
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
