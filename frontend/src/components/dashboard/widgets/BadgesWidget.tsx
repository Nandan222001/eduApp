import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Typography, CircularProgress, Alert, Tooltip } from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
}

interface BadgesData {
  badges: Badge[];
}

interface BadgesWidgetProps {
  widget: DashboardWidget;
}

function isBadgesData(data: unknown): data is BadgesData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'badges' in data &&
    Array.isArray((data as Record<string, unknown>).badges)
  );
}

export default function BadgesWidget({ widget }: BadgesWidgetProps) {
  const [data, setData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isBadgesData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load badges');
    } finally {
      setLoading(false);
    }
  }, [widget.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (!data?.badges || data.badges.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="text.secondary">No badges earned yet</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {data.badges.map((badge) => (
        <Grid item xs={4} key={badge.id}>
          <Tooltip title={badge.description}>
            <Box textAlign="center">
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'primary.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 0.5,
                }}
              >
                {badge.icon_url ? (
                  <img src={badge.icon_url} alt={badge.name} style={{ width: 40, height: 40 }} />
                ) : (
                  <TrophyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                )}
              </Box>
              <Typography variant="caption" display="block" fontWeight={500}>
                {badge.name}
              </Typography>
            </Box>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );
}
