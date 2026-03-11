import { Box, Typography, Stack } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Flag as FlagIcon,
  PlayArrow as StartIcon,
} from '@mui/icons-material';
import { Goal } from '@/types/goals';
import { format, parseISO } from 'date-fns';

interface GoalTimelineProps {
  goal: Goal;
}

export default function GoalTimeline({ goal }: GoalTimelineProps) {
  const timelineEvents = [
    {
      date: goal.startDate,
      title: 'Goal Started',
      icon: <StartIcon />,
      color: 'primary.main',
      completed: true,
    },
    ...goal.milestones.map((milestone) => ({
      date: milestone.targetDate,
      title: milestone.title,
      icon: milestone.status === 'completed' ? <CheckCircleIcon /> : <UncheckedIcon />,
      color: milestone.status === 'completed' ? 'success.main' : 'text.secondary',
      completed: milestone.status === 'completed',
    })),
    {
      date: goal.targetDate,
      title: 'Target Completion',
      icon: <FlagIcon />,
      color: goal.status === 'completed' ? 'success.main' : 'warning.main',
      completed: goal.status === 'completed',
    },
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Stack spacing={3} sx={{ position: 'relative', pl: 2 }}>
      <Box
        sx={{
          position: 'absolute',
          left: 20,
          top: 20,
          bottom: 20,
          width: 2,
          bgcolor: 'divider',
        }}
      />
      {timelineEvents.map((event, index) => (
        <Box key={index} sx={{ position: 'relative', display: 'flex', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: event.completed ? event.color : 'background.paper',
              border: 2,
              borderColor: event.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: event.completed ? 'white' : event.color,
              zIndex: 1,
            }}
          >
            {event.icon}
          </Box>
          <Box flex={1} pt={0.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              {event.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(parseISO(event.date), 'MMM dd, yyyy')}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
