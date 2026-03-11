import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  Alert,
  Divider,
} from '@mui/material';
import {
  Flag as FlagIcon,
  EmojiEvents as TrophyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { GoalProgress } from '@/types/parent';

interface GoalTrackingViewProps {
  goals: GoalProgress[];
}

export const GoalTrackingView: React.FC<GoalTrackingViewProps> = ({ goals }) => {
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'primary';
    if (percentage >= 25) return 'warning';
    return 'error';
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
      case 'grade':
        return <TrophyIcon fontSize="small" />;
      case 'attendance':
        return <ScheduleIcon fontSize="small" />;
      default:
        return <FlagIcon fontSize="small" />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <FlagIcon color="primary" />
          <Typography variant="h6">Goal Tracking</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {activeGoals.length} active • {completedGoals.length} completed
        </Typography>

        {goals.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No goals set yet. Encourage your child to set learning goals!
          </Alert>
        ) : (
          <List sx={{ mt: 2, maxHeight: 500, overflow: 'auto' }}>
            {goals.map((goal, index) => (
              <React.Fragment key={goal.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 2,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} width="100%" mb={1}>
                    {getGoalTypeIcon(goal.goal_type)}
                    <Typography variant="subtitle2" fontWeight="bold" flex={1}>
                      {goal.title}
                    </Typography>
                    <Chip label={goal.status} color={getStatusColor(goal.status)} size="small" />
                  </Box>

                  {goal.description && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {goal.description}
                    </Typography>
                  )}

                  <Box width="100%" mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {goal.current_value.toFixed(1)} / {goal.target_value.toFixed(1)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(goal.progress_percentage, 100)}
                      color={getProgressColor(goal.progress_percentage)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {goal.progress_percentage.toFixed(1)}% complete
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {goal.days_remaining > 0
                          ? `${goal.days_remaining} days left`
                          : goal.days_remaining === 0
                            ? 'Due today'
                            : 'Overdue'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1}>
                    <Chip label={goal.goal_type} size="small" variant="outlined" />
                    <Chip
                      label={`${format(parseISO(goal.start_date), 'MMM d')} - ${format(parseISO(goal.end_date), 'MMM d')}`}
                      size="small"
                      variant="outlined"
                      icon={<ScheduleIcon />}
                    />
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
