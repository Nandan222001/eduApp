import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { LocalFireDepartment as FireIcon } from '@mui/icons-material';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface StudyStreakData {
  current_streak: number;
  longest_streak: number;
  total_days: number;
}

interface StudyStreakWidgetProps {
  widget: DashboardWidget;
}

function isStudyStreakData(data: unknown): data is StudyStreakData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'current_streak' in data &&
    typeof (data as Record<string, unknown>).current_streak === 'number' &&
    'longest_streak' in data &&
    typeof (data as Record<string, unknown>).longest_streak === 'number' &&
    'total_days' in data &&
    typeof (data as Record<string, unknown>).total_days === 'number'
  );
}

export default function StudyStreakWidget({ widget }: StudyStreakWidgetProps) {
  const [data, setData] = useState<StudyStreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isStudyStreakData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load study streak');
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

  return (
    <Box textAlign="center" py={2}>
      <FireIcon sx={{ fontSize: 64, color: 'warning.main', mb: 1 }} />
      <Typography variant="h3" fontWeight={600} color="warning.main">
        {data?.current_streak || 0}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Day Streak
      </Typography>
      <Box display="flex" justifyContent="center" gap={3}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {data?.longest_streak || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Longest
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {data?.total_days || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Days
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
