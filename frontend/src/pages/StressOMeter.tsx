import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Stack,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  DirectionsWalk as WalkIcon,
  WaterDrop as HydrateIcon,
  NotStarted as StopIcon,
  SelfImprovement as MeditateIcon,
  AirplanemodeActive as BreathingIcon,
  SportsEsports as GamesIcon,
  LocalHospital as HealthIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  GetApp as DownloadIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StressData {
  level: number;
  trend: 'up' | 'down' | 'stable';
  burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
}

interface WellnessMetrics {
  studyHours: number[];
  sleepHours: number[];
  exerciseMinutes: number[];
  screenTime: number[];
}

export default function StressOMeter() {
  const theme = useTheme();
  const [stressData] = useState<StressData>({
    level: 65,
    trend: 'up',
    burnoutRisk: 'medium',
  });
  const [showAlert, setShowAlert] = useState(true);
  const [loading, setLoading] = useState(false);

  const weeklyMetrics: WellnessMetrics = {
    studyHours: [5, 6, 7, 8, 6, 5, 4],
    sleepHours: [7, 6.5, 6, 5.5, 6, 7, 8],
    exerciseMinutes: [30, 45, 0, 30, 60, 45, 30],
    screenTime: [4, 5, 6, 7, 5, 4, 5],
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getStressColor = (level: number) => {
    if (level < 30) return theme.palette.success.main;
    if (level < 50) return theme.palette.info.main;
    if (level < 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getBurnoutColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      default:
        return theme.palette.success.main;
    }
  };

  const stressGaugeData = {
    labels: ['Stress Level', 'Remaining'],
    datasets: [
      {
        data: [stressData.level, 100 - stressData.level],
        backgroundColor: [getStressColor(stressData.level), alpha(theme.palette.grey[300], 0.2)],
        borderWidth: 0,
      },
    ],
  };

  const weeklyStudyData = {
    labels: weekDays,
    datasets: [
      {
        label: 'Study Hours',
        data: weeklyMetrics.studyHours,
        backgroundColor: alpha(theme.palette.primary.main, 0.6),
      },
      {
        label: 'Sleep Hours',
        data: weeklyMetrics.sleepHours,
        backgroundColor: alpha(theme.palette.success.main, 0.6),
      },
    ],
  };

  const weeklyActivityData = {
    labels: weekDays,
    datasets: [
      {
        label: 'Exercise (min)',
        data: weeklyMetrics.exerciseMinutes,
        backgroundColor: alpha(theme.palette.info.main, 0.6),
      },
      {
        label: 'Screen Time (hrs)',
        data: weeklyMetrics.screenTime.map((h) => h * 60),
        backgroundColor: alpha(theme.palette.warning.main, 0.6),
      },
    ],
  };

  const immediateActions = [
    {
      icon: <StopIcon />,
      title: 'Stop Studying Now',
      description: 'Take a break - you need rest',
      color: theme.palette.error.main,
    },
    {
      icon: <WalkIcon />,
      title: 'Take a 15-Min Walk',
      description: 'Fresh air helps clear your mind',
      color: theme.palette.info.main,
    },
    {
      icon: <HydrateIcon />,
      title: 'Drink Water',
      description: 'Hydration improves focus',
      color: theme.palette.primary.main,
    },
  ];

  const wellnessActivities = [
    { icon: <MeditateIcon />, title: 'Guided Meditation', duration: '10 min' },
    { icon: <BreathingIcon />, title: 'Breathing Exercise', duration: '5 min' },
    { icon: <GamesIcon />, title: 'Brain Break Game', duration: '5 min' },
  ];

  const handleGeneratePDF = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('Generating wellness report PDF...');
    }, 1500);
  };

  const handleSendParentAlert = () => {
    console.log('Sending parent alert notification...');
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Stress-O-Meter
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time stress monitoring and wellness recommendations
        </Typography>
      </Box>

      {showAlert && stressData.burnoutRisk !== 'low' && (
        <Alert
          severity={stressData.burnoutRisk === 'critical' ? 'error' : 'warning'}
          onClose={() => setShowAlert(false)}
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <AlertTitle>
            {stressData.burnoutRisk === 'critical'
              ? 'Critical Burnout Risk Detected!'
              : 'Elevated Burnout Risk'}
          </AlertTitle>
          Your stress levels are {stressData.burnoutRisk === 'critical' ? 'critically' : ''} high.
          Please take immediate action to prevent burnout.{' '}
          {stressData.burnoutRisk === 'critical' && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<NotificationsIcon />}
              onClick={handleSendParentAlert}
              sx={{ ml: 1 }}
            >
              Alert Parents/Counselor
            </Button>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Real-Time Stress Gauge"
              avatar={<SpeedIcon />}
              action={
                <Chip
                  label={`${stressData.trend === 'up' ? '↑' : stressData.trend === 'down' ? '↓' : '→'} ${stressData.trend.toUpperCase()}`}
                  color={stressData.trend === 'up' ? 'error' : 'success'}
                  size="small"
                />
              }
            />
            <CardContent>
              <Box
                sx={{
                  position: 'relative',
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ width: 250, height: 250 }}>
                  <Doughnut
                    data={stressGaugeData}
                    options={{
                      rotation: -90,
                      circumference: 180,
                      cutout: '75%',
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                      },
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 80,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h2"
                    fontWeight={700}
                    color={getStressColor(stressData.level)}
                  >
                    {stressData.level}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Stress Level
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                <Chip
                  label={`Burnout Risk: ${stressData.burnoutRisk.toUpperCase()}`}
                  sx={{
                    bgcolor: alpha(getBurnoutColor(stressData.burnoutRisk), 0.1),
                    color: getBurnoutColor(stressData.burnoutRisk),
                    fontWeight: 600,
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Immediate Action Recommendations" avatar={<HealthIcon />} />
            <CardContent>
              <List>
                {immediateActions.map((action, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: alpha(action.color, 0.05),
                      border: `2px solid ${alpha(action.color, 0.2)}`,
                    }}
                  >
                    <ListItemIcon sx={{ color: action.color, minWidth: 48 }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={600}>
                          {action.title}
                        </Typography>
                      }
                      secondary={action.description}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: action.color, color: action.color }}
                    >
                      Start
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Wellness Activity Shortcuts" />
            <CardContent>
              <Grid container spacing={2}>
                {wellnessActivities.map((activity, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Paper
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>{activity.icon}</Box>
                      <Typography variant="h6" gutterBottom>
                        {activity.title}
                      </Typography>
                      <Chip label={activity.duration} size="small" />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Weekly Wellness Report"
              subheader="Study vs Sleep Balance"
              action={
                <Button
                  size="small"
                  startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
                  onClick={handleGeneratePDF}
                  disabled={loading}
                >
                  Export PDF
                </Button>
              }
            />
            <CardContent>
              <Bar
                data={weeklyStudyData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Hours' },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Exercise & Screen Time"
              subheader="Physical activity vs digital exposure"
            />
            <CardContent>
              <Bar
                data={weeklyActivityData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Minutes' },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Parent Alert Notification Preview" />
            <CardContent>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  border: `1px solid ${theme.palette.warning.main}`,
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="h6">Student Wellness Alert</Typography>
                  </Box>
                  <Typography variant="body1">
                    <strong>Subject:</strong> Elevated Stress Levels Detected for Your Child
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dear Parent/Guardian,
                    <br />
                    <br />
                    Our wellness monitoring system has detected elevated stress levels for your
                    child. The current stress index is at <strong>{stressData.level}%</strong> with
                    a <strong>{stressData.burnoutRisk}</strong> burnout risk.
                    <br />
                    <br />
                    Recent patterns indicate:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3 }}>
                    <li>Increased study hours without adequate breaks</li>
                    <li>Reduced sleep duration</li>
                    <li>Limited physical activity</li>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    We recommend scheduling a consultation with our school counselor to develop a
                    healthier study-life balance.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" color="warning">
                      Schedule Counselor Meeting
                    </Button>
                    <Button variant="outlined">View Full Report</Button>
                  </Stack>
                </Stack>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
