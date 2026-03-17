import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  EmojiEvents as TrophyIcon,
  PlayArrow as PlayIcon,
  Timer as TimerIcon,
  Groups as TeamIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { olympicsAPI, Competition, CompetitionEvent, Team, Prize } from '@/api/olympics';
import { LiveLeaderboard, TeamFormation, PrizeShowcase } from '@/components/olympics';
import { useAuth } from '@/hooks/useAuth';

export default function OlympicsDetailPage() {
  const theme = useTheme();
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId]);

  const loadCompetitionDetails = async () => {
    try {
      setLoading(true);
      const [competitionData, eventsData, prizesData] = await Promise.all([
        olympicsAPI.getCompetition(Number(competitionId)),
        olympicsAPI.getCompetitionEvents(Number(competitionId)),
        olympicsAPI.getPrizes(Number(competitionId)),
      ]);

      setCompetition(competitionData);
      setEvents(eventsData);
      setPrizes(prizesData);
      setError(null);

      if (competitionData.competition_type === 'team') {
        loadTeamInfo();
      }
    } catch (err) {
      setError('Failed to load competition details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamInfo = async () => {
    try {
      const teams = await olympicsAPI.getTeams(Number(competitionId));
      const userTeam = teams.find((team) =>
        team.members?.some((member) => member.user_id === Number(user?.id))
      );
      if (userTeam) {
        setCurrentTeam(userTeam);
      }
    } catch (err) {
      console.error('Failed to load team info', err);
    }
  };

  const handleStartEvent = (eventId: number) => {
    navigate(`/student/olympics/event/${eventId}`);
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.palette.success.main;
      case 'upcoming':
        return theme.palette.info.main;
      case 'completed':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  const renderEvents = () => (
    <Grid container spacing={3}>
      {events.map((event) => (
        <Grid item xs={12} md={6} key={event.id}>
          <Card
            sx={{
              height: '100%',
              border: 1,
              borderColor: event.status === 'active' ? theme.palette.success.main : 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  {event.name}
                </Typography>
                <Chip
                  label={event.status}
                  size="small"
                  sx={{
                    bgcolor: alpha(getEventStatusColor(event.status), 0.1),
                    color: getEventStatusColor(event.status),
                    fontWeight: 'bold',
                  }}
                />
              </Stack>

              <Typography variant="body2" color="text.secondary" paragraph>
                {event.description}
              </Typography>

              <Stack spacing={1} mb={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(event.start_time), 'MMM dd, yyyy • hh:mm a')}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <TimerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Duration: {event.duration_minutes} minutes
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrophyIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                  <Typography variant="caption" fontWeight="bold" color="warning.main">
                    {event.total_points} points
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={2}>
                <Chip label={event.subject} size="small" />
                <Chip label={event.event_type} size="small" variant="outlined" />
                {event.questions_count && (
                  <Chip
                    label={`${event.questions_count} questions`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={event.status !== 'active'}
                  onClick={() => handleStartEvent(event.id)}
                  startIcon={<PlayIcon />}
                >
                  {event.status === 'active'
                    ? 'Start Event'
                    : event.status === 'upcoming'
                      ? 'Coming Soon'
                      : 'Completed'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !competition) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Competition not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate('/student/olympics')}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {competition.name}
        </Typography>
      </Stack>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {competition.banner_url && (
                <Box
                  component="img"
                  src={competition.banner_url}
                  alt={competition.name}
                  sx={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover',
                    borderRadius: 1,
                    mb: 3,
                  }}
                />
              )}

              <Typography variant="body1" paragraph>
                {competition.description}
              </Typography>

              <Stack direction="row" spacing={2} flexWrap="wrap" mb={2}>
                <Chip
                  icon={<CalendarIcon />}
                  label={`${format(new Date(competition.start_date), 'MMM dd')} - ${format(new Date(competition.end_date), 'MMM dd, yyyy')}`}
                />
                <Chip
                  icon={competition.competition_type === 'team' ? <TeamIcon /> : <PersonIcon />}
                  label={
                    competition.competition_type === 'team'
                      ? `Team (${competition.team_size} members)`
                      : 'Individual'
                  }
                />
                {competition.prize_pool && (
                  <Chip icon={<TrophyIcon />} label={competition.prize_pool} color="warning" />
                )}
              </Stack>

              {competition.rules && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Rules & Guidelines
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-line' }}
                  >
                    {competition.rules}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Competition Status
                </Typography>
                <Chip
                  label={competition.status.toUpperCase()}
                  color={
                    competition.status === 'active'
                      ? 'success'
                      : competition.status === 'upcoming'
                        ? 'info'
                        : 'default'
                  }
                  sx={{ mb: 2 }}
                />

                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Registration"
                      secondary={`${format(new Date(competition.registration_start), 'MMM dd')} - ${format(new Date(competition.registration_end), 'MMM dd')}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Competition Period"
                      secondary={`${format(new Date(competition.start_date), 'MMM dd')} - ${format(new Date(competition.end_date), 'MMM dd')}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Total Events" secondary={events.length} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {competition.competition_type === 'team' && (
              <TeamFormation
                competitionId={competition.id}
                teamSize={competition.team_size || 4}
                currentTeam={currentTeam || undefined}
                onTeamCreated={(team) => setCurrentTeam(team)}
                onTeamJoined={(team) => setCurrentTeam(team)}
              />
            )}
          </Stack>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Events" icon={<PlayIcon />} iconPosition="start" />
          <Tab label="Leaderboard" icon={<TrophyIcon />} iconPosition="start" />
          <Tab label="Prizes" icon={<TrophyIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom mb={3}>
            Competition Events
          </Typography>
          {events.length > 0 ? (
            renderEvents()
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PlayIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No events available yet
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <LiveLeaderboard competitionId={competition.id} currentUserId={Number(user?.id)} />
      )}

      {activeTab === 2 && <PrizeShowcase prizes={prizes} />}
    </Container>
  );
}
