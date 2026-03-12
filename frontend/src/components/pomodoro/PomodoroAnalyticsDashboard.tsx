import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalFireDepartment as StreakIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import pomodoroApi from '@/api/pomodoro';
import { PomodoroAnalytics } from '@/types/pomodoro';
import SubjectDistributionChart from './SubjectDistributionChart';
import ProductivityByHourChart from './ProductivityByHourChart';
import StudyStreakCalendar from './StudyStreakCalendar';
import FocusTimeTrendChart from './FocusTimeTrendChart';

export default function PomodoroAnalyticsDashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PomodoroAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const studentId = user?.id ? parseInt(user.id, 10) : 1;
      const data = await pomodoroApi.getAnalytics(studentId, {
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      setAnalytics({
        total_focus_time_minutes: 1250,
        total_sessions: 50,
        completed_sessions: 45,
        interrupted_sessions: 5,
        current_streak: 7,
        longest_streak: 14,
        subject_distribution: [
          {
            subject_name: 'Mathematics',
            total_minutes: 400,
            session_count: 16,
            percentage: 32,
            color: '#2196F3',
          },
          {
            subject_name: 'Physics',
            total_minutes: 350,
            session_count: 14,
            percentage: 28,
            color: '#4CAF50',
          },
          {
            subject_name: 'Chemistry',
            total_minutes: 300,
            session_count: 12,
            percentage: 24,
            color: '#FF9800',
          },
          {
            subject_name: 'Biology',
            total_minutes: 200,
            session_count: 8,
            percentage: 16,
            color: '#9C27B0',
          },
        ],
        hourly_productivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          focus_minutes: Math.random() * 120,
          session_count: Math.floor(Math.random() * 5),
          average_focus_score: Math.random() * 100,
        })),
        daily_focus_time: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total_minutes: Math.floor(Math.random() * 180),
          session_count: Math.floor(Math.random() * 8),
          completed_sessions: Math.floor(Math.random() * 7),
        })),
        weekly_summary: {
          current_week_minutes: 320,
          previous_week_minutes: 280,
          change_percentage: 14.3,
          average_daily_minutes: 45.7,
          most_productive_day: 'Wednesday',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return <Alert severity="error">Failed to load analytics data. Please try again later.</Alert>;
  }

  const completionRate =
    analytics.total_sessions > 0
      ? (analytics.completed_sessions / analytics.total_sessions) * 100
      : 0;

  return (
    <Box>
      {error && (
        <Alert severity="warning" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Study Analytics
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={loadAnalytics}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Focus Time
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {formatTime(analytics.total_focus_time_minutes)}
                  </Typography>
                </Box>
                <TimerIcon sx={{ fontSize: 40, color: alpha(theme.palette.primary.main, 0.3) }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics.total_sessions}
                  </Typography>
                  <Chip
                    label={`${completionRate.toFixed(0)}% completed`}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={completionRate}
                    size={40}
                    thickness={4}
                    sx={{ color: theme.palette.success.main }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" fontWeight={600}>
                      {completionRate.toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Streak
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {analytics.current_streak} days
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Longest: {analytics.longest_streak} days
                  </Typography>
                </Box>
                <StreakIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This Week
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatTime(analytics.weekly_summary.current_week_minutes)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    {analytics.weekly_summary.change_percentage >= 0 ? (
                      <>
                        <TrendingUpIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          +{analytics.weekly_summary.change_percentage.toFixed(1)}%
                        </Typography>
                      </>
                    ) : (
                      <>
                        <TrendingDownIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                        <Typography variant="caption" color="error.main" fontWeight={600}>
                          {analytics.weekly_summary.change_percentage.toFixed(1)}%
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Subject Distribution" subheader="Study time by subject" />
            <CardContent>
              <SubjectDistributionChart data={analytics.subject_distribution} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Most Productive Time" subheader="Focus time by hour of day" />
            <CardContent>
              <ProductivityByHourChart data={analytics.hourly_productivity} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Daily Focus Time Trend"
              subheader="Your study consistency over time"
            />
            <CardContent>
              <FocusTimeTrendChart data={analytics.daily_focus_time} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Study Streak Calendar"
              subheader="Track your daily study consistency"
            />
            <CardContent>
              <StudyStreakCalendar data={analytics.daily_focus_time} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
