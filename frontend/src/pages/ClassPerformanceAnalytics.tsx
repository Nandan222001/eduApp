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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Group as StudentsIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  ClassScoreTrendsChart,
  StudentDistributionHistogram,
  SubjectDifficultyAnalysis,
  PerformersTable,
} from '@/components/analytics';
import { analyticsApi } from '@/api/analytics';
import type { ClassPerformanceAnalytics } from '@/types/analytics';
import { subDays, subMonths } from 'date-fns';

export default function ClassPerformanceAnalytics() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ClassPerformanceAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months' | '6months'>('30days');
  const [selectedClass, setSelectedClass] = useState<number>(1);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

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

        const data = await analyticsApi.getClassPerformanceAnalytics(
          selectedClass,
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
  }, [selectedClass, dateRange]);

  const handleClassChange = (event: SelectChangeEvent<number>) => {
    setSelectedClass(event.target.value as number);
  };

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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Class Performance Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analytics.grade} - {analytics.section} • Teacher: {analytics.teacher_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Class</InputLabel>
              <Select value={selectedClass} onChange={handleClassChange} label="Class">
                <MenuItem value={1}>Grade 10 - A</MenuItem>
                <MenuItem value={2}>Grade 10 - B</MenuItem>
                <MenuItem value={3}>Grade 9 - A</MenuItem>
              </Select>
            </FormControl>
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
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StudentsIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="body2" color="text.secondary">
                  Total Students
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700}>
                {analytics.total_students}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SchoolIcon sx={{ color: theme.palette.success.main }} />
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {analytics.class_statistics.averageScore.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon sx={{ color: theme.palette.info.main }} />
                <Typography variant="body2" color="text.secondary">
                  Attendance Rate
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {analytics.class_statistics.attendanceRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.dark, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ color: theme.palette.warning.main }} />
                <Typography variant="body2" color="text.secondary">
                  Assignment Rate
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {analytics.class_statistics.assignmentCompletionRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <ClassScoreTrendsChart data={analytics.score_trends} />
        </Grid>

        <Grid item xs={12} md={6}>
          <StudentDistributionHistogram data={analytics.student_distribution} />
        </Grid>

        <Grid item xs={12} md={6}>
          <SubjectDifficultyAnalysis data={analytics.subject_difficulty} />
        </Grid>

        <Grid item xs={12}>
          <PerformersTable
            topPerformers={analytics.top_performers}
            bottomPerformers={analytics.bottom_performers}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
