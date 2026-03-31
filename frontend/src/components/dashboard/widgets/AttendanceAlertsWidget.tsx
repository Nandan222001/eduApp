import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface AttendanceAlert {
  id: number;
  student_name: string;
  attendance_percentage: number;
  alert_type: string;
  absent_days: number;
  grade?: string;
  section?: string;
}

interface AttendanceAlertsData {
  alerts: AttendanceAlert[];
}

interface AttendanceAlertsWidgetProps {
  widget: DashboardWidget;
}

function isAttendanceAlertsData(data: unknown): data is AttendanceAlertsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'alerts' in data &&
    Array.isArray((data as Record<string, unknown>).alerts)
  );
}

export default function AttendanceAlertsWidget({ widget }: AttendanceAlertsWidgetProps) {
  const [data, setData] = useState<AttendanceAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isAttendanceAlertsData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load attendance alerts');
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

  if (!data?.alerts || data.alerts.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="text.secondary">No attendance alerts</Typography>
      </Box>
    );
  }

  return (
    <List dense>
      {data.alerts.map((alert) => (
        <ListItem key={alert.id} sx={{ px: 0 }}>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" fontWeight={500}>
                  {alert.student_name}
                </Typography>
                <Chip
                  label={`${alert.attendance_percentage}%`}
                  size="small"
                  color={alert.alert_type === 'critical' ? 'error' : 'warning'}
                  sx={{ height: 20 }}
                />
              </Box>
            }
            secondary={
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {alert.absent_days} days absent
                </Typography>
                {alert.grade && (
                  <Chip
                    label={`${alert.grade} ${alert.section || ''}`}
                    size="small"
                    sx={{ height: 18 }}
                  />
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
