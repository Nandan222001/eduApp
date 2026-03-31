import React from 'react';
import { Card, CardContent, Typography, Box, Alert, Chip, Paper } from '@mui/material';
import {
  CompareArrows as CompareIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
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
import type { PerformanceComparison } from '@/types/parent';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PerformanceComparisonChartProps {
  comparison: PerformanceComparison;
}

export const PerformanceComparisonChart: React.FC<PerformanceComparisonChartProps> = ({
  comparison,
}) => {
  const getImprovementIcon = () => {
    if (comparison.overall_improvement > 0) {
      return <TrendingUpIcon color="success" />;
    }
    if (comparison.overall_improvement < 0) {
      return <TrendingDownIcon color="error" />;
    }
    return null;
  };

  const getImprovementColor = () => {
    if (comparison.overall_improvement > 0) return 'success';
    if (comparison.overall_improvement < 0) return 'error';
    return 'default';
  };

  const chartData = {
    labels: comparison.current_term_data.map((item) => item.subject_name),
    datasets: [
      {
        label: comparison.previous_term,
        data: comparison.current_term_data.map((current) => {
          const previous = comparison.previous_term_data.find(
            (p) => p.subject_name === current.subject_name
          );
          return previous?.percentage || 0;
        }),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: comparison.current_term,
        data: comparison.current_term_data.map((item) => item.percentage),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: number | string) => `${value}%`,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <CompareIcon color="primary" />
          <Typography variant="h6">Performance Comparison</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {comparison.current_term} vs {comparison.previous_term}
        </Typography>

        {comparison.current_term_data.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Not enough data available for comparison
          </Alert>
        ) : (
          <>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mt: 2,
                bgcolor: comparison.overall_improvement >= 0 ? 'success.light' : 'error.light',
                opacity: 0.2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              {getImprovementIcon()}
              <Box textAlign="center">
                <Typography variant="h4" color={getImprovementColor()}>
                  {comparison.overall_improvement > 0 ? '+' : ''}
                  {comparison.overall_improvement.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Overall Change
                </Typography>
              </Box>
            </Paper>

            {comparison.improvement_subjects.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Improved Subjects
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {comparison.improvement_subjects.map((subject) => (
                    <Chip
                      key={subject}
                      label={subject}
                      color="success"
                      size="small"
                      icon={<TrendingUpIcon />}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {comparison.declined_subjects.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Needs Attention
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {comparison.declined_subjects.map((subject) => (
                    <Chip
                      key={subject}
                      label={subject}
                      color="error"
                      size="small"
                      icon={<TrendingDownIcon />}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3, height: 300 }}>
              <Bar data={chartData} options={chartOptions} />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};
