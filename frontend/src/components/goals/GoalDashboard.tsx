import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  School as SchoolIcon,
  Psychology as BehaviorIcon,
  Build as SkillIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { Goal, GoalType, GoalStatus } from '@/types/goals';
import { format } from 'date-fns';

interface GoalDashboardProps {
  goals: Goal[];
  onGoalClick: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

const goalTypeIcons: Record<GoalType, React.ReactElement> = {
  performance: <SchoolIcon />,
  behavioral: <BehaviorIcon />,
  skill: <SkillIcon />,
};

const goalTypeColors: Record<GoalType, 'primary' | 'secondary' | 'info'> = {
  performance: 'primary',
  behavioral: 'secondary',
  skill: 'info',
};

const goalStatusColors: Record<GoalStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  not_started: 'default',
  in_progress: 'info',
  completed: 'success',
  overdue: 'error',
};

export default function GoalDashboard({
  goals,
  onGoalClick,
  onEditGoal,
  onDeleteGoal,
}: GoalDashboardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, goal: Goal) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedGoal(goal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGoal(null);
  };

  const handleEdit = () => {
    if (selectedGoal) {
      onEditGoal(selectedGoal);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedGoal) {
      onDeleteGoal(selectedGoal.id);
    }
    handleMenuClose();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'info';
    if (progress >= 25) return 'warning';
    return 'error';
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      <Grid container spacing={3}>
        {goals.map((goal) => {
          const daysRemaining = getDaysRemaining(goal.targetDate);
          const isOverdue = daysRemaining < 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={goal.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => onGoalClick(goal)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          bgcolor: `${goalTypeColors[goal.type]}.light`,
                          color: `${goalTypeColors[goal.type]}.main`,
                          p: 1,
                          borderRadius: 2,
                          display: 'flex',
                        }}
                      >
                        {goalTypeIcons[goal.type]}
                      </Box>
                      <Chip
                        label={goal.type}
                        size="small"
                        color={goalTypeColors[goal.type]}
                        variant="outlined"
                      />
                    </Box>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, goal)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                    {goal.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {goal.description}
                  </Typography>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {goal.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progress}
                      color={getProgressColor(goal.progress)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={goal.status.replace('_', ' ')}
                        size="small"
                        color={goalStatusColors[goal.status]}
                      />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Target Date
                      </Typography>
                      <Typography variant="caption" fontWeight={500}>
                        {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>

                    {!goal.completedDate && (
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Days Remaining
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={500}
                          color={isOverdue ? 'error' : 'success.main'}
                        >
                          {isOverdue
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days`}
                        </Typography>
                      </Box>
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Milestones
                      </Typography>
                      <Typography variant="caption" fontWeight={500}>
                        {goal.milestones.filter((m) => m.status === 'completed').length} /{' '}
                        {goal.milestones.length}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>Edit Goal</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete Goal
        </MenuItem>
      </Menu>
    </>
  );
}
