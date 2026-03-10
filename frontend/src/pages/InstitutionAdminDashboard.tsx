import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import institutionAdminApi, { DashboardResponse } from '@/api/institutionAdmin';
import { useAuth } from '@/hooks/useAuth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function InstitutionAdminDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await institutionAdminApi.getDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const performanceChartData = {
    labels: dashboardData.performance_trends.map((trend) => trend.month),
    datasets: [
      {
        label: 'Average Score (%)',
        data: dashboardData.performance_trends.map((trend) => trend.average_score),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Attendance Rate (%)',
        data: dashboardData.performance_trends.map((trend) => trend.attendance_rate),
        borderColor: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Institution Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.firstName}! Here&apos;s what&apos;s happening today.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          href="/admin/communication/announcements"
        >
          New Announcement
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={dashboardData.overview.student_count}
            icon={<PeopleIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teachers"
            value={dashboardData.overview.teacher_count}
            icon={<SchoolIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Attendance"
            value={`${dashboardData.attendance_summary.percentage.toFixed(1)}%`}
            icon={<CheckCircleIcon />}
            color={theme.palette.info.main}
            subtitle={`${dashboardData.attendance_summary.present}/${dashboardData.attendance_summary.total_students} present`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={dashboardData.pending_tasks.length}
            icon={<AssignmentIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader
              title="Today's Attendance Summary"
              subheader={new Date(dashboardData.attendance_summary.date).toLocaleDateString()}
            />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {dashboardData.attendance_summary.present}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main" fontWeight={700}>
                      {dashboardData.attendance_summary.absent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      {dashboardData.attendance_summary.late}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" fontWeight={700}>
                      {dashboardData.attendance_summary.total_students}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.attendance_summary.percentage}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {dashboardData.attendance_summary.percentage.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Quick Statistics" />
            <CardContent>
              <Grid container spacing={2}>
                {dashboardData.quick_statistics.map((stat, index) => (
                  <Grid item xs={6} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Recent Exam Results" />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="center">Avg %</TableCell>
                      <TableCell align="center">Passed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recent_exam_results.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No recent exam results
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboardData.recent_exam_results.map((exam) => (
                        <TableRow key={exam.exam_id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {exam.exam_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(exam.date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={exam.exam_type} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={exam.average_percentage >= 60 ? 'success.main' : 'error.main'}
                            >
                              {exam.average_percentage.toFixed(1)}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {exam.passed_students}/{exam.total_students}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Upcoming Events" />
            <CardContent>
              <List>
                {dashboardData.upcoming_events.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No upcoming events"
                      secondary="There are no scheduled events in the next 30 days"
                    />
                  </ListItem>
                ) : (
                  dashboardData.upcoming_events.map((event) => (
                    <ListItem key={event.id} divider>
                      <ListItemIcon>
                        <CalendarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <>
                            <Typography variant="caption" component="span" display="block">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Typography>
                            {event.description && (
                              <Typography variant="caption" color="text.secondary">
                                {event.description}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader title="Performance Trends" subheader="Monthly performance over time" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line data={performanceChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Pending Tasks" />
            <CardContent>
              <List>
                {dashboardData.pending_tasks.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="All caught up!"
                      secondary="No pending tasks at the moment"
                    />
                  </ListItem>
                ) : (
                  dashboardData.pending_tasks.map((task) => (
                    <ListItem
                      key={task.id}
                      divider
                      sx={{
                        borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                        mb: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.count}
                              size="small"
                              color={task.priority === 'high' ? 'error' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {task.description}
                            </Typography>
                            {task.due_date && (
                              <Typography variant="caption" color="error.main">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
