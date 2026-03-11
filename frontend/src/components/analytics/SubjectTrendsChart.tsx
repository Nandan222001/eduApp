import { useMemo } from 'react';
import { Card, CardHeader, CardContent, Box, useTheme } from '@mui/material';
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
} from 'chart.js';
import { SubjectPerformanceTrend } from '@/types/analytics';

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

interface SubjectTrendsChartProps {
  data: SubjectPerformanceTrend[];
}

export default function SubjectTrendsChart({ data }: SubjectTrendsChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    const labels =
      data[0]?.data.map((d) =>
        new Date(d.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      ) || [];

    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ];

    const datasets = data.map((subject, index) => ({
      label: subject.subject,
      data: subject.data.map((d) => d.score),
      borderColor: colors[index % colors.length],
      backgroundColor: `${colors[index % colors.length]}20`,
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    }));

    return { labels, datasets };
  }, [data, theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value: number | string) => `${value}%`,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Subject-wise Performance Trends"
        subheader="Track your progress across subjects over time"
      />
      <CardContent>
        <Box sx={{ height: 350 }}>
          <Line data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}
