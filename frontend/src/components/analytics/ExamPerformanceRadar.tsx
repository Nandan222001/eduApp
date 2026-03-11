import { useMemo } from 'react';
import { Card, CardHeader, CardContent, Box, useTheme, alpha } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { ExamPerformanceComparison } from '@/types/analytics';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ExamPerformanceRadarProps {
  data: ExamPerformanceComparison[];
}

export default function ExamPerformanceRadar({ data }: ExamPerformanceRadarProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    const labels = data.map((d) => d.subject);

    return {
      labels,
      datasets: [
        {
          label: 'Current Score',
          data: data.map((d) => d.currentScore),
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
          pointBackgroundColor: theme.palette.primary.main,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: theme.palette.primary.main,
        },
        {
          label: 'Previous Score',
          data: data.map((d) => d.previousScore),
          backgroundColor: alpha(theme.palette.secondary.main, 0.2),
          borderColor: theme.palette.secondary.main,
          borderWidth: 2,
          pointBackgroundColor: theme.palette.secondary.main,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: theme.palette.secondary.main,
        },
        {
          label: 'Class Average',
          data: data.map((d) => d.classAverage),
          backgroundColor: alpha(theme.palette.warning.main, 0.2),
          borderColor: theme.palette.warning.main,
          borderWidth: 2,
          pointBackgroundColor: theme.palette.warning.main,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: theme.palette.warning.main,
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
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: theme.palette.text.secondary,
          backdropColor: 'transparent',
        },
        grid: {
          color: theme.palette.divider,
        },
        angleLines: {
          color: theme.palette.divider,
        },
        pointLabels: {
          color: theme.palette.text.primary,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
    },
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Exam Performance Comparison"
        subheader="Compare your scores across subjects"
      />
      <CardContent>
        <Box sx={{ height: 400 }}>
          <Radar data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}
