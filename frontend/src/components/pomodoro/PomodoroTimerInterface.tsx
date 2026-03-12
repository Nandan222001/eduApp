import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  useTheme,
  alpha,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  LightbulbOutlined as TipsIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import pomodoroApi from '@/api/pomodoro';
import { PomodoroSettings, PomodoroSession, Subject } from '@/types/pomodoro';
import PomodoroSettingsDialog from './PomodoroSettingsDialog';
import BreakSuggestionsModal from './BreakSuggestionsModal';

type TimerState = 'idle' | 'running' | 'paused' | 'break';

export default function PomodoroTimerInterface() {
  const theme = useTheme();
  const { user } = useAuth();
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [sessionType, setSessionType] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const studentId = user?.id ? parseInt(user.id, 10) : 1;
      const [settingsData, subjectsData] = await Promise.all([
        pomodoroApi.getSettings(studentId),
        pomodoroApi.getSubjects(studentId),
      ]);
      setSettings(settingsData);
      setSubjects(subjectsData);
      setTimeRemaining(settingsData.work_duration * 60);
      setTotalTime(settingsData.work_duration * 60);
      setError(null);
    } catch (err) {
      setError('Failed to load timer settings');
      setSettings({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        sessions_until_long_break: 4,
        auto_start_breaks: false,
        auto_start_work: false,
        sound_enabled: true,
        notification_enabled: true,
      });
      setTimeRemaining(25 * 60);
      setTotalTime(25 * 60);
    } finally {
      setLoading(false);
    }
  };

  const playSound = () => {
    if (settings?.sound_enabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const showNotification = (title: string, body: string) => {
    if (settings?.notification_enabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  const startTimer = async () => {
    if (!settings) return;

    try {
      const studentId = user?.id ? parseInt(user.id, 10) : 1;
      const session = await pomodoroApi.startSession(studentId, {
        session_type: sessionType,
        duration_minutes: totalTime / 60,
        subject_id: selectedSubject ? Number(selectedSubject) : undefined,
      });

      setCurrentSession(session);
      setTimerState('running');

      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Failed to start session');
    }
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState('paused');
  };

  const resumeTimer = () => {
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (currentSession) {
      try {
        const studentId = user?.id ? parseInt(user.id, 10) : 1;
        await pomodoroApi.interruptSession(studentId, currentSession.id);
      } catch (err) {
        console.error('Failed to mark session as interrupted');
      }
    }

    resetTimer();
  };

  const handleTimerComplete = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (currentSession) {
      try {
        const studentId = user?.id ? parseInt(user.id, 10) : 1;
        await pomodoroApi.completeSession(studentId, currentSession.id);
      } catch (err) {
        console.error('Failed to mark session as completed');
      }
    }

    playSound();

    if (sessionType === 'work') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      showNotification(
        'Work Session Complete! 🎉',
        "Great job! Time for a break. Don't forget to stretch!"
      );
      setBreakModalOpen(true);
      switchToBreak(newCount);
    } else {
      showNotification('Break Complete! ⏰', 'Ready to get back to work? Start a new session!');
      switchToWork();
    }
  };

  const switchToBreak = (count: number) => {
    if (!settings) return;

    const isLongBreak = count % settings.sessions_until_long_break === 0;
    const breakType = isLongBreak ? 'long_break' : 'short_break';
    const duration = isLongBreak ? settings.long_break_duration : settings.short_break_duration;

    setSessionType(breakType);
    setTimeRemaining(duration * 60);
    setTotalTime(duration * 60);
    setTimerState('break');

    if (settings.auto_start_breaks) {
      setTimeout(() => {
        startTimer();
      }, 1000);
    } else {
      setTimerState('idle');
    }
  };

  const switchToWork = () => {
    if (!settings) return;

    setSessionType('work');
    setTimeRemaining(settings.work_duration * 60);
    setTotalTime(settings.work_duration * 60);

    if (settings.auto_start_work) {
      setTimeout(() => {
        startTimer();
      }, 1000);
    } else {
      setTimerState('idle');
    }
  };

  const resetTimer = () => {
    if (!settings) return;

    setTimerState('idle');
    setCurrentSession(null);
    const duration =
      sessionType === 'work'
        ? settings.work_duration
        : sessionType === 'short_break'
          ? settings.short_break_duration
          : settings.long_break_duration;
    setTimeRemaining(duration * 60);
    setTotalTime(duration * 60);
  };

  const handleSettingsSave = async (newSettings: PomodoroSettings) => {
    try {
      const studentId = user?.id ? parseInt(user.id, 10) : 1;
      const updated = await pomodoroApi.updateSettings(studentId, newSettings);
      setSettings(updated);
      if (timerState === 'idle') {
        const duration =
          sessionType === 'work'
            ? updated.work_duration
            : sessionType === 'short_break'
              ? updated.short_break_duration
              : updated.long_break_duration;
        setTimeRemaining(duration * 60);
        setTotalTime(duration * 60);
      }
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  const getTimerColor = (): string => {
    if (sessionType === 'work') {
      return theme.palette.primary.main;
    } else if (sessionType === 'short_break') {
      return theme.palette.success.main;
    } else {
      return theme.palette.info.main;
    }
  };

  const getSessionLabel = (): string => {
    if (sessionType === 'work') return 'Focus Session';
    if (sessionType === 'short_break') return 'Short Break';
    return 'Long Break';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              background: alpha(getTimerColor(), 0.03),
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    mb: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Chip
                    label={getSessionLabel()}
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      bgcolor: alpha(getTimerColor(), 0.1),
                      color: getTimerColor(),
                      px: 2,
                      py: 3,
                    }}
                  />
                  <IconButton onClick={() => setSettingsOpen(true)}>
                    <SettingsIcon />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                    mb: 4,
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={280}
                    thickness={2}
                    sx={{
                      color: alpha(getTimerColor(), 0.1),
                      position: 'absolute',
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={getProgress()}
                    size={280}
                    thickness={2}
                    sx={{
                      color: getTimerColor(),
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: '4rem',
                        fontWeight: 700,
                        color: getTimerColor(),
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatTime(timeRemaining)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                  {timerState === 'idle' && (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayIcon />}
                      onClick={startTimer}
                      sx={{
                        px: 6,
                        py: 2,
                        fontSize: '1.125rem',
                        bgcolor: getTimerColor(),
                        '&:hover': {
                          bgcolor: getTimerColor(),
                          filter: 'brightness(0.9)',
                        },
                      }}
                    >
                      Start
                    </Button>
                  )}

                  {timerState === 'running' && (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<PauseIcon />}
                        onClick={pauseTimer}
                        sx={{ px: 4, py: 2, fontSize: '1.125rem' }}
                      >
                        Pause
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<StopIcon />}
                        onClick={stopTimer}
                        color="error"
                        sx={{ px: 4, py: 2, fontSize: '1.125rem' }}
                      >
                        Stop
                      </Button>
                    </>
                  )}

                  {timerState === 'paused' && (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayIcon />}
                        onClick={resumeTimer}
                        sx={{ px: 4, py: 2, fontSize: '1.125rem' }}
                      >
                        Resume
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<StopIcon />}
                        onClick={stopTimer}
                        color="error"
                        sx={{ px: 4, py: 2, fontSize: '1.125rem' }}
                      >
                        Stop
                      </Button>
                    </>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Chip
                    label={`Session ${sessionCount + 1}`}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={`Until long break: ${settings ? settings.sessions_until_long_break - (sessionCount % settings.sessions_until_long_break) : 4}`}
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Subject Selector
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  label="Select Subject"
                  onChange={(e) => setSelectedSubject(e.target.value as number | '')}
                  disabled={timerState !== 'idle'}
                >
                  <MenuItem value="">
                    <em>No Subject</em>
                  </MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TipsIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Study Tips
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                🎯 Eliminate distractions before starting
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                💧 Stay hydrated during breaks
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                👀 Follow the 20-20-20 rule for eye health
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🧘 Stretch and move during breaks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {settings && (
        <PomodoroSettingsDialog
          open={settingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
      )}

      <BreakSuggestionsModal
        open={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        breakType={sessionType === 'long_break' ? 'long' : 'short'}
      />
    </Box>
  );
}
