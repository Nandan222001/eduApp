import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import {
  TrendingUp as ImprovingIcon,
  TrendingDown as DecliningIcon,
  Remove as StableIcon,
  EmojiEvents as RankIcon,
} from '@mui/icons-material';
import {
  SubjectTrendsChart,
  AttendanceHeatmap,
  AssignmentSubmissionRate,
  ExamPerformanceRadar,
  ChapterMasteryGauges,
} from '@/components/analytics';
import { analyticsApi } from '@/api/analytics';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';
import type { StudentPerformanceAnalytics } from '@/types/analytics';
import { useAuth } from '@/hooks/useAuth';
import { subDays, subMonths } from 'date-fns';

export default function StudentPerformanceAnalytics() {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudentPerformanceAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months' | '6months'>('30days');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const studentId = user?.id ? parseInt(user.id, 10) : 1;

        const endDate = new Date();
        let startDate: Date;

        switch (dateRange) {
          case '7days':
            startDate = subDays(endDate, 7);
            break;
          case '30days':
            startDate = subDays(endDate, 30);
            break;
          case '3months':
            startDate = subMonths(endDate, 3);
            break;
          case '6months':
            startDate = subMonths(endDate, 6);
            break;
        }

        const data = isDemoUser()
          ? await demoDataApi.analytics.getStudentPerformanceAnalytics(
              studentId,
              startDate.toISOString(),
              endDate.toISOString()
            )
          : await analyticsApi.getStudentPerformanceAnalytics(
              studentId,
              startDate.toISOString(),
              endDate.toISOString()
            );
        setAnalytics(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, dateRange]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Analytics data not available'}</Alert>
      </Box>
    );
  }

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <ImprovingIcon sx={{ color: theme.palette.success.main }} />;
      case 'declining':
        return <DecliningIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <StableIcon sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return theme.palette.success.main;
      case 'declining':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Performance Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {analytics.student_name} • {analytics.grade} - {analytics.section}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={dateRange}
          exclusive
          onChange={(_, value) => value && setDateRange(value)}
          size="small"
        >
          <ToggleButton value="7days">7 Days</ToggleButton>
          <ToggleButton value="30days">30 Days</ToggleButton>
          <ToggleButton value="3months">3 Months</ToggleButton>
          <ToggleButton value="6months">6 Months</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Performance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h3" fontWeight={700} color="primary">
                  {analytics.overall_performance.averageScore.toFixed(1)}%
                </Typography>
                {getTrendIcon(analytics.overall_performance.trend)}
              </Box>
              <Chip
                label={analytics.overall_performance.trend.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: alpha(getTrendColor(analytics.overall_performance.trend), 0.1),
                  color: getTrendColor(analytics.overall_performance.trend),
                  fontWeight: 600,
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {analytics.overall_performance.rank && (
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Class Rank
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h3" fontWeight={700} color="warning.main">
                    #{analytics.overall_performance.rank}
                  </Typography>
                  <RankIcon sx={{ color: theme.palette.warning.main }} />
                </Box>
                {analytics.overall_performance.totalStudents && (
                  <Typography variant="caption" color="text.secondary">
                    out of {analytics.overall_performance.totalStudents} students
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <SubjectTrendsChart data={analytics.subject_trends} />
        </Grid>

        <Grid item xs={12} md={6}>
          <AttendanceHeatmap data={analytics.attendance_calendar} />
        </Grid>

        <Grid item xs={12} md={6}>
          <AssignmentSubmissionRate data={analytics.assignment_stats} />
        </Grid>

        <Grid item xs={12}>
          <ExamPerformanceRadar data={analytics.exam_comparisons} />
        </Grid>

        <Grid item xs={12}>
          <ChapterMasteryGauges data={analytics.chapter_mastery} />
        </Grid>
      </Grid>
    </Box>
  );
}
