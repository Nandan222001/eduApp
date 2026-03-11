import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  PostAdd as PostAddIcon,
  Assessment as AssessmentIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import teachersApi, { TeacherMyDashboardData } from '@/api/teachers';
import { useAuth } from '@/hooks/useAuth';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<TeacherMyDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await teachersApi.getMyDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load dashboard data');
        setDashboardData({
          teacher_id: 1,
          teacher_name: user?.firstName + ' ' + user?.lastName || 'Teacher',
          statistics: {
            total_students: 245,
            pending_grading_count: 18,
            todays_classes: 5,
            this_week_attendance: 92,
          },
          my_classes: [
            {
              class_id: 1,
              class_name: 'Class 10',
              section: 'A',
              subject: 'Mathematics',
              student_count: 35,
              average_score: 78.5,
              room_number: '201',
            },
            {
              class_id: 2,
              class_name: 'Class 10',
              section: 'B',
              subject: 'Mathematics',
              student_count: 32,
              average_score: 82.3,
              room_number: '202',
            },
            {
              class_id: 3,
              class_name: 'Class 11',
              section: 'A',
              subject: 'Mathematics',
              student_count: 30,
              average_score: 75.8,
              room_number: '301',
            },
          ],
          todays_schedule: [
            {
              id: 1,
              time_slot: 'Period 1',
              start_time: '08:00',
              end_time: '08:45',
              class_name: 'Class 10',
              section: 'A',
              subject: 'Mathematics',
              room_number: '201',
              status: 'completed',
            },
            {
              id: 2,
              time_slot: 'Period 3',
              start_time: '09:35',
              end_time: '10:20',
              class_name: 'Class 10',
              section: 'B',
              subject: 'Mathematics',
              room_number: '202',
              status: 'ongoing',
            },
            {
              id: 3,
              time_slot: 'Period 5',
              start_time: '11:10',
              end_time: '11:55',
              class_name: 'Class 11',
              section: 'A',
              subject: 'Mathematics',
              room_number: '301',
              status: 'upcoming',
            },
          ],
          pending_grading: {
            total_count: 18,
            assignments: [
              {
                id: 1,
                title: 'Algebra Quiz 3',
                class_name: 'Class 10',
                section: 'A',
                subject: 'Mathematics',
                submission_count: 28,
                due_date: '2024-01-25',
                priority: 'high',
              },
              {
                id: 2,
                title: 'Trigonometry Assignment',
                class_name: 'Class 10',
                section: 'B',
                subject: 'Mathematics',
                submission_count: 25,
                due_date: '2024-01-27',
                priority: 'medium',
              },
              {
                id: 3,
                title: 'Calculus Problem Set',
                class_name: 'Class 11',
                section: 'A',
                subject: 'Mathematics',
                submission_count: 22,
                due_date: '2024-01-30',
                priority: 'low',
              },
            ],
          },
          recent_submissions: [
            {
              id: 1,
              student_name: 'John Doe',
              assignment_title: 'Algebra Quiz 3',
              class_name: 'Class 10',
              section: 'A',
              submitted_at: '2024-01-20T14:30:00',
              status: 'pending',
            },
            {
              id: 2,
              student_name: 'Jane Smith',
              assignment_title: 'Algebra Quiz 3',
              class_name: 'Class 10',
              section: 'A',
              submitted_at: '2024-01-20T13:45:00',
              status: 'pending',
            },
            {
              id: 3,
              student_name: 'Mike Johnson',
              assignment_title: 'Trigonometry Assignment',
              class_name: 'Class 10',
              section: 'B',
              submitted_at: '2024-01-20T12:20:00',
              status: 'graded',
              score: 85,
            },
          ],
          class_performance: [
            {
              class_name: 'Class 10',
              section: 'A',
              subject: 'Mathematics',
              average_score: 78.5,
              attendance_rate: 94,
              student_count: 35,
            },
            {
              class_name: 'Class 10',
              section: 'B',
              subject: 'Mathematics',
              average_score: 82.3,
              attendance_rate: 96,
              student_count: 32,
            },
            {
              class_name: 'Class 11',
              section: 'A',
              subject: 'Mathematics',
              average_score: 75.8,
              attendance_rate: 89,
              student_count: 30,
            },
          ],
          upcoming_exams: [
            {
              id: 1,
              exam_name: 'Mid-term Examination',
              exam_type: 'Mid-term',
              class_name: 'Class 10',
              section: 'A',
              subject: 'Mathematics',
              date: '2024-02-15',
              duration_minutes: 180,
              total_marks: 100,
            },
            {
              id: 2,
              exam_name: 'Unit Test 4',
              exam_type: 'Unit Test',
              class_name: 'Class 10',
              section: 'B',
              subject: 'Mathematics',
              date: '2024-02-05',
              duration_minutes: 60,
              total_marks: 50,
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const handleMarkAttendance = () => {
    navigate('/teacher/attendance/mark');
  };

  const handleCreateAssignment = () => {
    navigate('/teacher/assignments/create');
  };

  const handlePostAnnouncement = () => {
    navigate('/teacher/announcements/create');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'ongoing':
        return theme.palette.warning.main;
      case 'upcoming':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

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

  const performanceChartData = {
    labels: dashboardData.class_performance.map((c) => `${c.class_name}-${c.section}`),
    datasets: [
      {
        label: 'Average Score (%)',
        data: dashboardData.class_performance.map((c) => c.average_score),
        backgroundColor: alpha(theme.palette.primary.main, 0.7),
      },
      {
        label: 'Attendance (%)',
        data: dashboardData.class_performance.map((c) => c.attendance_rate),
        backgroundColor: alpha(theme.palette.success.main, 0.7),
      },
    ],
  };

  const attendanceData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [
          dashboardData.statistics.this_week_attendance,
          100 - dashboardData.statistics.this_week_attendance,
        ],
        backgroundColor: [
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.error.main, 0.8),
        ],
        borderWidth: 0,
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
        max: 100,
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {dashboardData.teacher_name}! Here&apos;s your day at a glance.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<CheckCircleIcon />} onClick={handleMarkAttendance}>
            Mark Attendance
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={handleCreateAssignment}
          >
            Create Assignment
          </Button>
          <Button variant="contained" startIcon={<PostAddIcon />} onClick={handlePostAnnouncement}>
            Post Announcement
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={dashboardData.statistics.total_students}
            icon={<PeopleIcon />}
            color={theme.palette.primary.main}
            subtitle="Across all classes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Grading"
            value={dashboardData.statistics.pending_grading_count}
            icon={<AssignmentIcon />}
            color={theme.palette.warning.main}
            subtitle="Assignments to review"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Classes"
            value={dashboardData.statistics.todays_classes}
            icon={<ScheduleIcon />}
            color={theme.palette.info.main}
            subtitle="Scheduled periods"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Week's Attendance"
            value={`${dashboardData.statistics.this_week_attendance}%`}
            icon={<TrendingUpIcon />}
            color={theme.palette.success.main}
            subtitle="Average across classes"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader
              title="My Classes Overview"
              subheader="Student count and performance by class"
              action={
                <IconButton onClick={() => navigate('/teacher/classes')}>
                  <ArrowForwardIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                {dashboardData.my_classes.map((classData) => (
                  <Grid item xs={12} sm={6} md={4} key={classData.class_id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[3],
                        },
                      }}
                      onClick={() => navigate(`/teacher/classes/${classData.class_id}`)}
                    >
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {classData.class_name} - {classData.section}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {classData.subject}
                      </Typography>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Students
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {classData.student_count}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Average Score
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color={classData.average_score >= 75 ? 'success.main' : 'warning.main'}
                          >
                            {classData.average_score.toFixed(1)}%
                          </Typography>
                        </Box>
                        {classData.room_number && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              Room
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                              {classData.room_number}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader
              title="Today's Schedule"
              subheader={new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            />
            <CardContent>
              <List sx={{ py: 0 }}>
                {dashboardData.todays_schedule.map((schedule, index) => (
                  <Box key={schedule.id}>
                    <ListItem
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: alpha(getStatusColor(schedule.status), 0.05),
                        border: `1px solid ${alpha(getStatusColor(schedule.status), 0.2)}`,
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {schedule.time_slot}
                          </Typography>
                          <Chip
                            label={schedule.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(schedule.status),
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {schedule.start_time} - {schedule.end_time}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {schedule.class_name}-{schedule.section} • {schedule.subject}
                        </Typography>
                        {schedule.room_number && (
                          <Typography variant="caption" color="text.secondary">
                            Room: {schedule.room_number}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                    {index < dashboardData.todays_schedule.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader
              title={`Pending Grading (${dashboardData.pending_grading.total_count})`}
              subheader="Assignments awaiting review"
              action={
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/teacher/assignments/grading')}
                >
                  View All
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Assignment</TableCell>
                      <TableCell align="center">Class</TableCell>
                      <TableCell align="center">Submissions</TableCell>
                      <TableCell align="center">Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.pending_grading.assignments.map((assignment) => (
                      <TableRow
                        key={assignment.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/teacher/assignments/${assignment.id}/grade`)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 4,
                                height: 30,
                                bgcolor: getPriorityColor(assignment.priority),
                                borderRadius: 1,
                              }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {assignment.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {assignment.subject}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {assignment.class_name}-{assignment.section}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={assignment.submission_count}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" color="text.secondary">
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardHeader
              title="Recent Student Submissions"
              subheader="Latest assignment submissions"
            />
            <CardContent>
              <List sx={{ py: 0 }}>
                {dashboardData.recent_submissions.map((submission, index) => (
                  <Box key={submission.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                      onClick={() => navigate(`/teacher/submissions/${submission.id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={submission.student_photo}
                          alt={submission.student_name}
                          sx={{ bgcolor: theme.palette.primary.main }}
                        >
                          {submission.student_name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {submission.student_name}
                            </Typography>
                            <Chip
                              label={submission.status}
                              size="small"
                              color={submission.status === 'graded' ? 'success' : 'warning'}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {submission.assignment_title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {submission.class_name}-{submission.section} •{' '}
                              {new Date(submission.submitted_at).toLocaleString()}
                            </Typography>
                            {submission.status === 'graded' && submission.score !== undefined && (
                              <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                                Score: {submission.score}%
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < dashboardData.recent_submissions.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Class Performance Snapshot"
              subheader="Average scores and attendance across classes"
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar data={performanceChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Weekly Attendance"
              subheader={`${dashboardData.statistics.this_week_attendance}% average`}
            />
            <CardContent>
              <Box
                sx={{
                  height: 250,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Doughnut
                  data={attendanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Upcoming Exams"
              subheader="Scheduled examinations"
              avatar={<EventIcon color="primary" />}
            />
            <CardContent>
              {dashboardData.upcoming_exams.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No upcoming exams scheduled
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {dashboardData.upcoming_exams.map((exam) => (
                    <Grid item xs={12} sm={6} md={4} key={exam.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[3],
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                        onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip label={exam.exam_type} size="small" color="primary" />
                          <Typography variant="caption" color="text.secondary">
                            {exam.duration_minutes} min
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {exam.exam_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {exam.class_name}-{exam.section} • {exam.subject}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(exam.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">Total Marks: {exam.total_marks}</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
