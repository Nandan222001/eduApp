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
import { GradeComparison } from '@/types/analytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GradeComparisonChartProps {
  data: GradeComparison[];
}

export default function GradeComparisonChart({ data }: GradeComparisonChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    const labels = data.map((d) => d.grade);

    return {
      labels,
      datasets: [
        {
          label: 'Average Score',
          data: data.map((d) => d.averageScore),
          backgroundColor: theme.palette.primary.main,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Attendance Rate',
          data: data.map((d) => d.attendanceRate),
          backgroundColor: theme.palette.success.main,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Pass Rate',
          data: data.map((d) => d.passRate),
          backgroundColor: theme.palette.info.main,
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
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
          usePointStyle: true,
          padding: 15,
        },
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
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          },
          afterBody: function (context: TooltipItem<'bar'>[]) {
            const grade = data[context[0].dataIndex];
            return [`Total Students: ${grade.totalStudents}`];
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
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Grade-wise Comparison"
        subheader="Performance metrics across different grades"
      />
      <CardContent>
        <Box sx={{ height: 350 }}>
          <Bar data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}
