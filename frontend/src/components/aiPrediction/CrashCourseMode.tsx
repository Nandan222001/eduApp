import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Bolt as BoltIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import aiPredictionDashboardApi, { CrashCourseModeResponse } from '@/api/aiPredictionDashboard';

interface CrashCourseModeProps {
  board: string;
  gradeId: number;
  subjectId: number;
}

export default function CrashCourseMode({ board, gradeId, subjectId }: CrashCourseModeProps) {
  const theme = useTheme();
  const [daysUntilExam, setDaysUntilExam] = useState(7);
  const [loading, setLoading] = useState(false);
  const [crashCourse, setCrashCourse] = useState<CrashCourseModeResponse | null>(null);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const response = await aiPredictionDashboardApi.activateCrashCourseMode(
        board,
        gradeId,
        subjectId,
        daysUntilExam
      );
      setCrashCourse(response);
    } catch (error) {
      console.error('Failed to activate crash course mode', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (level: number) => {
    if (level === 1) return theme.palette.error.main;
    if (level === 2) return theme.palette.warning.main;
    if (level === 3) return theme.palette.info.main;
    return theme.palette.grey[500];
  };

  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Crash Course Mode
        </Typography>
        <Typography variant="body2">
          This intensive study plan is designed for last-minute preparation. It focuses on high-ROI
          topics that can maximize your score in limited time.
        </Typography>
      </Alert>

      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              label="Days Until Exam"
              type="number"
              value={daysUntilExam}
              onChange={(e) => setDaysUntilExam(Number(e.target.value))}
              fullWidth
              inputProps={{ min: 1, max: 30 }}
              helperText="Enter number of days remaining for your exam (1-30 days)"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleActivate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <BoltIcon />}
              color="error"
            >
              Activate Mode
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {crashCourse && (
        <>
          <Paper
            elevation={0}
            sx={{
              border: `2px solid ${theme.palette.error.main}`,
              p: 3,
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom color="error">
              🔥 Crash Course Mode Activated!
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Days Remaining
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {crashCourse.days_until_exam}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Coverage
                </Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {crashCourse.estimated_coverage.toFixed(0)}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Expected Score Range
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {crashCourse.expected_score_range.minimum.toFixed(0)} -{' '}
                  {crashCourse.expected_score_range.optimistic.toFixed(0)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Quick Wins */}
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrophyIcon color="warning" />
              <Typography variant="h6" fontWeight={700}>
                Quick Wins - Master These First!
              </Typography>
            </Box>
            <List>
              {crashCourse.quick_wins.map((win, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={`${index + 1}. ${win}`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Priority Topics */}
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              High-ROI Priority Topics
            </Typography>
            <Grid container spacing={2}>
              {crashCourse.priority_topics.slice(0, 10).map((topic) => (
                <Grid item xs={12} md={6} key={topic.topic_id}>
                  <Paper
                    elevation={0}
                    sx={{
                      border: `2px solid ${getPriorityColor(topic.priority_level)}`,
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={`P${topic.priority_level}`}
                        size="small"
                        sx={{
                          bgcolor: alpha(getPriorityColor(topic.priority_level), 0.1),
                          color: getPriorityColor(topic.priority_level),
                          fontWeight: 700,
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                        {topic.topic_name}
                      </Typography>
                      <Chip
                        label={`ROI: ${topic.roi_score.toFixed(1)}`}
                        size="small"
                        color="success"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Typography variant="caption">⏱️ {topic.time_to_study_hours}h</Typography>
                      <Typography variant="caption">📝 {topic.expected_marks} marks</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Quick Revision Points:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {topic.quick_revision_points.slice(0, 2).map((point, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <Typography variant="caption">• {point}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Daily Schedule */}
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Daily Intensive Schedule
            </Typography>
            {crashCourse.daily_schedule.map((day) => (
              <Accordion
                key={day.day_number}
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                      Day {day.day_number} - {new Date(day.date).toLocaleDateString()}
                    </Typography>
                    <Chip label={`${day.total_hours}h`} size="small" color="error" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Morning (8 AM - 12 PM)
                      </Typography>
                      <List dense>
                        {day.morning_session.map((task, idx) => (
                          <ListItem key={idx} sx={{ px: 0 }}>
                            <Typography variant="body2">• {task}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Afternoon (1 PM - 5 PM)
                      </Typography>
                      <List dense>
                        {day.afternoon_session.map((task, idx) => (
                          <ListItem key={idx} sx={{ px: 0 }}>
                            <Typography variant="body2">• {task}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Evening (6 PM - 8 PM)
                      </Typography>
                      <List dense>
                        {day.evening_session.map((task, idx) => (
                          <ListItem key={idx} sx={{ px: 0 }}>
                            <Typography variant="body2">• {task}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Topics to Skip */}
          {crashCourse.topics_to_skip.length > 0 && (
            <Alert severity="info">
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Topics to Skip (Low ROI in limited time)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {crashCourse.topics_to_skip.map((topic, index) => (
                  <Chip key={index} label={topic} size="small" variant="outlined" />
                ))}
              </Box>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
