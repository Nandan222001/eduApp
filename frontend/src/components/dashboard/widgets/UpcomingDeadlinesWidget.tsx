import { useState, useEffect, useCallback } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Alert, Chip } from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { Assignment as AssignmentIcon, MenuBook as ExamIcon } from '@mui/icons-material';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface Deadline {
  id: number;
  title: string;
  type: 'assignment' | 'exam';
  due_date: string;
  subject?: string;
  status: string;
}

interface UpcomingDeadlinesData {
  deadlines: Deadline[];
}

interface UpcomingDeadlinesWidgetProps {
  widget: DashboardWidget;
}

function isUpcomingDeadlinesData(data: unknown): data is UpcomingDeadlinesData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'deadlines' in data &&
    Array.isArray((data as Record<string, unknown>).deadlines)
  );
}

export default function UpcomingDeadlinesWidget({ widget }: UpcomingDeadlinesWidgetProps) {
  const [data, setData] = useState<UpcomingDeadlinesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isUpcomingDeadlinesData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load upcoming deadlines');
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

  if (!data?.deadlines || data.deadlines.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="text.secondary">No upcoming deadlines</Typography>
      </Box>
    );
  }

  return (
    <List dense>
      {data.deadlines.map((deadline) => (
        <ListItem key={deadline.id} sx={{ px: 0 }}>
          <Box display="flex" alignItems="flex-start" gap={1.5} width="100%">
            {deadline.type === 'exam' ? (
              <ExamIcon color="primary" fontSize="small" sx={{ mt: 0.5 }} />
            ) : (
              <AssignmentIcon color="primary" fontSize="small" sx={{ mt: 0.5 }} />
            )}
            <Box flex={1}>
              <Typography variant="body2" fontWeight={500}>
                {deadline.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(deadline.due_date), { addSuffix: true })}
                </Typography>
                {deadline.subject && (
                  <Chip label={deadline.subject} size="small" sx={{ height: 18 }} />
                )}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(deadline.due_date), 'MMM dd')}
            </Typography>
          </Box>
        </ListItem>
      ))}
    </List>
  );
}
