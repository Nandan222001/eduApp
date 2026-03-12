import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { Speed, Timer, Visibility } from '@mui/icons-material';

const PerformanceTab: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['performance-stats'],
    queryFn: () => analyticsApi.getPerformanceStats(),
    refetchInterval: 60000,
  });

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'LCP':
        return <Timer />;
      case 'FCP':
        return <Visibility />;
      default:
        return <Speed />;
    }
  };

  const getMetricColor = (goodCount: number, totalCount: number) => {
    const percentage = (goodCount / totalCount) * 100;
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Web Vitals Performance
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Core Web Vitals and performance metrics from real users
      </Typography>

      <Grid container spacing={3}>
        {stats?.map((stat) => {
          const totalCount = stat.good_count + stat.needs_improvement_count + stat.poor_count;
          return (
            <Grid item xs={12} md={6} lg={4} key={stat.metric_name}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getMetricIcon(stat.metric_name)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {stat.metric_name}
                    </Typography>
                  </Box>

                  <Typography variant="h4" gutterBottom>
                    {stat.avg_value.toFixed(0)}
                    {stat.metric_name === 'CLS' ? '' : 'ms'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      P50: {stat.p50_value.toFixed(0)}
                      {stat.metric_name === 'CLS' ? '' : 'ms'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      P75: {stat.p75_value.toFixed(0)}
                      {stat.metric_name === 'CLS' ? '' : 'ms'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      P95: {stat.p95_value.toFixed(0)}
                      {stat.metric_name === 'CLS' ? '' : 'ms'}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`Good: ${stat.good_count}`}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Needs Work: ${stat.needs_improvement_count}`}
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Poor: ${stat.poor_count}`}
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`${((stat.good_count / totalCount) * 100).toFixed(0)}% Good`}
                      color={getMetricColor(stat.good_count, totalCount)}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default PerformanceTab;
