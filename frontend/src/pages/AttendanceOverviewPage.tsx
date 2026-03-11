import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  useTheme,
  alpha,
  Paper,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarTodayIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AttendanceOverviewPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Record attendance for today',
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
      path: '/admin/attendance/mark',
    },
    {
      title: 'Attendance Sheet',
      description: 'View monthly heatmap',
      icon: <CalendarTodayIcon />,
      color: theme.palette.primary.main,
      path: '/admin/attendance/sheet',
    },
    {
      title: 'Defaulters Report',
      description: 'Students below 75%',
      icon: <WarningIcon />,
      color: theme.palette.error.main,
      path: '/admin/attendance/defaulters',
    },
    {
      title: 'Corrections',
      description: 'Request attendance changes',
      icon: <EditIcon />,
      color: theme.palette.info.main,
      path: '/admin/attendance/corrections',
    },
  ];

  const overviewStats = [
    {
      title: "Today's Attendance",
      value: '92%',
      change: '+2.5%',
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'This Week',
      value: '89%',
      change: '+1.2%',
      icon: <DateRangeIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: 'This Month',
      value: '87%',
      change: '-0.8%',
      icon: <TrendingUpIcon />,
      color: theme.palette.info.main,
    },
    {
      title: 'Defaulters',
      value: '12',
      change: '-3',
      icon: <WarningIcon />,
      color: theme.palette.error.main,
    },
  ];

  const attendanceDistribution = {
    labels: ['Present', 'Absent', 'Late', 'Half Day'],
    datasets: [
      {
        data: [85, 8, 5, 2],
        backgroundColor: [
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.error.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
        ],
        borderWidth: 0,
      },
    ],
  };

  const weeklyTrend = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Attendance %',
        data: [88, 92, 85, 90, 93, 87],
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
        position: 'bottom' as const,
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Attendance Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview and quick access to attendance management tools
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {overviewStats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(stat.color, 0.1),
                      color: stat.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={
                        stat.change.startsWith('+')
                          ? 'success.main'
                          : stat.change.startsWith('-')
                            ? 'error.main'
                            : 'text.secondary'
                      }
                    >
                      {stat.change} from last period
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {quickActions.map((action) => (
                  <Grid item xs={12} sm={6} key={action.title}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                          borderColor: action.color,
                        },
                      }}
                      onClick={() => navigate(action.path)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(action.color, 0.1),
                            color: action.color,
                            width: 48,
                            height: 48,
                          }}
                        >
                          {action.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Distribution
              </Typography>
              <Box sx={{ height: 250, mt: 2 }}>
                <Doughnut data={attendanceDistribution} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Weekly Attendance Trend
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <Line
                  data={weeklyTrend}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
