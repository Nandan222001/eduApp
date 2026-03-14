import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  VideoCall as VideoIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  peerTutoringApi,
  TutorStats,
  UpcomingSession,
  TutorPerformanceMetrics,
} from '@/api/peerTutoring';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(color, 0.1),
              color,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function TutorDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TutorStats | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<TutorPerformanceMetrics | null>(
    null
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, sessionsData, metricsData] = await Promise.all([
        peerTutoringApi.getTutorStats(),
        peerTutoringApi.getTutorUpcomingSessions(),
        peerTutoringApi.getTutorPerformanceMetrics(),
      ]);
      setStats(statsData);
      setUpcomingSessions(sessionsData);
      setPerformanceMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats || !performanceMetrics) {
    return <Typography>Failed to load dashboard data</Typography>;
  }

  const ratingsChartData = {
    labels: performanceMetrics.ratings_over_time.map((r) => new Date(r.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Rating',
        data: performanceMetrics.ratings_over_time.map((r) => r.rating),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const subjectsChartData = {
    labels: performanceMetrics.sessions_by_subject.map((s) => s.subject),
    datasets: [
      {
        label: 'Sessions',
        data: performanceMetrics.sessions_by_subject.map((s) => s.count),
        backgroundColor: [
          alpha(theme.palette.primary.main, 0.8),
          alpha(theme.palette.secondary.main, 0.8),
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
        ],
      },
    ],
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Tutor Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your tutoring performance and manage sessions
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ScheduleIcon />}
            title="Total Sessions"
            value={stats.total_sessions}
            subtitle={`${stats.total_hours} hours`}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<StarIcon />}
            title="Average Rating"
            value={stats.average_rating.toFixed(1)}
            subtitle={`${stats.total_reviews} reviews`}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CalendarIcon />}
            title="Upcoming Sessions"
            value={stats.upcoming_sessions}
            subtitle={`${stats.completed_this_month} this month`}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon />}
            title="Retention Rate"
            value={`${stats.student_retention_rate}%`}
            subtitle={`${stats.cancellation_rate}% cancellation`}
            color={theme.palette.success.main}
          />
        </Grid>

        {stats.total_earnings !== undefined && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<MoneyIcon />}
                title="Total Earnings"
                value={`$${stats.total_earnings.toFixed(2)}`}
                subtitle={`$${stats.earnings_this_month?.toFixed(2)} this month`}
                color={theme.palette.success.main}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Upcoming Sessions
              </Typography>
              <List>
                {upcomingSessions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <VideoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No upcoming sessions
                    </Typography>
                  </Box>
                ) : (
                  upcomingSessions.map((session, index) => (
                    <Box key={session.id}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <Avatar src={session.student_photo_url} sx={{ mr: 2 }}>
                          {session.student_name.charAt(0)}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {session.student_name}
                              </Typography>
                              <Chip label={session.subject} size="small" />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {session.topic}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(session.scheduled_at).toLocaleString()} •{' '}
                                {session.duration_minutes} min
                              </Typography>
                            </>
                          }
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VideoIcon />}
                          href={session.meeting_link}
                          target="_blank"
                        >
                          Join
                        </Button>
                      </ListItem>
                      {index < upcomingSessions.length - 1 && <Divider />}
                    </Box>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Student Satisfaction
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Knowledge</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {performanceMetrics.student_satisfaction.knowledge.toFixed(1)}/5
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(performanceMetrics.student_satisfaction.knowledge / 5) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Communication</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {performanceMetrics.student_satisfaction.communication.toFixed(1)}/5
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(performanceMetrics.student_satisfaction.communication / 5) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Punctuality</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {performanceMetrics.student_satisfaction.punctuality.toFixed(1)}/5
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(performanceMetrics.student_satisfaction.punctuality / 5) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Overall
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {performanceMetrics.student_satisfaction.overall.toFixed(1)}/5
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(performanceMetrics.student_satisfaction.overall / 5) * 100}
                    sx={{ height: 10, borderRadius: 4 }}
                    color="primary"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Rating Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={ratingsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        min: 0,
                        max: 5,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Sessions by Subject
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={subjectsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {performanceMetrics.peak_hours.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Peak Hours
                </Typography>
                <List>
                  {performanceMetrics.peak_hours.slice(0, 5).map((peak, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={`${peak.hour}:00 - ${peak.hour + 1}:00`}
                        secondary={`${peak.sessions} sessions`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={
                          (peak.sessions /
                            Math.max(...performanceMetrics.peak_hours.map((p) => p.sessions))) *
                          100
                        }
                        sx={{ width: 100, height: 8, borderRadius: 4 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
