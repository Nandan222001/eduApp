import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Typography, CircularProgress, Alert } from '@mui/material';
import { Assignment, TrendingUp, EmojiEvents } from '@mui/icons-material';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface StatItem {
  icon: string;
  label: string;
  value: number;
  color: string;
}

interface QuickStatsData {
  stats: StatItem[];
}

interface QuickStatsWidgetProps {
  widget: DashboardWidget;
}

function isQuickStatsData(data: unknown): data is QuickStatsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'stats' in data &&
    Array.isArray((data as Record<string, unknown>).stats)
  );
}

export default function QuickStatsWidget({ widget }: QuickStatsWidgetProps) {
  const [data, setData] = useState<QuickStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isQuickStatsData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load quick stats');
    } finally {
      setLoading(false);
    }
  }, [widget.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'assignment':
        return <Assignment fontSize="large" />;
      case 'trending_up':
        return <TrendingUp fontSize="large" />;
      case 'trophy':
        return <EmojiEvents fontSize="large" />;
      default:
        return <Assignment fontSize="large" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data?.stats || data.stats.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="text.secondary">No stats available</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {data.stats.map((stat) => (
        <Grid item xs={4} key={stat.label}>
          <Box textAlign="center">
            <Box color={stat.color}>{getIcon(stat.icon)}</Box>
            <Typography variant="h6" fontWeight={600} mt={1}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.label}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
