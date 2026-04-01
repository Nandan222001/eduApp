import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  Checkbox,
  Button,
  Divider,
  LinearProgress,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  WbSunny as MorningIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  ChatBubble as ChatIcon,
  Timeline as TimelineIcon,
  MoodBad as MoodBadIcon,
  Mood as MoodIcon,
  SentimentSatisfied as MoodNeutralIcon,
  SentimentVeryDissatisfied as MoodVeryBadIcon,
  SentimentVerySatisfied as MoodVeryGoodIcon,
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface SpeechRecognitionType extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionType;
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
  }
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface StudyTask {
  id: string;
  time: string;
  subject: string;
  task: string;
  duration: string;
  completed: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

type Mood = 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';

export default function AIStudyBuddy() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI Study Buddy. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([
    {
      id: '1',
      time: '09:00 AM',
      subject: 'Mathematics',
      task: 'Complete Chapter 5 exercises',
      duration: '45 min',
      completed: false,
    },
    {
      id: '2',
      time: '10:00 AM',
      subject: 'Physics',
      task: "Watch lecture on Newton's Laws",
      duration: '30 min',
      completed: false,
    },
    {
      id: '3',
      time: '11:00 AM',
      subject: 'Chemistry',
      task: 'Practice organic reactions',
      duration: '60 min',
      completed: false,
    },
    {
      id: '4',
      time: '02:00 PM',
      subject: 'English',
      task: 'Read chapters 3-4',
      duration: '40 min',
      completed: false,
    },
    {
      id: '5',
      time: '03:30 PM',
      subject: 'Biology',
      task: 'Review cell structure notes',
      duration: '30 min',
      completed: false,
    },
  ]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) return;

      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('help') || lowerInput.includes('stuck')) {
      return "I'm here to help! What specific topic are you having trouble with? I can explain concepts, provide examples, or suggest study strategies.";
    }
    if (lowerInput.includes('math') || lowerInput.includes('equation')) {
      return "Let's break down the problem step by step. First, identify what you know and what you need to find. Then we can work through it together.";
    }
    if (lowerInput.includes('exam') || lowerInput.includes('test')) {
      return 'Preparing for an exam? I recommend creating a study schedule, reviewing past papers, and focusing on areas where you need more practice. Would you like me to create a custom study plan?';
    }
    return "That's a great question! Let me help you understand this better. Could you provide more details about what you'd like to learn?";
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setStudyTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId && !task.completed) {
          triggerAchievement();
          return { ...task, completed: true };
        }
        return task;
      })
    );
  };

  const triggerAchievement = () => {
    const achievements: Achievement[] = [
      {
        id: '1',
        title: 'Task Master!',
        description: 'Completed a study task',
        icon: '🎯',
      },
      {
        id: '2',
        title: 'Consistent Learner',
        description: 'Stayed on track with your schedule',
        icon: '⭐',
      },
      {
        id: '3',
        title: 'Focus Champion',
        description: 'Completed a focused study session',
        icon: '🏆',
      },
    ];

    const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
    setRecentAchievement(randomAchievement);
    setShowConfetti(true);

    setTimeout(() => {
      setShowConfetti(false);
      setRecentAchievement(null);
    }, 5000);
  };

  const getMoodIcon = (mood: Mood) => {
    switch (mood) {
      case 'very_bad':
        return <MoodVeryBadIcon sx={{ fontSize: 48 }} />;
      case 'bad':
        return <MoodBadIcon sx={{ fontSize: 48 }} />;
      case 'neutral':
        return <MoodNeutralIcon sx={{ fontSize: 48 }} />;
      case 'good':
        return <MoodIcon sx={{ fontSize: 48 }} />;
      case 'very_good':
        return <MoodVeryGoodIcon sx={{ fontSize: 48 }} />;
    }
  };

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Study Hours',
        data: [2.5, 3.0, 2.0, 4.0, 3.5, 5.0, 4.5],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
      },
      {
        label: 'Target Hours',
        data: [3, 3, 3, 3, 3, 3, 3],
        borderColor: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  const completedTasks = studyTasks.filter((t) => t.completed).length;
  const totalTasks = studyTasks.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        AI Study Buddy
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your personalized learning companion
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <CardHeader
              title="Morning Briefing"
              avatar={
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                  <MorningIcon sx={{ color: theme.palette.warning.main }} />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                Good morning! Here&apos;s your study overview for today:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {totalTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasks Scheduled
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        3.5hrs
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Study Time
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} color="info.main">
                        2
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quizzes Due
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MoodIcon />}
                    onClick={() => setShowMoodDialog(true)}
                  >
                    How are you feeling?
                  </Button>
                  <Chip
                    label={`Current mood: ${currentMood.replace('_', ' ')}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: 600 }}>
            <CardHeader
              title="Chat with AI Buddy"
              avatar={
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <AIIcon sx={{ color: theme.palette.primary.main }} />
                </Avatar>
              }
            />
            <CardContent sx={{ height: 'calc(100% - 140px)', overflow: 'auto', pb: 0 }}>
              <List sx={{ pb: 2 }}>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      px: 0,
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        bgcolor:
                          message.sender === 'user'
                            ? theme.palette.primary.main
                            : alpha(theme.palette.grey[500], 0.1),
                        color: message.sender === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body2">{message.text}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          display: 'block',
                          opacity: 0.7,
                        }}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>
            </CardContent>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Ask me anything about your studies..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                size="small"
              />
              <Tooltip title="Voice input">
                <IconButton
                  color={isListening ? 'error' : 'default'}
                  onClick={handleVoiceInput}
                  sx={{
                    bgcolor: isListening ? alpha(theme.palette.error.main, 0.1) : 'transparent',
                  }}
                >
                  <MicIcon />
                </IconButton>
              </Tooltip>
              <IconButton color="primary" onClick={handleSendMessage}>
                <SendIcon />
              </IconButton>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <CardHeader
              title="Today's Study Plan"
              avatar={
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                  <TimelineIcon sx={{ color: theme.palette.info.main }} />
                </Avatar>
              }
              subheader={`${completedTasks}/${totalTasks} tasks completed`}
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {progressPercentage.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              </Box>
              <List sx={{ py: 0, maxHeight: 400, overflow: 'auto' }}>
                {studyTasks.map((task, index) => (
                  <Box key={task.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        opacity: task.completed ? 0.6 : 1,
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}
                    >
                      <Checkbox
                        checked={task.completed}
                        onChange={() => handleTaskToggle(task.id)}
                        sx={{ mr: 1 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {task.time}
                          </Typography>
                          <Chip label={task.subject} size="small" sx={{ height: 20 }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {task.task}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Duration: {task.duration}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < studyTasks.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Weekly Review"
              avatar={
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
                </Avatar>
              }
            />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <Line
                  data={weeklyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Hours',
                        },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>This week:</strong> You studied for 24.5 hours total. Great job staying
                  above target most days! 🎉
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {showConfetti && recentAchievement && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            textAlign: 'center',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              bgcolor: 'white',
              borderRadius: 4,
              border: `3px solid ${theme.palette.warning.main}`,
              animation: 'bounce 0.5s ease-in-out',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
              },
            }}
          >
            <Typography variant="h3" sx={{ mb: 2 }}>
              {recentAchievement.icon}
            </Typography>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {recentAchievement.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {recentAchievement.description}
            </Typography>
          </Paper>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 9998,
            }}
          >
            {[...Array(50)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  fontSize: `${Math.random() * 20 + 10}px`,
                  animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
                  '@keyframes fall': {
                    to: {
                      transform: 'translateY(100vh) rotate(360deg)',
                      opacity: 0,
                    },
                  },
                }}
              >
                🎉
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={showMoodDialog} onClose={() => setShowMoodDialog(false)}>
        <DialogTitle>How are you feeling today?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your mood helps us personalize your study experience
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {(['very_bad', 'bad', 'neutral', 'good', 'very_good'] as Mood[]).map((mood) => (
              <Grid item key={mood}>
                <Tooltip title={mood.replace('_', ' ')}>
                  <IconButton
                    onClick={() => {
                      setCurrentMood(mood);
                      setShowMoodDialog(false);
                    }}
                    sx={{
                      border: `2px solid ${currentMood === mood ? theme.palette.primary.main : 'transparent'}`,
                      bgcolor:
                        currentMood === mood
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    {getMoodIcon(mood)}
                  </IconButton>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMoodDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={() => {
          const chatElement = document.querySelector('[data-chat-card]');
          chatElement?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <ChatIcon />
      </Fab>
    </Box>
  );
}
