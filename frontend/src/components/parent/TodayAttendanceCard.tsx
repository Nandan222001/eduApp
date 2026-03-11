import React from 'react';
import { Card, CardContent, Box, Typography, Alert, Grid, Paper, Chip } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  HourglassEmpty as HalfDayIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { TodayAttendance, AttendanceStats } from '@/types/parent';
import { format, parseISO } from 'date-fns';

interface TodayAttendanceCardProps {
  attendance: TodayAttendance;
  attendanceStats?: AttendanceStats;
}

export const TodayAttendanceCard: React.FC<TodayAttendanceCardProps> = ({
  attendance,
  attendanceStats,
}) => {
  const getStatusIcon = () => {
    if (attendance.is_present) return <CheckIcon color="success" sx={{ fontSize: 48 }} />;
    if (attendance.is_absent) return <CancelIcon color="error" sx={{ fontSize: 48 }} />;
    if (attendance.is_late) return <ScheduleIcon color="warning" sx={{ fontSize: 48 }} />;
    if (attendance.is_half_day) return <HalfDayIcon color="info" sx={{ fontSize: 48 }} />;
    return <WarningIcon color="disabled" sx={{ fontSize: 48 }} />;
  };

  const getStatusText = () => {
    if (attendance.is_present) return 'Present';
    if (attendance.is_absent) return 'Absent';
    if (attendance.is_late) return 'Late';
    if (attendance.is_half_day) return 'Half Day';
    return 'Not Marked';
  };

  const getStatusColor = () => {
    if (attendance.is_present) return 'success';
    if (attendance.is_absent) return 'error';
    if (attendance.is_late) return 'warning';
    if (attendance.is_half_day) return 'info';
    return 'default';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Today&apos;s Attendance
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {format(parseISO(attendance.date), 'EEEE, MMMM d, yyyy')}
        </Typography>

        <Box sx={{ my: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: attendance.is_absent ? 'error.light' : 'success.light',
              opacity: 0.2,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {getStatusIcon()}
            <Chip
              label={getStatusText()}
              color={getStatusColor()}
              sx={{ fontSize: '1.1rem', fontWeight: 'bold', px: 2 }}
            />
          </Paper>
        </Box>

        {attendance.is_absent && attendance.alert_sent && (
          <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
            <strong>Absence Alert:</strong> You have been notified about today&apos;s absence.
          </Alert>
        )}

        {attendance.remarks && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Remarks:</strong> {attendance.remarks}
          </Alert>
        )}

        {attendanceStats && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Monthly Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {attendanceStats.present_days}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Present Days
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="error.main">
                    {attendanceStats.absent_days}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Absent Days
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {attendanceStats.late_days}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Late Days
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {attendanceStats.half_days}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Half Days
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
