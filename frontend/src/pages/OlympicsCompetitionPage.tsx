import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as BackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  olympicsAPI,
  ParticipationSession,
  Question,
  Answer,
  CompetitionEvent,
} from '@/api/olympics';

export default function OlympicsCompetitionPage() {
  const theme = useTheme();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<CompetitionEvent | null>(null);
  const [session, setSession] = useState<ParticipationSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (eventId) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (session && session.status === 'in_progress') {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const startSession = async () => {
    try {
      setLoading(true);
      const eventData = await olympicsAPI.getEvent(Number(eventId));
      const sessionData = await olympicsAPI.startEvent(Number(eventId));
      const questionsData = await olympicsAPI.getQuestions(Number(eventId));

      setEvent(eventData);
      setSession(sessionData);
      setQuestions(questionsData);
      setTimeRemaining(sessionData.time_remaining_seconds);
      setError(null);
    } catch (err) {
      setError('Failed to start session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !selectedAnswer) return;

    try {
      setSubmitting(true);
      const currentQuestion = questions[currentQuestionIndex];
      const answer = await olympicsAPI.submitAnswer(session.id, currentQuestion.id, selectedAnswer);

      setAnswers([...answers, answer]);
      setSelectedAnswer('');

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleCompleteSession();
      }
    } catch (err) {
      setError('Failed to submit answer');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;

    try {
      const completedSession = await olympicsAPI.completeSession(session.id);
      setSession(completedSession);
      setShowResult(true);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (showResult && session) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrophyIcon sx={{ fontSize: 80, color: theme.palette.warning.main, mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Event Completed!
              </Typography>

              <Typography variant="h2" fontWeight="bold" color="primary" sx={{ my: 3 }}>
                {session.score} / {event?.total_points}
              </Typography>

              <Typography variant="h6" color="text.secondary" gutterBottom>
                Points Earned
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold">
                    {session.answered_questions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Questions Answered
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold">
                    {answers.filter((a) => a.is_correct).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Correct Answers
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold">
                    {((session.score / (event?.total_points || 1)) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accuracy
                  </Typography>
                </Grid>
              </Grid>

              <Stack spacing={2} sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/student/olympics')}
                >
                  Back to Olympics
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(`/student/olympics/${event?.competition_id}`)}
                >
                  View Leaderboard
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {event?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event?.subject} • {event?.event_type}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={3}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                color={timeRemaining < 60 ? 'error' : 'primary'}
              >
                <TimerIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                {formatTime(timeRemaining)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Time Remaining
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {session?.score || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Points
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {progress.toFixed(0)}% Complete
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Paper>

      {currentQuestion && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Chip
                  label={currentQuestion.difficulty.toUpperCase()}
                  size="small"
                  color={
                    currentQuestion.difficulty === 'easy'
                      ? 'success'
                      : currentQuestion.difficulty === 'medium'
                        ? 'warning'
                        : 'error'
                  }
                />
                <Chip label={`${currentQuestion.points} points`} size="small" color="primary" />
                {currentQuestion.time_limit_seconds && (
                  <Chip
                    label={`${currentQuestion.time_limit_seconds}s`}
                    size="small"
                    icon={<TimerIcon />}
                  />
                )}
              </Stack>

              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {currentQuestion.question_text}
              </Typography>
            </Box>

            {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: 2,
                        borderColor:
                          selectedAnswer === option ? theme.palette.primary.main : 'divider',
                        bgcolor:
                          selectedAnswer === option
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'background.paper',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                      }}
                      onClick={() => setSelectedAnswer(option)}
                    >
                      <FormControlLabel
                        value={option}
                        control={<Radio />}
                        label={
                          <Typography
                            variant="body1"
                            fontWeight={selectedAnswer === option ? 'bold' : 'normal'}
                          >
                            {option}
                          </Typography>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                >
                  {['True', 'False'].map((option) => (
                    <Paper
                      key={option}
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: 2,
                        borderColor:
                          selectedAnswer === option ? theme.palette.primary.main : 'divider',
                        bgcolor:
                          selectedAnswer === option
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'background.paper',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                      onClick={() => setSelectedAnswer(option)}
                    >
                      <FormControlLabel
                        value={option}
                        control={<Radio />}
                        label={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {option === 'True' ? (
                              <CheckIcon color="success" />
                            ) : (
                              <CloseIcon color="error" />
                            )}
                            <Typography
                              variant="body1"
                              fontWeight={selectedAnswer === option ? 'bold' : 'normal'}
                            >
                              {option}
                            </Typography>
                          </Stack>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>
            )}

            {currentQuestion.question_type === 'short_answer' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Type your answer here..."
                variant="outlined"
              />
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                startIcon={<BackIcon />}
              >
                Previous
              </Button>

              <Button
                variant="contained"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitting}
                endIcon={
                  currentQuestionIndex === questions.length - 1 ? <CheckIcon /> : <ArrowIcon />
                }
                size="large"
              >
                {submitting
                  ? 'Submitting...'
                  : currentQuestionIndex === questions.length - 1
                    ? 'Submit & Finish'
                    : 'Submit & Next'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
