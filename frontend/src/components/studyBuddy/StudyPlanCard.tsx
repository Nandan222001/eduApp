import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  LinearProgress,
  Chip,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { PlayArrow, CheckCircle, AccessTime, TrendingUp } from '@mui/icons-material';
import { DailyStudyPlan, StudyTask } from '@/types/studyBuddy';

interface StudyPlanCardProps {
  plan: DailyStudyPlan;
  onTaskToggle: (taskId: string) => void;
  onStartTask?: (taskId: string) => void;
}

export default function StudyPlanCard({ plan, onTaskToggle, onStartTask }: StudyPlanCardProps) {
  const theme = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      revision: '📖',
      practice: '✍️',
      reading: '📚',
      assignment: '📝',
    };
    return iconMap[type] || '📌';
  };

  const completionPercentage = (plan.completedDuration / plan.totalDuration) * 100;

  return (
    <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Today&apos;s Study Plan
            </Typography>
          </Box>
          <Chip
            label={`${plan.productivity}% Productive`}
            size="small"
            color={plan.productivity >= 70 ? 'success' : 'warning'}
            icon={<TrendingUp />}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {plan.completedDuration} / {plan.totalDuration} min
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              },
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {plan.tasks.map((task: StudyTask) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                mb: 1.5,
                borderRadius: 2,
                bgcolor: task.completed
                  ? alpha(theme.palette.success.main, 0.05)
                  : theme.palette.background.default,
                border: `1px solid ${task.completed ? alpha(theme.palette.success.main, 0.2) : theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: task.completed
                    ? alpha(theme.palette.success.main, 0.08)
                    : alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Checkbox
                checked={task.completed}
                onChange={() => onTaskToggle(task.id)}
                icon={
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      border: `2px solid ${theme.palette.divider}`,
                      borderRadius: '50%',
                    }}
                  />
                }
                checkedIcon={<CheckCircle />}
                sx={{
                  color: theme.palette.grey[400],
                  '&.Mui-checked': {
                    color: theme.palette.success.main,
                  },
                }}
              />

              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                    {getTypeIcon(task.type)}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed
                        ? theme.palette.text.secondary
                        : theme.palette.text.primary,
                    }}
                  >
                    {task.title}
                  </Typography>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getPriorityColor(task.priority),
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {task.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.startTime} - {task.endTime}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.duration} min
                  </Typography>
                </Box>
              </Box>

              {!task.completed && onStartTask && (
                <IconButton
                  size="small"
                  onClick={() => onStartTask(task.id)}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <PlayArrow color="primary" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>

        {plan.tasks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No tasks scheduled for today
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
