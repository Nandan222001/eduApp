import { Paper, Typography, Box, Chip, List, ListItem, ListItemText, Avatar } from '@mui/material';
import { CheckCircle, Cancel, Schedule, RemoveCircle } from '@mui/icons-material';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';

interface RealtimeAttendanceWidgetProps {
  studentIds: number[];
  title?: string;
}

const statusIcons = {
  present: <CheckCircle color="success" />,
  absent: <Cancel color="error" />,
  late: <Schedule color="warning" />,
  half_day: <RemoveCircle color="info" />,
};

const statusColors = {
  present: 'success',
  absent: 'error',
  late: 'warning',
  half_day: 'info',
} as const;

export const RealtimeAttendanceWidget = ({
  studentIds,
  title = 'Recent Attendance Updates',
}: RealtimeAttendanceWidgetProps) => {
  const { recentUpdates } = useRealtimeAttendance(studentIds);

  if (recentUpdates.length === 0) {
    return null;
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Chip label="LIVE" color="success" size="small" sx={{ animation: 'pulse 2s infinite' }} />
      </Box>

      <List>
        {recentUpdates.map((update, index) => (
          <ListItem
            key={`${update.student_id}-${update.date}-${index}`}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              backgroundColor: 'background.paper',
            }}
          >
            <Avatar sx={{ mr: 2 }}>{statusIcons[update.status as keyof typeof statusIcons]}</Avatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{update.student_name}</Typography>
                  <Chip
                    label={update.status.replace('_', ' ').toUpperCase()}
                    color={statusColors[update.status as keyof typeof statusColors]}
                    size="small"
                  />
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {new Date(update.date).toLocaleDateString()} •{' '}
                  {update.timestamp ? new Date(update.timestamp).toLocaleTimeString() : 'Just now'}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
