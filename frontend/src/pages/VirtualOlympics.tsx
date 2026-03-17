import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Container,
  alpha,
  useTheme,
  Card,
  CardContent,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { olympicsAPI, Competition } from '@/api/olympics';
import { CompetitionCard } from '@/components/olympics';

export default function VirtualOlympics() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<Competition[]>([]);
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([]);
  const [pastCompetitions, setPastCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const [upcoming, active, past] = await Promise.all([
        olympicsAPI.getCompetitions('upcoming'),
        olympicsAPI.getCompetitions('active'),
        olympicsAPI.getCompetitions('past'),
      ]);
      setUpcomingCompetitions(upcoming);
      setActiveCompetitions(active);
      setPastCompetitions(past);
      setError(null);
    } catch (err) {
      setError('Failed to load competitions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (competitionId: number) => {
    navigate(`/student/olympics/${competitionId}`);
  };

  const renderCompetitions = (competitions: Competition[]) => {
    if (competitions.length === 0) {
      return (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No competitions available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new competitions
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Grid container spacing={3}>
        {competitions.map((competition) => (
          <Grid item xs={12} sm={6} md={4} key={competition.id}>
            <CompetitionCard competition={competition} onViewDetails={handleViewDetails} />
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={3}>
            <TrophyIcon sx={{ fontSize: 80 }} />
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Virtual Classroom Olympics
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.95 }}>
                Compete with students worldwide in academic challenges
              </Typography>
            </Box>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 4,
            bgcolor: 'background.paper',
            borderRadius: 1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab
              icon={<CalendarIcon />}
              label={`Upcoming (${upcomingCompetitions.length})`}
              iconPosition="start"
            />
            <Tab
              icon={<TrophyIcon />}
              label={`Active (${activeCompetitions.length})`}
              iconPosition="start"
              sx={{
                color: activeCompetitions.length > 0 ? theme.palette.success.main : undefined,
              }}
            />
            <Tab
              icon={<CheckIcon />}
              label={`Past (${pastCompetitions.length})`}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              Upcoming Competitions
            </Typography>
            {renderCompetitions(upcomingCompetitions)}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {activeCompetitions.length > 0 && (
              <Alert
                severity="success"
                icon={<TrophyIcon />}
                sx={{
                  mb: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: 1,
                  borderColor: theme.palette.success.main,
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  Live Competitions Available!
                </Typography>
                <Typography variant="body2">
                  Join now to compete and climb the leaderboard
                </Typography>
              </Alert>
            )}
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              Active Competitions
            </Typography>
            {renderCompetitions(activeCompetitions)}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              Past Competitions
            </Typography>
            {renderCompetitions(pastCompetitions)}
          </Box>
        )}
      </Box>
    </Container>
  );
}
