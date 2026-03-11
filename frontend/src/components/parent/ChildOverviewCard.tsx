import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import type { ChildOverview } from '@/types/parent';

interface ChildOverviewCardProps {
  child: ChildOverview;
}

export const ChildOverviewCard: React.FC<ChildOverviewCardProps> = ({ child }) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'warning';
    return 'error';
  };

  const getAttendanceStatus = (status?: string) => {
    switch (status) {
      case 'present':
        return { label: 'Present Today', color: 'success' as const };
      case 'absent':
        return { label: 'Absent Today', color: 'error' as const };
      case 'late':
        return { label: 'Late Today', color: 'warning' as const };
      case 'half_day':
        return { label: 'Half Day', color: 'info' as const };
      default:
        return { label: 'Not Marked', color: 'default' as const };
    }
  };

  const attendanceStatus = getAttendanceStatus(child.attendance_status);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar src={child.photo_url} sx={{ width: 100, height: 100, mb: 2 }}>
            <PersonIcon sx={{ fontSize: 60 }} />
          </Avatar>
          <Typography variant="h5" gutterBottom align="center">
            {child.first_name} {child.last_name}
          </Typography>
          {child.admission_number && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Roll No: {child.admission_number}
            </Typography>
          )}
          {child.grade_name && child.section_name && (
            <Chip
              icon={<SchoolIcon />}
              label={`${child.grade_name} ${child.section_name}`}
              color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
          <Chip
            label={attendanceStatus.label}
            color={attendanceStatus.color}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Attendance
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color={getAttendanceColor(child.attendance_percentage)}
              >
                {child.attendance_percentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={child.attendance_percentage}
              color={getAttendanceColor(child.attendance_percentage)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {child.average_score !== null && child.average_score !== undefined && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <TrendingUpIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                {child.average_score.toFixed(1)}%
              </Typography>
            </Box>
          )}

          {child.current_rank && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <TrophyIcon fontSize="small" color="warning" />
                <Typography variant="body2" color="text.secondary">
                  Class Rank
                </Typography>
              </Box>
              <Typography variant="h6">
                {child.current_rank}
                {child.total_students && ` / ${child.total_students}`}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
