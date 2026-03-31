import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface Goal {
  id: number;
  title: string;
  description: string;
  progress_percentage: number;
  target: number;
  current: number;
  is_completed: boolean;
}

interface GoalTrackerData {
  goals: Goal[];
}

interface GoalTrackerWidgetProps {
  widget: DashboardWidget;
}

function isGoalTrackerData(data: unknown): data is GoalTrackerData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'goals' in data &&
    Array.isArray((data as Record<string, unknown>).goals)
  );
}

export default function GoalTrackerWidget({ widget }: GoalTrackerWidgetProps) {
  const [data, setData] = useState<GoalTrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isGoalTrackerData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load goals');
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

  if (!data?.goals || data.goals.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="text.secondary">No active goals</Typography>
      </Box>
    );
  }

  return (
    <List dense>
      {data.goals.map((goal) => (
        <ListItem
          key={goal.id}
          sx={{ px: 0, pb: 2, flexDirection: 'column', alignItems: 'flex-start' }}
        >
          <Box display="flex" alignItems="center" gap={1} width="100%" mb={1}>
            <Typography variant="body2" fontWeight={500} flex={1}>
              {goal.title}
            </Typography>
            {goal.is_completed && <CheckCircleIcon color="success" fontSize="small" />}
          </Box>
          <Box width="100%" mb={0.5}>
            <LinearProgress
              variant="determinate"
              value={goal.progress_percentage}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {goal.current} / {goal.target} ({goal.progress_percentage}%)
          </Typography>
        </ListItem>
      ))}
    </List>
  );
}
