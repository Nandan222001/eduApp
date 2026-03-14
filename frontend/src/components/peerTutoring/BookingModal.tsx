import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  alpha,
  Paper,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  VideoCall as ZoomIcon,
  Event as GoogleMeetIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { peerTutoringApi, Tutor, TutoringSession, AvailabilitySlot } from '@/api/peerTutoring';

interface BookingModalProps {
  tutor: Tutor;
  open: boolean;
  onClose: () => void;
  onBookingComplete: (session: TutoringSession) => void;
}

export default function BookingModal({
  tutor,
  open,
  onClose,
  onBookingComplete,
}: BookingModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(new Date());
  const [duration, setDuration] = useState(60);
  const [meetingPlatform, setMeetingPlatform] = useState<'zoom' | 'google_meet'>('zoom');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    if (open) {
      loadAvailability();
      if (tutor.subjects.length > 0) {
        setSubject(tutor.subjects[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tutor.id]);

  const loadAvailability = async () => {
    try {
      const slots = await peerTutoringApi.getTutorAvailability(tutor.id);
      setAvailability(slots);
    } catch (err) {
      console.error('Failed to load availability:', err);
    }
  };

  const handleSubmit = async () => {
    if (!scheduledAt || !subject || !topic) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const session = await peerTutoringApi.bookSession({
        tutor_id: tutor.id,
        subject,
        topic,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: duration,
        meeting_platform: meetingPlatform,
        special_requirements: specialRequirements || undefined,
      });

      onBookingComplete(session);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to book session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            Book Tutoring Session
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${theme.palette.primary.main}`,
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Tutoring with {tutor.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {tutor.grade}
          </Typography>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Subject</InputLabel>
              <Select value={subject} onChange={(e) => setSubject(e.target.value)} label="Subject">
                {tutor.subjects.map((subj) => (
                  <MenuItem key={subj} value={subj}>
                    {subj}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., Quadratic equations, Photosynthesis"
              helperText="What specific topic do you need help with?"
            />
          </Grid>

          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Date & Time"
                value={scheduledAt}
                onChange={(newValue) => setScheduledAt(newValue)}
                minDateTime={new Date()}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Duration</InputLabel>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value as number)}
                label="Duration"
              >
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
                <MenuItem value={90}>1.5 hours</MenuItem>
                <MenuItem value={120}>2 hours</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Meeting Platform
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  cursor: 'pointer',
                  border: `2px solid ${
                    meetingPlatform === 'zoom' ? theme.palette.primary.main : theme.palette.divider
                  }`,
                  bgcolor:
                    meetingPlatform === 'zoom'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                }}
                onClick={() => setMeetingPlatform('zoom')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ZoomIcon color={meetingPlatform === 'zoom' ? 'primary' : 'disabled'} />
                  <Typography
                    variant="body2"
                    fontWeight={meetingPlatform === 'zoom' ? 600 : 400}
                    color={meetingPlatform === 'zoom' ? 'primary' : 'text.secondary'}
                  >
                    Zoom
                  </Typography>
                </Box>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  cursor: 'pointer',
                  border: `2px solid ${
                    meetingPlatform === 'google_meet'
                      ? theme.palette.primary.main
                      : theme.palette.divider
                  }`,
                  bgcolor:
                    meetingPlatform === 'google_meet'
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                }}
                onClick={() => setMeetingPlatform('google_meet')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GoogleMeetIcon
                    color={meetingPlatform === 'google_meet' ? 'primary' : 'disabled'}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={meetingPlatform === 'google_meet' ? 600 : 400}
                    color={meetingPlatform === 'google_meet' ? 'primary' : 'text.secondary'}
                  >
                    Google Meet
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Special Requirements (Optional)"
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="Any specific areas you want to focus on or materials you'd like the tutor to prepare?"
            />
          </Grid>

          {availability.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Tutor&apos;s Availability
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availability.map((slot) => {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  return (
                    <Chip
                      key={slot.id}
                      label={`${days[slot.day_of_week]}: ${slot.start_time} - ${slot.end_time}`}
                      size="small"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Book Session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
