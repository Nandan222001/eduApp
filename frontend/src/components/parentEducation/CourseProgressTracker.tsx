import React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayCircleIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { Enrollment } from '@/types/parentEducation';

interface CourseProgressTrackerProps {
  enrollment: Enrollment;
}

export const CourseProgressTracker: React.FC<CourseProgressTrackerProps> = ({ enrollment }) => {
  const theme = useTheme();

  const completionRate = enrollment.progress_percentage;
  const lessonsCompleted = enrollment.completed_lessons;
  const totalLessons = enrollment.total_lessons;
  const lessonsRemaining = totalLessons - lessonsCompleted;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Your Progress
      </Typography>

      {/* Overall Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Course Completion
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary">
            {completionRate}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={completionRate}
          sx={{
            height: 12,
            borderRadius: 6,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 6,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {lessonsCompleted} of {totalLessons} lessons completed
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            <CardContent>
              <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {lessonsCompleted}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            }}
          >
            <CardContent>
              <PlayCircleIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {lessonsRemaining}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            }}
          >
            <CardContent>
              <TimerIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {enrollment.course?.duration_minutes
                  ? Math.ceil(enrollment.course.duration_minutes / 60)
                  : 0}
                h
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              textAlign: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <CardContent>
              <TrophyIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>
                {enrollment.status === 'completed' ? '✓' : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Certificate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Next Lesson */}
      {enrollment.current_lesson && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Up Next
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {enrollment.current_lesson.title}
          </Typography>
        </Box>
      )}

      {/* Completion Message */}
      {enrollment.status === 'completed' && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            borderRadius: 1,
            textAlign: 'center',
          }}
        >
          <TrophyIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" fontWeight={700} color="success.main" gutterBottom>
            Course Completed!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed on{' '}
            {enrollment.completed_at && new Date(enrollment.completed_at).toLocaleDateString()}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CourseProgressTracker;
