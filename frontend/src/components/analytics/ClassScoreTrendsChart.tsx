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
  TooltipItem,
} from 'chart.js';
import { ClassScoreTrend } from '@/types/analytics';

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

interface ClassScoreTrendsChartProps {
  data: ClassScoreTrend[];
}

export default function ClassScoreTrendsChart({ data }: ClassScoreTrendsChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    const labels = data.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Average Score',
          data: data.map((d) => d.average),
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}30`,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Median Score',
          data: data.map((d) => d.median),
          borderColor: theme.palette.secondary.main,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Highest Score',
          data: data.map((d) => d.highest),
          borderColor: theme.palette.success.main,
          backgroundColor: 'transparent',
          borderDash: [2, 2],
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Lowest Score',
          data: data.map((d) => d.lowest),
          borderColor: theme.palette.error.main,
          backgroundColor: 'transparent',
          borderDash: [2, 2],
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
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
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            return `${context.dataset.label}: ${context.parsed.y !== null ? context.parsed.y.toFixed(1) : 0}%`;
          },
        },
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
        title="Class Score Trends"
        subheader="Average, median, highest, and lowest scores over time"
      />
      <CardContent>
        <Box sx={{ height: 350 }}>
          <Line data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}
