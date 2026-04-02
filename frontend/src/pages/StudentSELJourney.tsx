import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  EmojiPeople as EmojiPeopleIcon,
  Favorite as FavoriteIcon,
  Groups as GroupsIcon,
  QuestionMark as QuestionMarkIcon,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  SelfImprovement as MeditationIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface MoodEntry {
  id: number;
  date: Date;
  mood: number;
  note?: string;
}

interface ReflectionEntry {
  id: number;
  date: Date;
  prompt: string;
  response: string;
}

interface MindfulnessSession {
  id: number;
  date: Date;
  type: string;
  duration: number;
  completed: boolean;
}

interface SELProgress {
  competency: string;
  current: number;
  growth: number;
  color: string;
  icon: React.ReactNode;
}

const MOOD_OPTIONS = [
  { value: 1, label: 'Very Sad', icon: <SentimentVeryDissatisfied />, color: '#f44336' },
  { value: 2, label: 'Sad', icon: <SentimentDissatisfied />, color: '#ff9800' },
  { value: 3, label: 'Okay', icon: <SentimentNeutral />, color: '#ffc107' },
  { value: 4, label: 'Happy', icon: <SentimentSatisfied />, color: '#8bc34a' },
  { value: 5, label: 'Very Happy', icon: <SentimentVerySatisfied />, color: '#4caf50' },
];

const REFLECTION_PROMPTS = [
  'What made you proud today?',
  'How did you help someone today?',
  'What challenge did you overcome?',
  'What are you grateful for?',
  'How did you show kindness today?',
  'What did you learn about yourself?',
  'How did you handle a difficult situation?',
  'What goal did you work toward today?',
];

const MINDFULNESS_EXERCISES = [
  {
    id: 1,
    title: 'Deep Breathing',
    description: 'Focus on your breath to calm your mind',
    duration: 5,
    steps: [
      'Sit comfortably with your back straight',
      'Close your eyes or look down gently',
      'Breathe in slowly through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Breathe out slowly through your mouth for 4 counts',
      'Repeat for 5 minutes',
    ],
  },
  {
    id: 2,
    title: 'Body Scan',
    description: 'Notice sensations in different parts of your body',
    duration: 10,
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes',
      'Focus on your toes, notice any sensations',
      'Slowly move your attention up through your body',
      'Notice your legs, stomach, chest, arms, and head',
      'Relax any tense areas',
    ],
  },
  {
    id: 3,
    title: 'Gratitude Moment',
    description: 'Think about things you are thankful for',
    duration: 3,
    steps: [
      'Close your eyes and take a deep breath',
      'Think of three things you are grateful for today',
      'Imagine each one clearly in your mind',
      'Notice how gratitude makes you feel',
      'Smile and open your eyes',
    ],
  },
  {
    id: 4,
    title: 'Mindful Listening',
    description: 'Pay attention to sounds around you',
    duration: 5,
    steps: [
      'Sit quietly and close your eyes',
      'Listen to all the sounds around you',
      'Notice sounds far away and close by',
      'Dont judge the sounds, just notice them',
      'Focus on the silence between sounds',
    ],
  },
];

interface MoodCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (mood: number, note: string) => void;
}

