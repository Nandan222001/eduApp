import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  Chip,
  Avatar,
  Rating,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Videocam as VideoIcon,
  AttachFile as AttachFileIcon,
  RateReview as ReviewIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import { peerTutoringApi, LearningHistorySession, LearningProgress } from '@/api/peerTutoring';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface SessionCardProps {
  session: LearningHistorySession;
}

function SessionCard({ session }: SessionCardProps) {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'cancelled':
        return theme.palette.error.main;
      case 'scheduled':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'cancelled':
        return <CancelIcon />;
      case 'scheduled':
        return <ScheduleIcon />;
      default:
        return <AccessTimeIcon />;
    }
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar src={session.tutor_photo_url} sx={{ mr: 2 }}>
            {session.tutor_name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1,
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {session.subject} - {session.topic}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  with {session.tutor_name}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(session.status)}
                label={session.status}
                size="small"
                sx={{
                  bgcolor: alpha(getStatusColor(session.status), 0.1),
                  color: getStatusColor(session.status),
                  textTransform: 'capitalize',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(session.scheduled_at).toLocaleDateString()} • {session.duration_minutes}{' '}
                min
              </Typography>
              {session.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={session.rating} size="small" readOnly />
                  <Typography variant="caption" fontWeight={600}>
                    {session.rating.toFixed(1)}
                  </Typography>
                </Box>
              )}
            </Box>

            {session.session_notes && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  <strong>Notes:</strong> {session.session_notes}
                </Typography>
              </Paper>
            )}

            {session.materials_shared.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Materials Shared:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {session.materials_shared.map((material, index) => (
                    <Chip
                      key={index}
                      label={material}
                      size="small"
                      icon={<AttachFileIcon />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              {session.recording_url && (
                <Button
                  size="small"
                  startIcon={<VideoIcon />}
                  href={session.recording_url}
                  target="_blank"
                >
                  Watch Recording
                </Button>
              )}
              {session.status === 'completed' && !session.feedback_given && (
                <Button size="small" startIcon={<ReviewIcon />} variant="outlined">
                  Leave Feedback
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface ProgressCardProps {
  progress: LearningProgress;
}

function ProgressCard({ progress }: ProgressCardProps) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
      <CardContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Typography variant="h6" fontWeight={700}>
            {progress.subject}
          </Typography>
          <Chip
            label={`${progress.improvement_score}%`}
            size="small"
            color={progress.improvement_score >= 75 ? 'success' : 'warning'}
            icon={<TrendingUpIcon />}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {progress.total_sessions}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sessions
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h4" fontWeight={700} color="secondary.main">
              {progress.total_hours}h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Hours
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Average Rating</Typography>
            <Typography variant="body2" fontWeight={600}>
              {progress.average_rating.toFixed(1)}/5
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(progress.average_rating / 5) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Topics Covered ({progress.topics_covered.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {progress.topics_covered.slice(0, 5).map((topic, index) => (
              <Chip key={index} label={topic} size="small" variant="outlined" />
            ))}
            {progress.topics_covered.length > 5 && (
              <Chip label={`+${progress.topics_covered.length - 5}`} size="small" />
            )}
          </Box>
        </Box>

        {progress.last_session_date && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Last session: {new Date(progress.last_session_date).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentLearningHistory() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [sessions, setSessions] = useState<LearningHistorySession[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, progressData] = await Promise.all([
        peerTutoringApi.getStudentSessions(),
        peerTutoringApi.getStudentLearningProgress(),
      ]);
      setSessions(sessionsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load learning history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const totalHours = sessions.reduce((acc, s) => acc + s.duration_minutes / 60, 0);
  const averageRating =
    completedSessions.length > 0
      ? completedSessions.reduce((acc, s) => acc + (s.rating || 0), 0) / completedSessions.length
      : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sessionsChartData = {
    labels: progress.map((p) => p.subject),
    datasets: [
      {
        label: 'Sessions',
        data: progress.map((p) => p.total_sessions),
        backgroundColor: alpha(theme.palette.primary.main, 0.6),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    ],
  };

  const hoursChartData = {
    labels: progress.map((p) => p.subject),
    datasets: [
      {
        label: 'Hours',
        data: progress.map((p) => p.total_hours),
        backgroundColor: alpha(theme.palette.secondary.main, 0.6),
        borderColor: theme.palette.secondary.main,
        borderWidth: 2,
      },
    ],
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Learning History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your tutoring sessions and progress
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Typography variant="h3" fontWeight={700} color="primary.main">
              {sessions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Sessions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.success.main, 0.05),
            }}
          >
            <Typography variant="h3" fontWeight={700} color="success.main">
              {totalHours.toFixed(1)}h
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Hours
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.warning.main, 0.05),
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Rating value={averageRating} precision={0.1} readOnly />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Average Rating
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.info.main, 0.05),
            }}
          >
            <Typography variant="h3" fontWeight={700} color="info.main">
              {progress.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Subjects Learning
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label={`All Sessions (${sessions.length})`} />
          <Tab label={`Upcoming (${upcomingSessions.length})`} />
          <Tab label={`Completed (${completedSessions.length})`} />
          <Tab label="Progress by Subject" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {sessions.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No sessions yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Book your first tutoring session to get started
            </Typography>
          </Paper>
        ) : (
          sessions.map((session) => <SessionCard key={session.id} session={session} />)
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {upcomingSessions.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No upcoming sessions
            </Typography>
          </Paper>
        ) : (
          upcomingSessions.map((session) => <SessionCard key={session.id} session={session} />)
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {completedSessions.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No completed sessions yet
            </Typography>
          </Paper>
        ) : (
          completedSessions.map((session) => <SessionCard key={session.id} session={session} />)
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {progress.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No progress data available yet
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {progress.map((prog) => (
                <Grid item xs={12} sm={6} md={4} key={prog.subject}>
                  <ProgressCard progress={prog} />
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Sessions by Subject
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={sessionsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
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
                      Learning Hours by Subject
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={hoursChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>
    </Box>
  );
}
