import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
} from '@mui/icons-material';
import { EngagementStatistic } from '@/types/analytics';

interface EngagementStatisticsProps {
  data: EngagementStatistic[];
}

export default function EngagementStatistics({ data }: EngagementStatisticsProps) {
  const theme = useTheme();

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <StableIcon sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const formatValue = (value: number, metric: string) => {
    if (metric.toLowerCase().includes('rate') || metric.toLowerCase().includes('percentage')) {
      return `${value.toFixed(1)}%`;
    }
    if (metric.toLowerCase().includes('time') || metric.toLowerCase().includes('duration')) {
      return `${value.toFixed(0)}h`;
    }
    return value.toLocaleString();
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader title="Engagement Statistics" subheader="Key performance indicators and trends" />
      <CardContent>
        <Grid container spacing={2}>
          {data.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.metric}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    borderColor: getTrendColor(stat.trend),
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {stat.metric}
                  </Typography>
                  {getTrendIcon(stat.trend)}
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {formatValue(stat.value, stat.metric)}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: alpha(getTrendColor(stat.trend), 0.1),
                  }}
                >
                  <Typography variant="caption" fontWeight={600} color={getTrendColor(stat.trend)}>
                    {stat.change > 0 ? '+' : ''}
                    {stat.change.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    vs last period
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