function MoodCheckInDialog({ open, onClose, onSave }: MoodCheckInDialogProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (selectedMood !== null) {
      onSave(selectedMood, note);
      setSelectedMood(null);
      setNote('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">How are you feeling?</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Grid container spacing={2} justifyContent="center">
            {MOOD_OPTIONS.map((option) => (
              <Grid item key={option.value}>
                <Tooltip title={option.label} arrow>
                  <IconButton
                    onClick={() => setSelectedMood(option.value)}
                    sx={{
                      fontSize: 60,
                      color: selectedMood === option.value ? option.color : 'text.secondary',
                      border: selectedMood === option.value ? `3px solid ${option.color}` : 'none',
                      borderRadius: 2,
                      p: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: option.color,
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {option.icon}
                  </IconButton>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="What's on your mind? (optional)"
            placeholder="Share what's making you feel this way..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mt: 3 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={selectedMood === null}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ReflectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (prompt: string, response: string) => void;
}

function ReflectionDialog({ open, onClose, onSave }: ReflectionDialogProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    if (open && !selectedPrompt) {
      const randomPrompt =
        REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
      setSelectedPrompt(randomPrompt);
    }
  }, [open, selectedPrompt]);

  const handleSave = () => {
    if (response.trim()) {
      onSave(selectedPrompt, response);
      setResponse('');
      onClose();
    }
  };

  const handleNewPrompt = () => {
    const randomPrompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
    setSelectedPrompt(randomPrompt);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Daily Reflection</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              mb: 3,
            }}
          >
            <Typography variant="h6" gutterBottom>
              {selectedPrompt}
            </Typography>
            <Button size="small" onClick={handleNewPrompt}>
              Try a different prompt
            </Button>
          </Paper>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Your Reflection"
            placeholder="Take your time and share your thoughts..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!response.trim()}>
          Save Reflection
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface MindfulnessDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (exerciseId: number, duration: number) => void;
}

function MindfulnessDialog({ open, onClose, onComplete }: MindfulnessDialogProps) {
  const [selectedExercise, setSelectedExercise] = useState<
    (typeof MINDFULNESS_EXERCISES)[0] | null
  >(null);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive && selectedExercise) {
      setIsActive(false);
      onComplete(selectedExercise.id, selectedExercise.duration);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, selectedExercise, onComplete]);

  const handleStart = (exercise: (typeof MINDFULNESS_EXERCISES)[0]) => {
    setSelectedExercise(exercise);
    setTimeLeft(exercise.duration * 60);
    setCurrentStep(0);
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(!isActive);
  };

  const handleStop = () => {
    setIsActive(false);
    setSelectedExercise(null);
    setTimeLeft(0);
    setCurrentStep(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Mindfulness Exercise</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!selectedExercise ? (
          <Grid container spacing={2} sx={{ py: 2 }}>
            {MINDFULNESS_EXERCISES.map((exercise) => (
              <Grid item xs={12} sm={6} key={exercise.id}>
                <Card
                  elevation={0}
                  sx={{
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                  onClick={() => handleStart(exercise)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MeditationIcon color="primary" />
                      <Typography variant="h6">{exercise.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {exercise.description}
                    </Typography>
                    <Chip
                      icon={<TimerIcon />}
                      label={`${exercise.duration} minutes`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {formatTime(timeLeft)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time Remaining
              </Typography>
            </Box>

            <Stepper activeStep={currentStep} orientation="vertical">
              {selectedExercise.steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel>
                    <Typography variant="body1">{step}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                startIcon={isActive ? <PauseIcon /> : <PlayIcon />}
                onClick={handlePause}
                size="large"
              >
                {isActive ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="outlined" onClick={handleStop} size="large">
                Stop
              </Button>
              {currentStep < selectedExercise.steps.length - 1 && (
                <Button
                  variant="outlined"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  size="large"
                >
                  Next Step
                </Button>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface GrowthVisualizationProps {
  moodEntries: MoodEntry[];
  selProgress: SELProgress[];
}

function GrowthVisualization({ moodEntries, selProgress }: GrowthVisualizationProps) {
  const theme = useTheme();

  const moodChartData = {
    labels: moodEntries
      .slice(-14)
      .map((entry) => entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Mood Tracker',
        data: moodEntries.slice(-14).map((entry) => entry.mood),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const moodChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<'line'>) => {
            const value = tooltipItem.parsed.y ?? 0;
            return `Score: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value: number | string) => {
            const mood = MOOD_OPTIONS.find((m) => m.value === value);
            return mood ? mood.label : '';
          },
        },
      },
    },
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader title="Your SEL Growth Journey" subheader="Track your progress over time" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300 }}>
              <Typography variant="subtitle2" gutterBottom>
                Mood Trends (Last 2 Weeks)
              </Typography>
              <Line data={moodChartData} options={moodChartOptions} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              SEL Competencies Progress
            </Typography>
            <List>
              {selProgress.map((progress, index) => (
                <Box key={progress.competency}>
                  <ListItem sx={{ px: 0 }}>
                    <Box sx={{ width: '100%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: progress.color }}>{progress.icon}</Box>
                          <Typography variant="body2" fontWeight={600}>
                            {progress.competency}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {progress.growth > 0 && (
                            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          )}
                          <Typography variant="body2" fontWeight={600}>
                            {progress.current}%
                          </Typography>
                          {progress.growth > 0 && (
                            <Typography variant="caption" color="success.main">
                              (+{progress.growth}%)
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress.current}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(progress.color, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: progress.color,
                          },
                        }}
                      />
                    </Box>
                  </ListItem>
                  {index < selProgress.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function StudentSELJourney() {
  const theme = useTheme();
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [reflectionDialogOpen, setReflectionDialogOpen] = useState(false);
  const [mindfulnessDialogOpen, setMindfulnessDialogOpen] = useState(false);

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([
    { id: 1, date: new Date('2024-01-15'), mood: 4 },
    { id: 2, date: new Date('2024-01-16'), mood: 3 },
    { id: 3, date: new Date('2024-01-17'), mood: 5 },
    { id: 4, date: new Date('2024-01-18'), mood: 4 },
    { id: 5, date: new Date('2024-01-19'), mood: 4 },
    { id: 6, date: new Date('2024-01-20'), mood: 5 },
  ]);

  const [reflections, setReflections] = useState<ReflectionEntry[]>([
    {
      id: 1,
      date: new Date('2024-01-20'),
      prompt: 'What made you proud today?',
      response: 'I helped my friend understand a difficult math problem.',
    },
  ]);

  const [mindfulnessSessions, setMindfulnessSessions] = useState<MindfulnessSession[]>([
    { id: 1, date: new Date('2024-01-20'), type: 'Deep Breathing', duration: 5, completed: true },
  ]);

  const selProgress: SELProgress[] = [
    {
      competency: 'Self-Awareness',
      current: 78,
      growth: 12,
      color: '#9C27B0',
      icon: <PsychologyIcon />,
    },
    {
      competency: 'Self-Management',
      current: 65,
      growth: 8,
      color: '#2196F3',
      icon: <EmojiPeopleIcon />,
    },
    {
      competency: 'Social Awareness',
      current: 82,
      growth: 15,
      color: '#4CAF50',
      icon: <GroupsIcon />,
    },
    {
      competency: 'Relationship Skills',
      current: 90,
      growth: 5,
      color: '#FF5722',
      icon: <FavoriteIcon />,
    },
    {
      competency: 'Responsible Decision-Making',
      current: 72,
      growth: 10,
      color: '#FF9800',
      icon: <QuestionMarkIcon />,
    },
  ];

  const handleSaveMood = (mood: number, note: string) => {
    const newEntry: MoodEntry = {
      id: moodEntries.length + 1,
      date: new Date(),
      mood,
      note,
    };
    setMoodEntries([...moodEntries, newEntry]);
  };

  const handleSaveReflection = (prompt: string, response: string) => {
    const newReflection: ReflectionEntry = {
      id: reflections.length + 1,
      date: new Date(),
      prompt,
      response,
    };
    setReflections([newReflection, ...reflections]);
  };

  const handleCompleteMindfulness = (exerciseId: number, duration: number) => {
    const exercise = MINDFULNESS_EXERCISES.find((e) => e.id === exerciseId);
    const newSession: MindfulnessSession = {
      id: mindfulnessSessions.length + 1,
      date: new Date(),
      type: exercise?.title || 'Mindfulness',
      duration,
      completed: true,
    };
    setMindfulnessSessions([newSession, ...mindfulnessSessions]);
    setMindfulnessDialogOpen(false);
  };

  const todayMood = moodEntries.find(
    (entry) => entry.date.toDateString() === new Date().toDateString()
  );

  const streakDays = 7;
  const totalMindfulnessMinutes = mindfulnessSessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My SEL Journey
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your social-emotional learning and personal growth
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 56, height: 56 }}>
                  <FireIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {streakDays}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
                  <MeditationIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {totalMindfulnessMinutes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Minutes Mindful
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main, width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {reflections.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reflections
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 56, height: 56 }}>
                  <TrophyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    12
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SEL Badges
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '100%',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
            onClick={() => setMoodDialogOpen(true)}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                {todayMood ? (
                  <>
                    <Typography variant="h1" sx={{ mb: 1 }}>
                      {MOOD_OPTIONS.find((m) => m.value === todayMood.mood)?.icon}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      Today&apos;s Mood:{' '}
                      {MOOD_OPTIONS.find((m) => m.value === todayMood.mood)?.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click to update
                    </Typography>
                  </>
                ) : (
                  <>
                    <SentimentNeutral sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Mood Check-In
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      How are you feeling today?
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '100%',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
            onClick={() => setReflectionDialogOpen(true)}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <PsychologyIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Daily Reflection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share your thoughts and feelings
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '100%',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
            onClick={() => setMindfulnessDialogOpen(true)}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <MeditationIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Mindfulness Exercise
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Take a moment to breathe and relax
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <GrowthVisualization moodEntries={moodEntries} selProgress={selProgress} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader title="Recent Reflections" subheader="Your thoughts and insights" />
            <CardContent>
              <List>
                {reflections.slice(0, 5).map((reflection, index) => (
                  <Box key={reflection.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" gutterBottom>
                            {reflection.prompt}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {reflection.response}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {reflection.date.toLocaleDateString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < reflections.slice(0, 5).length - 1 && <Divider />}
                  </Box>
                ))}
                {reflections.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No reflections yet. Start your first one!
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader title="Mindfulness Sessions" subheader="Your practice history" />
            <CardContent>
              <List>
                {mindfulnessSessions.slice(0, 5).map((session, index) => (
                  <Box key={session.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                          <MeditationIcon sx={{ color: 'success.main' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={session.type}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              icon={<TimerIcon />}
                              label={`${session.duration} min`}
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {session.date.toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      {session.completed && (
                        <CheckCircleIcon sx={{ color: 'success.main', ml: 2 }} />
                      )}
                    </ListItem>
                    {index < mindfulnessSessions.slice(0, 5).length - 1 && <Divider />}
                  </Box>
                ))}
                {mindfulnessSessions.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No sessions yet. Start your first mindfulness practice!
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <MoodCheckInDialog
        open={moodDialogOpen}
        onClose={() => setMoodDialogOpen(false)}
        onSave={handleSaveMood}
      />

      <ReflectionDialog
        open={reflectionDialogOpen}
        onClose={() => setReflectionDialogOpen(false)}
        onSave={handleSaveReflection}
      />

      <MindfulnessDialog
        open={mindfulnessDialogOpen}
        onClose={() => setMindfulnessDialogOpen(false)}
        onComplete={handleCompleteMindfulness}
      />
    </Box>
  );
}
