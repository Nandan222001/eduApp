import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Badge,
  useTheme,
} from '@mui/material';
import {
  PlayCircle as PlayCircleIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Payment as PaymentIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { format, isFuture, differenceInHours } from 'date-fns';

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

const SchoolEventsCalendar: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [reminderHours, setReminderHours] = useState([24, 1]);

  const { data: liveEvents = [], isLoading: loadingLive } = useQuery({
    queryKey: ['liveEvents'],
    queryFn: () => eventsApi.getLiveEvents(),
    refetchInterval: 10000,
  });

  const { data: upcomingEvents = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ['upcomingLiveEvents'],
    queryFn: () => eventsApi.getUpcomingLiveEvents(),
    refetchInterval: 30000,
  });

  const { data: recordedEvents = [], isLoading: loadingRecorded } = useQuery({
    queryKey: ['recordedEvents'],
    queryFn: () => eventsApi.getRecordedEvents(),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['eventReminders'],
    queryFn: () => eventsApi.getReminders(),
  });

  const setReminderMutation = useMutation({
    mutationFn: (data: { eventId: number; hours: number[] }) => {
      return Promise.all(
        data.hours.map((hours) =>
          eventsApi.setReminder(data.eventId, {
            reminder_type: 'all',
            reminder_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString(),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReminders'] });
      setReminderDialogOpen(false);
      setSelectedEvent(null);
    },
  });

  const handleSetReminder = (eventId: number) => {
    setSelectedEvent(eventId);
    setReminderDialogOpen(true);
  };

  const handleConfirmReminder = () => {
    if (selectedEvent) {
      setReminderMutation.mutate({ eventId: selectedEvent, hours: reminderHours });
    }
  };

  const getCountdown = (startDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const diff = differenceInHours(start, now);

    if (diff < 0) return 'Started';
    if (diff < 1) return 'Starting soon';
    if (diff < 24) return `${diff}h`;
    const days = Math.floor(diff / 24);
    return `${days}d ${diff % 24}h`;
  };

  const hasReminder = (eventId: number) => {
    return reminders.some((r) => r.event_id === eventId);
  };

  const EventCard = ({
    event,
    type,
  }: {
    event: Record<string, unknown>;
    type: 'live' | 'upcoming' | 'recorded';
  }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-4px)',
        },
        transition: 'all 0.3s',
      }}
    >
      {type === 'live' && (
        <Chip
          label="LIVE NOW"
          color="error"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1,
            fontWeight: 'bold',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.7 },
            },
          }}
        />
      )}
      {type === 'upcoming' && isFuture(new Date(event.start_date)) && (
        <Chip
          label={getCountdown(event.start_date)}
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
            fontWeight: 'bold',
          }}
        />
      )}
      <CardMedia
        component="img"
        height="200"
        image={event.banner_image_url || '/placeholder-event.jpg'}
        alt={event.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="h6" gutterBottom>
          {event.title}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {format(new Date(event.start_date), 'PPP')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {format(new Date(event.start_date), 'p')}
            </Typography>
          </Box>
          {type === 'live' && event.viewer_count !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {event.viewer_count} watching
              </Typography>
            </Box>
          )}
          {event.is_ticketed && (
            <Chip
              icon={<PaymentIcon />}
              label={`$${event.ticket_price}`}
              size="small"
              color="secondary"
            />
          )}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        {type === 'live' && (
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate(`/events/live/${event.id}`)}
          >
            Watch Now
          </Button>
        )}
        {type === 'upcoming' && (
          <>
            <Button
              variant="outlined"
              fullWidth
              startIcon={
                hasReminder(event.id) ? <NotificationsActiveIcon /> : <NotificationsIcon />
              }
              onClick={() => handleSetReminder(event.id)}
              color={hasReminder(event.id) ? 'success' : 'primary'}
            >
              {hasReminder(event.id) ? 'Reminder Set' : 'Set Reminder'}
            </Button>
          </>
        )}
        {type === 'recorded' && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<PlayCircleIcon />}
            onClick={() => navigate(`/events/live/${event.id}`)}
          >
            Watch Recording
          </Button>
        )}
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            School Events Calendar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Watch live streams, set reminders for upcoming events, and access past recordings
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab
              label={
                <Badge badgeContent={liveEvents.length} color="error">
                  <Box sx={{ px: 1 }}>Live Now</Box>
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={upcomingEvents.length} color="primary">
                  <Box sx={{ px: 1 }}>Upcoming</Box>
                </Badge>
              }
            />
            <Tab label="Past Events Library" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            {loadingLive ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : liveEvents.length > 0 ? (
              <Grid container spacing={3}>
                {liveEvents.map((event) => (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <EventCard event={event} type="live" />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">No live events at the moment. Check back later!</Alert>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {loadingUpcoming ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : upcomingEvents.length > 0 ? (
              <Grid container spacing={3}>
                {upcomingEvents.map((event) => (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <EventCard event={event} type="upcoming" />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">No upcoming events scheduled</Alert>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {loadingRecorded ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : recordedEvents.length > 0 ? (
              <Grid container spacing={3}>
                {recordedEvents.map((event) => (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <EventCard event={event} type="recorded" />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">No recorded events available yet</Alert>
            )}
          </TabPanel>
        </Paper>
      </Box>

      <Dialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Event Reminder</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Remind me before the event:</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reminderHours.includes(24)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReminderHours([...reminderHours, 24]);
                      } else {
                        setReminderHours(reminderHours.filter((h) => h !== 24));
                      }
                    }}
                  />
                }
                label="24 hours before"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reminderHours.includes(1)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReminderHours([...reminderHours, 1]);
                      } else {
                        setReminderHours(reminderHours.filter((h) => h !== 1));
                      }
                    }}
                  />
                }
                label="1 hour before"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reminderHours.includes(0.25)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReminderHours([...reminderHours, 0.25]);
                      } else {
                        setReminderHours(reminderHours.filter((h) => h !== 0.25));
                      }
                    }}
                  />
                }
                label="15 minutes before"
              />
            </FormGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmReminder}
            variant="contained"
            disabled={reminderHours.length === 0}
          >
            Set Reminder
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SchoolEventsCalendar;
