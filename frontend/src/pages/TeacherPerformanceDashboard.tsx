import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
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
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';
import { TeacherDashboardData } from '@/api/teachers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TeacherPerformanceDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setDashboardData({
          teacher_id: parseInt(id),
          teacher_name: 'John Doe',
          total_classes: 8,
          total_students: 245,
          class_averages: [
            {
              class_name: 'Class 10',
              section: 'A',
              subject: 'Mathematics',
              average_score: 78.5,
              student_count: 35,
            },
            {
              class_name: 'Class 10',
              section: 'B',
              subject: 'Mathematics',
              average_score: 82.3,
              student_count: 32,
            },
            {
              class_name: 'Class 11',
              section: 'A',
              subject: 'Mathematics',
              average_score: 75.8,
              student_count: 30,
            },
            {
              class_name: 'Class 11',
              section: 'B',
              subject: 'Mathematics',
              average_score: 80.2,
              student_count: 28,
            },
          ],
          workload_distribution: [
            { week: 'Week 1', hours: 25, assignments: 8, classes: 20 },
            { week: 'Week 2', hours: 28, assignments: 10, classes: 22 },
            { week: 'Week 3', hours: 24, assignments: 7, classes: 20 },
            { week: 'Week 4', hours: 26, assignments: 9, classes: 21 },
          ],
          subject_performance: [
            { subject: 'Mathematics', average_score: 79.2, classes: 4, students: 125 },
            { subject: 'Physics', average_score: 81.5, classes: 2, students: 60 },
            { subject: 'Chemistry', average_score: 77.8, classes: 2, students: 60 },
          ],
          recent_activities: [
            {
              type: 'assignment',
              description: 'Graded Assignment: Algebra Quiz',
              date: '2024-01-15',
            },
            { type: 'class', description: 'Conducted Class: Trigonometry', date: '2024-01-14' },
            { type: 'exam', description: 'Created Exam: Mid-term Math', date: '2024-01-13' },
          ],
        });
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Dashboard data not available</Alert>
      </Box>
    );
  }

  const workloadChartData = {
    labels: dashboardData.workload_distribution.map((w) => w.week),
    datasets: [
      {
        label: 'Hours',
        data: dashboardData.workload_distribution.map((w) => w.hours),
        backgroundColor: alpha(theme.palette.primary.main, 0.7),
      },
      {
        label: 'Assignments',
        data: dashboardData.workload_distribution.map((w) => w.assignments),
        backgroundColor: alpha(theme.palette.success.main, 0.7),
      },
      {
        label: 'Classes',
        data: dashboardData.workload_distribution.map((w) => w.classes),
        backgroundColor: alpha(theme.palette.info.main, 0.7),
      },
    ],
  };

  const performanceChartData = {
    labels: dashboardData.subject_performance.map((s) => s.subject),
    datasets: [
      {
        label: 'Average Score',
        data: dashboardData.subject_performance.map((s) => s.average_score),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
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
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/admin/users/teachers/${id}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Performance Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dashboardData.teacher_name}
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {dashboardData.total_classes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Classes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  <PeopleIcon sx={{ color: theme.palette.success.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {dashboardData.total_students}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                  }}
                >
                  <AssignmentIcon sx={{ color: theme.palette.info.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {dashboardData.workload_distribution.reduce((sum, w) => sum + w.assignments, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assignments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                  }}
                >
                  <ScheduleIcon sx={{ color: theme.palette.warning.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {dashboardData.workload_distribution[
                      dashboardData.workload_distribution.length - 1
                    ]?.hours || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weekly Hours
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Workload Distribution" subheader="Weekly breakdown of activities" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar data={workloadChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader title="Subject Performance" subheader="Average scores by subject" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line data={performanceChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader title="Class Averages" subheader="Performance across different classes" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Students</TableCell>
                      <TableCell align="center">Average Score</TableCell>
                      <TableCell align="center">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.class_averages.map((classData, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {classData.class_name} - {classData.section}
                          </Typography>
                        </TableCell>
                        <TableCell>{classData.subject}</TableCell>
                        <TableCell align="center">{classData.student_count}</TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={classData.average_score >= 75 ? 'success.main' : 'error.main'}
                          >
                            {classData.average_score.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={classData.average_score}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                              color={classData.average_score >= 75 ? 'success' : 'error'}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader title="Recent Activities" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dashboardData.recent_activities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip label={activity.type} size="small" color="primary" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{activity.description}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
