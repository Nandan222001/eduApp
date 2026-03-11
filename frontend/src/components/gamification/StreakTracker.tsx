import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Tooltip,
  styled,
  LinearProgress,
} from '@mui/material';
import { LocalFireDepartment as FireIcon } from '@mui/icons-material';
import { gamificationAPI } from '../../api/gamification';
import { StreakTracker as StreakTrackerType, UserPoints } from '../../types/gamification';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface StreakTrackerProps {
  userId: number;
  institutionId: number;
}

const DayCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'today',
})<{ active?: boolean; today?: boolean }>(({ theme, active, today }) => ({
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  fontSize: '0.875rem',
  fontWeight: today ? 'bold' : 'normal',
  backgroundColor: active
    ? theme.palette.error.main
    : today
      ? theme.palette.action.selected
      : 'transparent',
  color: active ? theme.palette.error.contrastText : theme.palette.text.primary,
  border: today ? `2px solid ${theme.palette.primary.main}` : '1px solid',
  borderColor: today ? theme.palette.primary.main : theme.palette.divider,
  transition: 'all 0.2s',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: theme.shadows[2],
  },
}));

const StreakTracker: React.FC<StreakTrackerProps> = ({ userId, institutionId }) => {
  const [streaks, setStreaks] = useState<StreakTrackerType[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDays, setActiveDays] = useState<Date[]>([]);

  useEffect(() => {
    loadStreakData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, institutionId]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const [streakData, pointsData] = await Promise.all([
        gamificationAPI.getUserStreaks(userId, institutionId),
        gamificationAPI.getUserPoints(userId, institutionId),
      ]);
      setStreaks(streakData);
      setUserPoints(pointsData);

      if (pointsData.current_streak > 0 && pointsData.last_activity_date) {
        const lastActivity = new Date(pointsData.last_activity_date);
        const days: Date[] = [];
        for (let i = 0; i < pointsData.current_streak; i++) {
          const day = new Date(lastActivity);
          day.setDate(day.getDate() - i);
          days.push(day);
        }
        setActiveDays(days);
      }
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const firstDayOfWeek = monthStart.getDay();
    const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    return (
      <Box>
        <Grid container spacing={0.5} sx={{ mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item key={day} xs={12 / 7}>
              <Typography
                variant="caption"
                align="center"
                display="block"
                fontWeight="bold"
                color="text.secondary"
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={0.5}>
          {emptyCells.map((i) => (
            <Grid item key={`empty-${i}`} xs={12 / 7}>
              <DayCell />
            </Grid>
          ))}
          {daysInMonth.map((day) => {
            const isActive = activeDays.some((activeDay) => isSameDay(activeDay, day));
            const isToday = isSameDay(day, today);

            return (
              <Grid item key={day.toISOString()} xs={12 / 7}>
                <Tooltip
                  title={
                    isActive
                      ? `Active on ${format(day, 'MMM dd, yyyy')}`
                      : isToday
                        ? 'Today'
                        : format(day, 'MMM dd, yyyy')
                  }
                  arrow
                >
                  <DayCell active={isActive} today={isToday}>
                    {format(day, 'd')}
                  </DayCell>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const getStreakMilestone = (streak: number): { next: number; percentage: number } => {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const nextMilestone = milestones.find((m) => m > streak) || milestones[milestones.length - 1];
    const prevMilestone = milestones.reverse().find((m) => m <= streak) || 0;
    const range = nextMilestone - prevMilestone;
    const progress = streak - prevMilestone;
    const percentage = range > 0 ? (progress / range) * 100 : 0;
    return { next: nextMilestone, percentage };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const currentStreak = userPoints?.current_streak || 0;
  const longestStreak = userPoints?.longest_streak || 0;
  const { next: nextMilestone, percentage: milestoneProgress } = getStreakMilestone(currentStreak);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Streak Tracker 🔥
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Keep your learning streak alive!
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{ height: '100%', background: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)' }}
          >
            <CardContent sx={{ textAlign: 'center', color: 'white' }}>
              <FireIcon sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h2" fontWeight="bold" gutterBottom>
                {currentStreak}
              </Typography>
              <Typography variant="h6">Current Streak</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Days in a row
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Longest Streak
              </Typography>
              <Typography variant="h2" fontWeight="bold" color="primary.main" gutterBottom>
                {longestStreak}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your personal best
              </Typography>
              {currentStreak === longestStreak && currentStreak > 0 && (
                <Paper
                  sx={{
                    mt: 2,
                    p: 1,
                    bgcolor: 'success.light',
                    color: 'success.contrastText',
                  }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    🎉 You&apos;re on your best streak!
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Next Milestone
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Progress to {nextMilestone} days</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentStreak} / {nextMilestone}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={milestoneProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #ff5722 0%, #ff9800 100%)',
                      },
                    }}
                  />
                </Box>
                <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                  <Typography variant="caption" color="info.dark">
                    💡 Keep logging in daily to maintain your streak and earn bonus points!
                  </Typography>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Calendar - {format(new Date(), 'MMMM yyyy')}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Days marked with 🔥 indicate active learning days
              </Typography>
              {renderCalendar()}
            </CardContent>
          </Card>
        </Grid>

        {streaks.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Streak Breakdown
                </Typography>
                <Grid container spacing={2} mt={1}>
                  {streaks.map((streak) => (
                    <Grid item xs={12} sm={6} md={4} key={streak.id}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {streak.streak_type.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                          {streak.current_streak} days
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Best: {streak.longest_streak} days
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default StreakTracker;
