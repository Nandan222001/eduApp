import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  LinearProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { WeeklyProgress } from '@/types/parent';

interface WeeklyProgressChartProps {
  progress: WeeklyProgress;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ progress }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <EventIcon color="primary" />
          <Typography variant="h6">Weekly Progress Summary</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {format(parseISO(progress.week_start), 'MMM d')} -{' '}
          {format(parseISO(progress.week_end), 'MMM d, yyyy')}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <CheckIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {progress.present_days}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Present Days
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
              <AssignmentIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="primary.main">
                {progress.assignments_completed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <AssignmentIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {progress.assignments_pending}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
              <TrendingUpIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {progress.average_score ? `${progress.average_score.toFixed(1)}%` : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Score
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {progress.subject_performance.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" gutterBottom>
              Subject-wise Performance
            </Typography>
            <Box sx={{ mt: 2 }}>
              {progress.subject_performance.map((subject, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">{subject.subject_name}</Typography>
                    <Box display="flex" gap={1}>
                      <Chip
                        label={`${subject.completed_assignments}/${subject.total_assignments}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${subject.average_score.toFixed(1)}%`}
                        size="small"
                        color={
                          subject.average_score >= 75
                            ? 'success'
                            : subject.average_score >= 60
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={subject.average_score}
                    color={
                      subject.average_score >= 75
                        ? 'success'
                        : subject.average_score >= 60
                          ? 'warning'
                          : 'error'
                    }
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Attendance: {subject.attendance_percentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending: {subject.pending_assignments}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};
