import { Box, Card, CardContent, Typography, Grid, Stack, LinearProgress } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import { GoalAnalytics as GoalAnalyticsType } from '@/types/goals';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface GoalAnalyticsProps {
  analytics: GoalAnalyticsType;
}

export default function GoalAnalytics({ analytics }: GoalAnalyticsProps) {
  const goalTypeData = {
    labels: ['Performance', 'Behavioral', 'Skill'],
    datasets: [
      {
        data: [
          analytics.goalsByType.performance,
          analytics.goalsByType.behavioral,
          analytics.goalsByType.skill,
        ],
        backgroundColor: ['#1976d2', '#9c27b0', '#0288d1'],
        borderWidth: 0,
      },
    ],
  };

  const goalStatusData = {
    labels: ['Not Started', 'In Progress', 'Completed', 'Overdue'],
    datasets: [
      {
        data: [
          analytics.goalsByStatus.not_started,
          analytics.goalsByStatus.in_progress,
          analytics.goalsByStatus.completed,
          analytics.goalsByStatus.overdue,
        ],
        backgroundColor: ['#9e9e9e', '#0288d1', '#2e7d32', '#d32f2f'],
        borderWidth: 0,
      },
    ],
  };

  const progressData = {
    labels: analytics.monthlyProgress.map((m) => m.month),
    datasets: [
      {
        label: 'Goals Created',
        data: analytics.monthlyProgress.map((m) => m.goalsCreated),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        fill: true,
      },
      {
        label: 'Goals Completed',
        data: analytics.monthlyProgress.map((m) => m.goalsCompleted),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
      },
    ],
  };

  const impactData = {
    labels: ['Academic Performance', 'Attendance Rate', 'Assignment Completion'],
    datasets: [
      {
        label: 'Impact Correlation',
        data: [
          analytics.impactCorrelation.academicPerformance,
          analytics.impactCorrelation.attendanceRate,
          analytics.impactCorrelation.assignmentCompletion,
        ],
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: '#1976d2',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Goals
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics.totalGoals}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                  }}
                >
                  <TrophyIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {analytics.completedGoals}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'success.light',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                  }}
                >
                  <TrendingUpIcon sx={{ color: 'success.main', fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {analytics.completionRate}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'info.light',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                  }}
                >
                  <SpeedIcon sx={{ color: 'info.main', fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Avg Progress
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics.averageProgress}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'warning.light',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                  }}
                >
                  <ChartIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={analytics.averageProgress}
                sx={{ mt: 2, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Goals by Type
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <Doughnut data={goalTypeData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Goals by Status
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <Doughnut data={goalStatusData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Progress Trend
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <Line data={progressData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Impact Correlation
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                How goals correlate with academic performance and engagement metrics
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <Bar
                  data={impactData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => `${value}%`,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
