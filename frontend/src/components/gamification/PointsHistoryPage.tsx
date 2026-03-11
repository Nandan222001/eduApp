import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  School as SchoolIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { gamificationAPI } from '../../api/gamification';
import { PointHistory, EventType } from '../../types/gamification';
import { format, formatDistanceToNow } from 'date-fns';

interface PointsHistoryPageProps {
  userId: number;
  institutionId: number;
}

const eventTypeConfig: Record<
  EventType,
  { icon: React.ReactElement; color: string; label: string }
> = {
  [EventType.ATTENDANCE]: {
    icon: <CheckIcon />,
    color: '#4caf50',
    label: 'Attendance',
  },
  [EventType.ASSIGNMENT_SUBMIT]: {
    icon: <AssignmentIcon />,
    color: '#2196f3',
    label: 'Assignment Submitted',
  },
  [EventType.ASSIGNMENT_GRADE]: {
    icon: <TrophyIcon />,
    color: '#ff9800',
    label: 'Assignment Graded',
  },
  [EventType.EXAM_PASS]: {
    icon: <SchoolIcon />,
    color: '#9c27b0',
    label: 'Exam Passed',
  },
  [EventType.EXAM_EXCELLENT]: {
    icon: <StarIcon />,
    color: '#ffd700',
    label: 'Excellent Performance',
  },
  [EventType.GOAL_COMPLETE]: {
    icon: <TrendingUpIcon />,
    color: '#00bcd4',
    label: 'Goal Completed',
  },
  [EventType.MILESTONE_ACHIEVE]: {
    icon: <TrophyIcon />,
    color: '#e91e63',
    label: 'Milestone Achieved',
  },
  [EventType.DAILY_LOGIN]: {
    icon: <CheckIcon />,
    color: '#8bc34a',
    label: 'Daily Login',
  },
  [EventType.STREAK]: {
    icon: <FireIcon />,
    color: '#ff5722',
    label: 'Streak Bonus',
  },
  [EventType.BADGE_EARN]: {
    icon: <StarIcon />,
    color: '#ffc107',
    label: 'Badge Earned',
  },
};

const PointsHistoryPage: React.FC<PointsHistoryPageProps> = ({ userId, institutionId }) => {
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, institutionId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await gamificationAPI.getPointHistory(userId, institutionId, 100);
      setHistory(data);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load points history');
    } finally {
      setLoading(false);
    }
  };

  const getEventConfig = (eventType: EventType) => {
    return eventTypeConfig[eventType] || eventTypeConfig[EventType.DAILY_LOGIN];
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Points History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track all your earned points and activities
        </Typography>
      </Box>

      {history.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No activity yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Start completing activities to earn points!
          </Typography>
        </Paper>
      ) : (
        <Card>
          <CardContent>
            <List>
              {history.map((item, index) => {
                const config = getEventConfig(item.event_type);
                return (
                  <React.Fragment key={item.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        py: 2,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: config.color, width: 48, height: 48 }}>
                          {config.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight="bold">
                              {item.description}
                            </Typography>
                            <Chip
                              label={`${item.points > 0 ? '+' : ''}${item.points} pts`}
                              color={item.points > 0 ? 'success' : 'error'}
                              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Box mt={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={config.label}
                                size="small"
                                sx={{
                                  bgcolor: `${config.color}20`,
                                  color: config.color,
                                  fontWeight: 600,
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                •{' '}
                                {formatDistanceToNow(new Date(item.created_at), {
                                  addSuffix: true,
                                })}
                              </Typography>
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < history.length - 1 && (
                      <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default PointsHistoryPage;
