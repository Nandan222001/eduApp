import { useState, useRef, useEffect } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Fab,
  alpha,
  useTheme,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Send, Mic, MicOff, SmartToy, Person, Celebration } from '@mui/icons-material';
import { DailyBriefing, StudyPlanCard, WeeklyReview, MoodCheckIn } from '@/components/studyBuddy';
import {
  ChatMessage,
  DailyBriefing as DailyBriefingType,
  DailyStudyPlan,
  StudyTask,
  WeeklyReview as WeeklyReviewType,
  Achievement,
  MoodCheckIn as MoodCheckInType,
  VoiceInputState,
} from '@/types/studyBuddy';
import ConfettiCelebration from '@/components/common/ConfettiCelebration';
import { format } from 'date-fns';

export default function AIStudyBuddy() {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [voiceInput, setVoiceInput] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
  });

  const recognitionRef = useRef<{
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  } | null>(null);

  const mockBriefing: DailyBriefingType = {
    date: new Date(),
    schedule: [
      {
        id: '1',
        time: '09:00 AM',
        subject: 'Mathematics - Calculus',
        type: 'class',
        status: 'upcoming',
      },
      {
        id: '2',
        time: '11:00 AM',
        subject: 'Physics - Mechanics',
        type: 'class',
        status: 'upcoming',
      },
      { id: '3', time: '02:00 PM', subject: 'Chemistry Quiz', type: 'exam', status: 'upcoming' },
      {
        id: '4',
        time: '04:00 PM',
        subject: 'English Essay',
        type: 'assignment',
        status: 'upcoming',
      },
    ],
    weakTopics: [
      { id: '1', subject: 'Mathematics', topic: 'Integration', score: 65, trend: 'improving' },
      { id: '2', subject: 'Physics', topic: 'Projectile Motion', score: 58, trend: 'declining' },
      { id: '3', subject: 'Chemistry', topic: 'Organic Reactions', score: 72, trend: 'stable' },
    ],
    examReadiness: [
      { subject: 'Mathematics', readiness: 85, confidence: 78, lastPracticed: '2 hours ago' },
      { subject: 'Physics', readiness: 72, confidence: 65, lastPracticed: '1 day ago' },
      { subject: 'Chemistry', readiness: 68, confidence: 70, lastPracticed: '3 days ago' },
    ],
    motivationalQuote: 'The expert in anything was once a beginner. Keep going!',
  };

  const mockStudyPlan: DailyStudyPlan = {
    date: new Date(),
    tasks: [
      {
        id: '1',
        title: 'Review Integration Formulas',
        subject: 'Mathematics',
        duration: 45,
        startTime: '05:00 PM',
        endTime: '05:45 PM',
        completed: false,
        priority: 'high',
        type: 'revision',
      },
      {
        id: '2',
        title: 'Practice Physics Problems',
        subject: 'Physics',
        duration: 60,
        startTime: '06:00 PM',
        endTime: '07:00 PM',
        completed: false,
        priority: 'high',
        type: 'practice',
      },
      {
        id: '3',
        title: 'Read Chemistry Chapter 5',
        subject: 'Chemistry',
        duration: 30,
        startTime: '07:15 PM',
        endTime: '07:45 PM',
        completed: false,
        priority: 'medium',
        type: 'reading',
      },
      {
        id: '4',
        title: 'Complete English Essay Draft',
        subject: 'English',
        duration: 45,
        startTime: '08:00 PM',
        endTime: '08:45 PM',
        completed: false,
        priority: 'high',
        type: 'assignment',
      },
    ],
    totalDuration: 180,
    completedDuration: 0,
    productivity: 85,
  };

  const mockWeeklyReview: WeeklyReviewType = {
    weekStart: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    weekEnd: new Date(),
    totalStudyHours: 24.5,
    dailySessions: [
      {
        date: format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        hours: 3.5,
        subjects: [],
      },
      {
        date: format(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        hours: 4.2,
        subjects: [],
      },
      {
        date: format(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        hours: 2.8,
        subjects: [],
      },
      {
        date: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        hours: 3.9,
        subjects: [],
      },
      {
        date: format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        hours: 4.5,
        subjects: [],
      },
      {
        date: format(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        hours: 3.2,
        subjects: [],
      },
      { date: format(new Date(), 'yyyy-MM-dd'), hours: 2.4, subjects: [] },
    ],
    performance: [
      { subject: 'Mathematics', currentScore: 85, previousScore: 78, delta: 7, trend: 'up' },
      { subject: 'Physics', currentScore: 72, previousScore: 75, delta: -3, trend: 'down' },
      { subject: 'Chemistry', currentScore: 80, previousScore: 80, delta: 0, trend: 'stable' },
      { subject: 'English', currentScore: 88, previousScore: 82, delta: 6, trend: 'up' },
    ],
    achievementsEarned: 5,
    streakDays: 12,
    topSubjects: ['English', 'Mathematics', 'Chemistry'],
    areasToImprove: ['Physics - Mechanics', 'Chemistry - Organic'],
  };

  const [studyPlan, setStudyPlan] = useState(mockStudyPlan);

  useEffect(() => {
    const initialMessage: ChatMessage = {
      id: '1',
      content:
        "Hi! I'm your AI Study Buddy. I'm here to help you stay on track with your studies. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!voiceInput.isSupported) return;

    const SpeechRecognition =
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new (SpeechRecognition as new () => unknown)() as {
      continuous: boolean;
      interimResults: boolean;
      onresult: ((event: SpeechRecognitionEvent) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');

      setVoiceInput((prev) => ({ ...prev, transcript }));

      if (event.results[0].isFinal) {
        setInputMessage(transcript);
      }
    };

    recognitionRef.current.onerror = () => {
      setVoiceInput((prev) => ({ ...prev, isListening: false }));
    };

    recognitionRef.current.onend = () => {
      setVoiceInput((prev) => ({ ...prev, isListening: false }));
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceInput.isSupported]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (voiceInput.isListening) {
      recognitionRef.current.stop();
      setVoiceInput((prev) => ({ ...prev, isListening: false }));
    } else {
      setVoiceInput((prev) => ({ ...prev, transcript: '' }));
      recognitionRef.current.start();
      setVoiceInput((prev) => ({ ...prev, isListening: true }));
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setVoiceInput((prev) => ({ ...prev, transcript: '' }));

    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return 'I can help you with:\n• Tracking your study schedule\n• Reviewing weak topics\n• Setting study goals\n• Analyzing your performance\n• Providing study tips\n\nWhat would you like to focus on?';
    }
    if (lowerMessage.includes('weak') || lowerMessage.includes('struggle')) {
      return "I see you're struggling with Integration and Projectile Motion. Let me create a focused study plan for these topics. Would you like to start with a 30-minute session on Integration?";
    }
    if (lowerMessage.includes('ready') || lowerMessage.includes('exam')) {
      return "Based on your recent performance, you're 85% ready for Mathematics! Your Chemistry exam readiness is at 68%. I recommend spending more time on Organic Reactions. Would you like specific practice problems?";
    }
    if (lowerMessage.includes('motivate') || lowerMessage.includes('tired')) {
      return "Remember: Every expert was once a beginner! You've maintained a 12-day study streak and earned 5 achievements this week. That's amazing progress! Take a short break if needed, then let's tackle that next topic together. 💪";
    }

    return "That's a great question! I'm here to support your learning journey. Feel free to ask me about your study plan, performance analytics, or any subject you need help with.";
  };

  const handleTaskToggle = (taskId: string) => {
    setStudyPlan((prev) => {
      const updatedTasks = prev.tasks.map((task) => {
        if (task.id === taskId) {
          const newCompleted = !task.completed;

          if (newCompleted && !task.completed) {
            checkForAchievements(task);
          }

          return { ...task, completed: newCompleted };
        }
        return task;
      });

      const completedDuration = updatedTasks.reduce(
        (sum, task) => sum + (task.completed ? task.duration : 0),
        0
      );

      return {
        ...prev,
        tasks: updatedTasks,
        completedDuration,
      };
    });
  };

  const checkForAchievements = (_task: StudyTask) => {
    const completedTasks = studyPlan.tasks.filter((t) => t.completed).length;

    if (completedTasks === 0) {
      const achievement: Achievement = {
        id: Date.now().toString(),
        title: 'First Step! 🎯',
        description: 'Completed your first study task today!',
        icon: '🎯',
        timestamp: new Date(),
        points: 10,
        category: 'completion',
      };
      showAchievement(achievement);
    } else if (completedTasks === studyPlan.tasks.length - 1) {
      const achievement: Achievement = {
        id: Date.now().toString(),
        title: 'Task Master! 🏆',
        description: 'Completed all study tasks for today!',
        icon: '🏆',
        timestamp: new Date(),
        points: 50,
        category: 'completion',
      };
      showAchievement(achievement);
    }
  };

  const showAchievement = (achievement: Achievement) => {
    setRecentAchievement(achievement);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setTimeout(() => setRecentAchievement(null), 2000);
    }, 5000);
  };

  const handleStartTask = (taskId: string) => {
    const task = studyPlan.tasks.find((t) => t.id === taskId);
    if (task) {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `Great! Let's start "${task.title}". I'll set a timer for ${task.duration} minutes. Focus mode activated! 🎯`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }
  };

  const handleMoodSubmit = (mood: Omit<MoodCheckInType, 'id' | 'timestamp'>) => {
    const moodEmoji = {
      excited: '🤩',
      happy: '😊',
      neutral: '😐',
      tired: '😴',
      stressed: '😰',
      confused: '😕',
    }[mood.mood];

    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `Thanks for checking in! I see you're feeling ${mood.mood} ${moodEmoji}. ${mood.energyLevel && mood.energyLevel < 50 ? 'Consider taking a short break and staying hydrated! ' : ''}Let me adjust your study plan to match your energy level.`,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setShowMoodCheckIn(false);
  };

  return (
    <Box>
      {showConfetti && <ConfettiCelebration active={showConfetti} />}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          AI Study Buddy 🤖
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your personalized AI assistant for academic success
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <DailyBriefing briefing={mockBriefing} />

            {!showMoodCheckIn && (
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
                onClick={() => setShowMoodCheckIn(true)}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    How are you feeling today?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click to check in
                  </Typography>
                </CardContent>
              </Card>
            )}

            {showMoodCheckIn && (
              <MoodCheckIn onSubmit={handleMoodSubmit} onClose={() => setShowMoodCheckIn(false)} />
            )}
          </Box>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={2}
            sx={{
              height: '700px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.primary.main,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: alpha('#fff', 0.2) }}>
                <SmartToy />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Study Buddy Chat
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Always here to help
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: theme.palette.grey[50],
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      maxWidth: '80%',
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor:
                          message.sender === 'user'
                            ? theme.palette.secondary.main
                            : theme.palette.primary.main,
                      }}
                    >
                      {message.sender === 'user' ? (
                        <Person fontSize="small" />
                      ) : (
                        <SmartToy fontSize="small" />
                      )}
                    </Avatar>
                    <Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor:
                            message.sender === 'user' ? theme.palette.secondary.main : 'white',
                          color: message.sender === 'user' ? 'white' : theme.palette.text.primary,
                          borderTopRightRadius: message.sender === 'user' ? 0 : undefined,
                          borderTopLeftRadius: message.sender === 'bot' ? 0 : undefined,
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {message.content}
                        </Typography>
                      </Paper>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: 'block' }}
                      >
                        {format(message.timestamp, 'HH:mm')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ p: 2, bgcolor: 'white', borderTop: `1px solid ${theme.palette.divider}` }}>
              {voiceInput.isListening && (
                <Chip
                  label={voiceInput.transcript || 'Listening...'}
                  size="small"
                  color="error"
                  sx={{ mb: 1, animation: 'pulse 1.5s infinite' }}
                />
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Ask me anything about your studies..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />
                {voiceInput.isSupported && (
                  <IconButton
                    onClick={toggleVoiceInput}
                    color={voiceInput.isListening ? 'error' : 'default'}
                    sx={{
                      bgcolor: voiceInput.isListening
                        ? alpha(theme.palette.error.main, 0.1)
                        : undefined,
                    }}
                  >
                    {voiceInput.isListening ? <MicOff /> : <Mic />}
                  </IconButton>
                )}
                <IconButton onClick={handleSendMessage} color="primary">
                  <Send />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <StudyPlanCard
            plan={studyPlan}
            onTaskToggle={handleTaskToggle}
            onStartTask={handleStartTask}
          />
        </Grid>

        <Grid item xs={12}>
          <WeeklyReview review={mockWeeklyReview} />
        </Grid>
      </Grid>

      {recentAchievement && (
        <Fab
          variant="extended"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: theme.palette.success.main,
            color: 'white',
            px: 3,
            py: 2,
            animation: 'slideIn 0.5s ease-out',
            '@keyframes slideIn': {
              from: {
                transform: 'translateY(100px)',
                opacity: 0,
              },
              to: {
                transform: 'translateY(0)',
                opacity: 1,
              },
            },
          }}
        >
          <Celebration sx={{ mr: 1 }} />
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {recentAchievement.title}
            </Typography>
            <Typography variant="caption">{recentAchievement.description}</Typography>
          </Box>
          <Chip
            label={`+${recentAchievement.points}`}
            size="small"
            sx={{ ml: 2, bgcolor: alpha('#fff', 0.2), color: 'white' }}
          />
        </Fab>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </Box>
  );
}
