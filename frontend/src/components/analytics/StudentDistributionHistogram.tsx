import { useMemo } from 'react';
import { Card, CardHeader, CardContent, Box, useTheme } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { StudentDistributionBin } from '@/types/analytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StudentDistributionHistogramProps {
  data: StudentDistributionBin[];
}

export default function StudentDistributionHistogram({ data }: StudentDistributionHistogramProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    const labels = data.map((bin) => bin.range);

    return {
      labels,
      datasets: [
        {
          label: 'Number of Students',
          data: data.map((bin) => bin.count),
          backgroundColor: data.map((_, index) => {
            const colors = [
              theme.palette.error.main,
              theme.palette.warning.main,
              theme.palette.info.main,
              theme.palette.success.light,
              theme.palette.success.main,
            ];
            return colors[index % colors.length];
          }),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [data, theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            const bin = data[context.dataIndex];
            return [`Students: ${context.parsed.y}`, `Percentage: ${bin?.percentage.toFixed(1)}%`];
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
          font: {
            weight: 'bold' as const,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Students',
          color: theme.palette.text.primary,
          font: {
            weight: 'bold' as const,
          },
        },
      },
    },
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Student Performance Distribution"
        subheader="Distribution of students across score ranges"
      />
      <CardContent>
        <Box sx={{ height: 350 }}>
          <Bar data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}
