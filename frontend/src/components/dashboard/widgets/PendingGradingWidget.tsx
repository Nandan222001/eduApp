import { useState, useEffect, useCallback } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Alert, Chip } from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface PendingGrading {
  id: number;
  assignment_title: string;
  submission_count: number;
  grade?: string;
  section?: string;
  due_date: string;
}

interface PendingGradingData {
  pending: PendingGrading[];
  total_count: number;
}

interface PendingGradingWidgetProps {
  widget: DashboardWidget;
}

function isPendingGradingData(data: unknown): data is PendingGradingData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'pending' in data &&
    Array.isArray((data as Record<string, unknown>).pending) &&
    'total_count' in data &&
    typeof (data as Record<string, unknown>).total_count === 'number'
  );
}

export default function PendingGradingWidget({ widget }: PendingGradingWidgetProps) {
  const [data, setData] = useState<PendingGradingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isPendingGradingData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load pending grading');
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

  if (!data?.pending || data.pending.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="text.secondary">No pending grading</Typography>
      </Box>
    );
  }

  return (
    <List dense>
      {data.pending.map((item) => (
        <ListItem key={item.id} sx={{ px: 0 }}>
          <Box display="flex" alignItems="flex-start" gap={1.5} width="100%">
            <AssignmentIcon color="primary" fontSize="small" sx={{ mt: 0.5 }} />
            <Box flex={1}>
              <Typography variant="body2" fontWeight={500}>
                {item.assignment_title}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Chip
                  label={`${item.submission_count} submissions`}
                  size="small"
                  color="warning"
                  sx={{ height: 20 }}
                />
                {item.grade && (
                  <Chip
                    label={`${item.grade} ${item.section || ''}`}
                    size="small"
                    sx={{ height: 18 }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </ListItem>
      ))}
    </List>
  );
}
