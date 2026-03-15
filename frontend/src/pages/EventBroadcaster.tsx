import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  Stop as StopIcon,
  FiberManualRecord as RecordIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Analytics as AnalyticsIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  SignalCellularAlt as SignalIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EventBroadcaster: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const { data: liveEvent, isLoading } = useQuery({
    queryKey: ['liveEvent', eventId],
    queryFn: () => eventsApi.getLiveEvent(Number(eventId)),
    refetchInterval: 5000,
  });

  const { data: streamHealth } = useQuery({
    queryKey: ['streamHealth', eventId],
    queryFn: () => eventsApi.getStreamHealth(Number(eventId)),
    refetchInterval: 2000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['viewerAnalytics', eventId],
    queryFn: () => eventsApi.getViewerAnalytics(Number(eventId)),
    refetchInterval: 10000,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['eventChat', eventId],
    queryFn: () => eventsApi.getChatMessages(Number(eventId)),
    refetchInterval: 2000,
  });

  const startRecordingMutation = useMutation({
    mutationFn: () => eventsApi.startRecording(Number(eventId)),
    onSuccess: () => {
      setIsRecording(true);
      queryClient.invalidateQueries({ queryKey: ['liveEvent', eventId] });
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: () => eventsApi.stopRecording(Number(eventId)),
    onSuccess: () => {
      setIsRecording(false);
      queryClient.invalidateQueries({ queryKey: ['liveEvent', eventId] });
    },
  });

  const moderateMessageMutation = useMutation({
    mutationFn: ({ messageId, action }: { messageId: string; action: 'delete' | 'flag' }) =>
      eventsApi.moderateMessage(Number(eventId), messageId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventChat', eventId] });
      setDeleteDialogOpen(false);
      setSelectedMessageId(null);
    },
  });

  const handleDeleteMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMessage = () => {
    if (selectedMessageId) {
      moderateMessageMutation.mutate({ messageId: selectedMessageId, action: 'delete' });
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'critical':
        return <ErrorIcon />;
      default:
        return <SignalIcon />;
    }
  };

  const viewerTrendData = analytics
    ? Array.from({ length: 12 }, (_, i) => ({
        time: `${i * 5}m`,
        viewers: Math.floor(Math.random() * analytics.peak_viewers),
      }))
    : [];

  const deviceData = analytics
    ? Object.entries(analytics.device_breakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!liveEvent) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">Event not found</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">{liveEvent.title}</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {liveEvent.is_live && (
              <Chip
                label="BROADCASTING"
                color="error"
                icon={<VideocamIcon />}
                sx={{ fontWeight: 'bold' }}
              />
            )}
            {isRecording && (
              <Chip
                label="RECORDING"
                color="error"
                icon={<RecordIcon />}
                sx={{
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                  },
                }}
              />
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Broadcaster Control Panel - Monitor and manage your live stream
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Stream Health</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {streamHealth && getHealthStatusIcon(streamHealth.status)}
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          Status
                        </Typography>
                      </Box>
                      <Typography variant="h6">{streamHealth?.status || 'Unknown'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SpeedIcon fontSize="small" />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          Bitrate
                        </Typography>
                      </Box>
                      <Typography variant="h6">
                        {streamHealth ? `${(streamHealth.bitrate / 1000).toFixed(1)} Mbps` : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <VideocamIcon fontSize="small" />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          FPS
                        </Typography>
                      </Box>
                      <Typography variant="h6">{streamHealth?.fps || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WarningIcon fontSize="small" />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          Dropped Frames
                        </Typography>
                      </Box>
                      <Typography variant="h6">{streamHealth?.dropped_frames || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {streamHealth && streamHealth.status !== 'healthy' && (
                <Alert
                  severity={streamHealth.status === 'critical' ? 'error' : 'warning'}
                  sx={{ mt: 2 }}
                >
                  {streamHealth.status === 'critical'
                    ? 'Critical stream issues detected. Check your connection and encoder settings.'
                    : 'Stream quality issues detected. Monitor your bandwidth and settings.'}
                </Alert>
              )}
            </Box>
          </Paper>

          <Paper>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
              <Tab label="Chat Moderation" icon={<ChatIcon />} iconPosition="start" />
              <Tab label="Recording" icon={<RecordIcon />} iconPosition="start" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              {analytics && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Viewer Count Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={viewerTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="viewers"
                          stroke={theme.palette.primary.main}
                          fill={alpha(theme.palette.primary.main, 0.3)}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Device Breakdown
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>

                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="caption" color="text.secondary">
                              Total Viewers
                            </Typography>
                            <Typography variant="h5">{analytics.total_viewers}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="caption" color="text.secondary">
                              Peak Viewers
                            </Typography>
                            <Typography variant="h5">{analytics.peak_viewers}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="caption" color="text.secondary">
                              Avg. Watch Time
                            </Typography>
                            <Typography variant="h5">
                              {Math.floor(analytics.average_watch_time / 60)}m
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="caption" color="text.secondary">
                              Engagement Rate
                            </Typography>
                            <Typography variant="h5">
                              {(analytics.engagement_rate * 100).toFixed(1)}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ mb: 2 }}>
                <Alert severity="info">
                  Monitor and moderate chat messages. Delete inappropriate content to maintain a
                  safe environment.
                </Alert>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chatMessages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={msg.user_avatar} sx={{ width: 32, height: 32 }}>
                              {msg.user_name[0]}
                            </Avatar>
                            {msg.user_name}
                          </Box>
                        </TableCell>
                        <TableCell>{msg.message}</TableCell>
                        <TableCell>{format(new Date(msg.timestamp), 'HH:mm:ss')}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMessage(msg.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                {!isRecording ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Recording Not Active
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Start recording to save this live stream for later viewing
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      startIcon={<RecordIcon />}
                      onClick={() => startRecordingMutation.mutate()}
                      sx={{ mt: 2 }}
                    >
                      Start Recording
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Recording in Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Your stream is being recorded. Stop recording when finished.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<StopIcon />}
                      onClick={() => stopRecordingMutation.mutate()}
                      sx={{ mt: 2 }}
                    >
                      Stop Recording
                    </Button>
                  </Box>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current Stats
            </Typography>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <PeopleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary="Live Viewers" secondary={liveEvent.viewer_count || 0} />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                    <ChatIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary="Chat Messages" secondary={chatMessages.length} />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Stream Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  RTMP URL
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={liveEvent.rtmp_url || 'Not configured'}
                  InputProps={{ readOnly: true }}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  HLS URL
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={liveEvent.hls_url || 'Not configured'}
                  InputProps={{ readOnly: true }}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Start Time
                </Typography>
                <Typography variant="body2">
                  {format(new Date(liveEvent.start_date), 'PPpp')}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this message? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteMessage} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventBroadcaster;
