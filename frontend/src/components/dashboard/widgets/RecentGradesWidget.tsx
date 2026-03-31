import { useState, useEffect, useCallback } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Alert, Chip } from '@mui/material';
import { format } from 'date-fns';
import dashboardWidgetsApi, { DashboardWidget } from '@/api/dashboardWidgets';

interface Grade {
  id: number;
  subject: string;
  exam_title: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  exam_date: string;
  grade?: string;
}

interface RecentGradesData {
  grades: Grade[];
  average_percentage: number;
}

interface RecentGradesWidgetProps {
  widget: DashboardWidget;
}

function isRecentGradesData(data: unknown): data is RecentGradesData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'grades' in data &&
    Array.isArray((data as Record<string, unknown>).grades) &&
    'average_percentage' in data &&
    typeof (data as Record<string, unknown>).average_percentage === 'number'
  );
}

export default function RecentGradesWidget({ widget }: RecentGradesWidgetProps) {
  const [data, setData] = useState<RecentGradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardWidgetsApi.getWidgetData(widget.id);
      if (isRecentGradesData(response.data)) {
        setData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch {
      setError('Failed to load recent grades');
    } finally {
      setLoading(false);
    }
  }, [widget.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'error';
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

  if (!data?.grades || data.grades.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="text.secondary">No recent grades</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {data.average_percentage !== undefined && (
        <Box mb={2} p={1.5} bgcolor="primary.50" borderRadius={1}>
          <Typography variant="caption" color="text.secondary" display="block">
            Average
          </Typography>
          <Typography variant="h5" fontWeight={600} color="primary.main">
            {data.average_percentage.toFixed(1)}%
          </Typography>
        </Box>
      )}
      <List dense>
        {data.grades.map((grade) => (
          <ListItem key={grade.id} sx={{ px: 0 }}>
            <Box width="100%">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" fontWeight={500}>
                  {grade.subject}
                </Typography>
                <Chip
                  label={`${grade.percentage.toFixed(0)}%`}
                  size="small"
                  color={
                    getGradeColor(grade.percentage) as 'success' | 'primary' | 'warning' | 'error'
                  }
                  sx={{ height: 20 }}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {grade.exam_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(grade.exam_date), 'MMM dd')}
                </Typography>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
