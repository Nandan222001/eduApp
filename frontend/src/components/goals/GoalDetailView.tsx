import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Stack,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Goal, GoalType, Milestone } from '@/types/goals';
import { format } from 'date-fns';
import GoalTimeline from './GoalTimeline';

interface GoalDetailViewProps {
  goal: Goal;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateMilestone: (milestoneId: string, progress: number) => void;
  onCompleteMilestone: (milestoneId: string) => void;
}

const goalTypeColors: Record<GoalType, 'primary' | 'secondary' | 'info'> = {
  performance: 'primary',
  behavioral: 'secondary',
  skill: 'info',
};

export default function GoalDetailView({
  goal,
  onClose,
  onEdit,
  onDelete,
  onUpdateMilestone,
  onCompleteMilestone,
}: GoalDetailViewProps) {
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

  const daysRemaining = getDaysRemaining(goal.targetDate);
  const isOverdue = daysRemaining < 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={600}>
            {goal.title}
          </Typography>
          <Chip label={goal.type} color={goalTypeColors[goal.type]} />
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<EditIcon />} onClick={onEdit} variant="outlined">
            Edit
          </Button>
          <Button startIcon={<DeleteIcon />} onClick={onDelete} variant="outlined" color="error">
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {goal.description}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  SMART Criteria
                </Typography>
                <Stack spacing={2} mt={2}>
                  {[
                    { label: 'Specific', value: goal.specific },
                    { label: 'Measurable', value: goal.measurable },
                    { label: 'Achievable', value: goal.achievable },
                    { label: 'Relevant', value: goal.relevant },
                    { label: 'Time-Bound', value: goal.timeBound },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Milestones
                </Typography>
                <Stack spacing={2} mt={2}>
                  {goal.milestones.map((milestone) => (
                    <MilestoneItem
                      key={milestone.id}
                      milestone={milestone}
                      onUpdateProgress={(progress) => onUpdateMilestone(milestone.id, progress)}
                      onComplete={() => onCompleteMilestone(milestone.id)}
                    />
                  ))}
                  {goal.milestones.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No milestones defined for this goal
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom mb={3}>
                  Timeline
                </Typography>
                <GoalTimeline goal={goal} />
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Progress
                </Typography>
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="h3" fontWeight={700} color="primary">
                      {goal.progress}%
                    </Typography>
                    <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={goal.progress}
                    color={getProgressColor(goal.progress)}
                    sx={{ height: 12, borderRadius: 6, mt: 2 }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Details
                </Typography>
                <Stack spacing={2} mt={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={goal.status.replace('_', ' ')}
                        size="small"
                        color={
                          goal.status === 'completed'
                            ? 'success'
                            : goal.status === 'in_progress'
                              ? 'info'
                              : goal.status === 'overdue'
                                ? 'error'
                                : 'default'
                        }
                      />
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2" fontWeight={500} mt={0.5}>
                      {format(new Date(goal.startDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Target Date
                    </Typography>
                    <Typography variant="body2" fontWeight={500} mt={0.5}>
                      {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>

                  {goal.completedDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Completed Date
                      </Typography>
                      <Typography variant="body2" fontWeight={500} mt={0.5} color="success.main">
                        {format(new Date(goal.completedDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  )}

                  {!goal.completedDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Days Remaining
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight={600}
                        mt={0.5}
                        color={isOverdue ? 'error' : 'success.main'}
                      >
                        {isOverdue ? Math.abs(daysRemaining) : daysRemaining}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isOverdue ? 'days overdue' : 'days left'}
                      </Typography>
                    </Box>
                  )}

                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Milestones Completed
                    </Typography>
                    <Typography variant="h4" fontWeight={600} mt={0.5}>
                      {goal.milestones.filter((m) => m.status === 'completed').length}
                      <Typography
                        component="span"
                        variant="h6"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        / {goal.milestones.length}
                      </Typography>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

interface MilestoneItemProps {
  milestone: Milestone;
  onUpdateProgress: (progress: number) => void;
  onComplete: () => void;
}

function MilestoneItem({ milestone, onComplete }: MilestoneItemProps) {
  const isCompleted = milestone.status === 'completed';

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" alignItems="start" gap={2}>
        <IconButton
          size="small"
          onClick={onComplete}
          disabled={isCompleted}
          color={isCompleted ? 'success' : 'default'}
        >
          {isCompleted ? <CheckCircleIcon /> : <UncheckedIcon />}
        </IconButton>
        <Box flex={1}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
          >
            {milestone.title}
          </Typography>
          {milestone.description && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {milestone.description}
            </Typography>
          )}
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {milestone.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={milestone.progress}
              color={isCompleted ? 'success' : 'primary'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Typography variant="caption" color="text.secondary">
              Target: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
            </Typography>
            {milestone.completedDate && (
              <Typography variant="caption" color="success.main" fontWeight={500}>
                Completed: {format(new Date(milestone.completedDate), 'MMM dd, yyyy')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
