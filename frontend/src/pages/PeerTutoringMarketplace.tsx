import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Avatar,
  Rating,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Paper,
  useTheme,
  alpha,
  Badge,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  School as SchoolIcon,
  CheckCircle as VerifiedIcon,
  VideoCall as VideoIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  LocalLibrary as LibraryIcon,
} from '@mui/icons-material';
import { peerTutoringApi, Tutor, TutoringSession } from '@/api/peerTutoring';
import { useAuth } from '@/hooks/useAuth';
import TutorProfileModal from '@/components/peerTutoring/TutorProfileModal';
import BookingModal from '@/components/peerTutoring/BookingModal';
import TutoringSessionInterface from '@/components/peerTutoring/TutoringSessionInterface';
import TutorDashboard from '@/components/peerTutoring/TutorDashboard';
import StudentLearningHistory from '@/components/peerTutoring/StudentLearningHistory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ mt: 3 }}>{children}</Box>}
    </div>
  );
}

interface TutorCardProps {
  tutor: Tutor;
  onViewProfile: (tutor: Tutor) => void;
  onBook: (tutor: Tutor) => void;
}

function TutorCard({ tutor, onViewProfile, onBook }: TutorCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              tutor.is_verified ? (
                <VerifiedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              ) : null
            }
          >
            <Avatar src={tutor.photo_url} alt={tutor.name} sx={{ width: 80, height: 80, mr: 2 }}>
              {tutor.name.charAt(0)}
            </Avatar>
          </Badge>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              {tutor.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {tutor.grade}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Rating value={tutor.rating} precision={0.1} size="small" readOnly />
              <Typography variant="body2" fontWeight={600}>
                {tutor.rating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({tutor.total_reviews})
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Expertise
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tutor.subjects.slice(0, 3).map((subject, index) => (
              <Chip key={index} label={subject} size="small" color="primary" variant="outlined" />
            ))}
            {tutor.subjects.length > 3 && (
              <Chip label={`+${tutor.subjects.length - 3}`} size="small" variant="outlined" />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {tutor.sessions_completed} sessions completed
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="body2" color="text.secondary">
              {tutor.success_rate}% success rate
            </Typography>
          </Box>
        </Box>

        {tutor.achievement_badges.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={0.5}>
              {tutor.achievement_badges.slice(0, 4).map((badge, index) => (
                <Tooltip key={index} title={badge.name} arrow>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: 'warning.main',
                      fontSize: 12,
                    }}
                  >
                    {badge.icon}
                  </Avatar>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" fullWidth onClick={() => onViewProfile(tutor)}>
            View Profile
          </Button>
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={() => onBook(tutor)}
            disabled={!tutor.is_available}
          >
            {tutor.is_available ? 'Book Now' : 'Unavailable'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function PeerTutoringMarketplace() {
  const theme = useTheme();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeSession, setActiveSession] = useState<TutoringSession | null>(null);

  const allSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
    'History',
    'Geography',
    'Economics',
    'Business Studies',
  ];

  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId) {
      loadActiveSession(sessionId);
    }
    loadTutors();
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutors, searchQuery, selectedSubjects, minRating]);

  const loadTutors = async () => {
    try {
      setLoading(true);
      const data = await peerTutoringApi.getTutors();
      setTutors(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tutors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSession = async (sessionId: string) => {
    try {
      const session = await peerTutoringApi.getSession(sessionId);
      setActiveSession(session);
      setCurrentTab(2);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const applyFilters = () => {
    let filtered = tutors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tutor) =>
          tutor.name.toLowerCase().includes(query) ||
          tutor.subjects.some((subject) => subject.toLowerCase().includes(query)) ||
          tutor.bio?.toLowerCase().includes(query)
      );
    }

    if (selectedSubjects.length > 0) {
      filtered = filtered.filter((tutor) =>
        selectedSubjects.some((subject) => tutor.subjects.includes(subject))
      );
    }

    if (minRating > 0) {
      filtered = filtered.filter((tutor) => tutor.rating >= minRating);
    }

    setFilteredTutors(filtered);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleViewProfile = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setShowProfileModal(true);
  };

  const handleBookTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setShowBookingModal(true);
  };

  const handleBookingComplete = (session: TutoringSession) => {
    setShowBookingModal(false);
    setActiveSession(session);
    setCurrentTab(2);
  };

  const handleSessionComplete = () => {
    setActiveSession(null);
    setCurrentTab(0);
    loadTutors();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Peer Tutoring Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with expert student tutors for personalized learning
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Find Tutors" icon={<SearchIcon />} iconPosition="start" />
          {user?.role === 'tutor' && (
            <Tab label="My Dashboard" icon={<LibraryIcon />} iconPosition="start" />
          )}
          <Tab label="Active Session" icon={<VideoIcon />} iconPosition="start" />
          <Tab label="Learning History" icon={<SchoolIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TabPanel value={currentTab} index={0}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, subject, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  multiple
                  value={selectedSubjects}
                  onChange={(e) => setSelectedSubjects(e.target.value as string[])}
                  label="Subject"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {allSubjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'More Filters'}
              </Button>
            </Grid>
          </Grid>

          {showFilters && (
            <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" gutterBottom>
                Minimum Rating
              </Typography>
              <Slider
                value={minRating}
                onChange={(_e, value) => setMinRating(value as number)}
                min={0}
                max={5}
                step={0.5}
                marks
                valueLabelDisplay="auto"
                sx={{ maxWidth: 300 }}
              />
            </Box>
          )}
        </Paper>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredTutors.length} tutor{filteredTutors.length !== 1 ? 's' : ''} available
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedSubjects.map((subject) => (
              <Chip
                key={subject}
                label={subject}
                size="small"
                onDelete={() => setSelectedSubjects(selectedSubjects.filter((s) => s !== subject))}
              />
            ))}
            {(searchQuery || selectedSubjects.length > 0 || minRating > 0) && (
              <Button
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubjects([]);
                  setMinRating(0);
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {filteredTutors.map((tutor) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tutor.id}>
              <TutorCard tutor={tutor} onViewProfile={handleViewProfile} onBook={handleBookTutor} />
            </Grid>
          ))}
          {filteredTutors.length === 0 && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tutors found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search filters
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {user?.role === 'tutor' && (
        <TabPanel value={currentTab} index={1}>
          <TutorDashboard />
        </TabPanel>
      )}

      <TabPanel value={currentTab} index={user?.role === 'tutor' ? 2 : 1}>
        {activeSession ? (
          <TutoringSessionInterface session={activeSession} onComplete={handleSessionComplete} />
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <VideoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No active session
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Book a tutoring session to get started
            </Typography>
            <Button variant="contained" onClick={() => setCurrentTab(0)}>
              Find a Tutor
            </Button>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={user?.role === 'tutor' ? 3 : 2}>
        <StudentLearningHistory />
      </TabPanel>

      {selectedTutor && (
        <>
          <TutorProfileModal
            tutor={selectedTutor}
            open={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onBook={() => {
              setShowProfileModal(false);
              setShowBookingModal(true);
            }}
          />
          <BookingModal
            tutor={selectedTutor}
            open={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            onBookingComplete={handleBookingComplete}
          />
        </>
      )}
    </Box>
  );
}
