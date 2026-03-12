import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useState } from 'react';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';
import type { NotificationPreferences, NotificationChannel } from '@/types/settings';

const notificationTypes = [
  { key: 'assignment_created', label: 'New Assignment Created' },
  { key: 'assignment_graded', label: 'Assignment Graded' },
  { key: 'exam_scheduled', label: 'Exam Scheduled' },
  { key: 'exam_result_published', label: 'Exam Result Published' },
  { key: 'announcement_posted', label: 'Announcement Posted' },
  { key: 'message_received', label: 'Message Received' },
  { key: 'goal_achieved', label: 'Goal Achieved' },
  { key: 'badge_earned', label: 'Badge Earned' },
  { key: 'attendance_marked', label: 'Attendance Marked' },
  { key: 'fee_due', label: 'Fee Due Reminder' },
  { key: 'material_shared', label: 'Study Material Shared' },
  { key: 'doubt_answered', label: 'Doubt Answered' },
];

const channels = [
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push' },
  { key: 'sms', label: 'SMS' },
  { key: 'inApp', label: 'In-App' },
];

export default function NotificationPreferencesManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: settingsApi.getNotificationPreferences,
  });

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);

  const updatePreferencesMutation = useMutation({
    mutationFn: settingsApi.updateNotificationPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationPreferences'], data);
      showToast('Notification preferences updated successfully', 'success');
      setLocalPreferences(null);
    },
    onError: () => {
      showToast('Failed to update notification preferences', 'error');
    },
  });

  const currentPreferences = localPreferences || preferences;

  const handleChannelToggle = (
    notificationType: keyof NotificationPreferences,
    channel: keyof NotificationChannel
  ) => {
    if (!currentPreferences) return;

    setLocalPreferences({
      ...currentPreferences,
      [notificationType]: {
        ...currentPreferences[notificationType],
        [channel]: !currentPreferences[notificationType][channel],
      },
    });
  };

  const handleEnableAll = (channel: keyof NotificationChannel) => {
    if (!currentPreferences) return;

    const updated = { ...currentPreferences };
    notificationTypes.forEach((type) => {
      const key = type.key as keyof NotificationPreferences;
      updated[key] = {
        ...updated[key],
        [channel]: true,
      };
    });
    setLocalPreferences(updated);
  };

  const handleDisableAll = (channel: keyof NotificationChannel) => {
    if (!currentPreferences) return;

    const updated = { ...currentPreferences };
    notificationTypes.forEach((type) => {
      const key = type.key as keyof NotificationPreferences;
      updated[key] = {
        ...updated[key],
        [channel]: false,
      };
    });
    setLocalPreferences(updated);
  };

  const handleSave = () => {
    if (localPreferences) {
      updatePreferencesMutation.mutate(localPreferences);
    }
  };

  const handleReset = () => {
    setLocalPreferences(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentPreferences) {
    return (
      <Alert severity="info">
        Unable to load notification preferences. Please try again later.
      </Alert>
    );
  }

  const isDirty = localPreferences !== null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose how you want to receive notifications for different events
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Notification Type</TableCell>
              {channels.map((channel) => (
                <TableCell key={channel.key} align="center" sx={{ fontWeight: 'bold' }}>
                  <Box>
                    <Typography variant="body2">{channel.label}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 1 }}>
                      <Button
                        size="small"
                        onClick={() => handleEnableAll(channel.key as keyof NotificationChannel)}
                      >
                        All
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleDisableAll(channel.key as keyof NotificationChannel)}
                      >
                        None
                      </Button>
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {notificationTypes.map((type) => (
              <TableRow key={type.key} hover>
                <TableCell>{type.label}</TableCell>
                {channels.map((channel) => (
                  <TableCell key={channel.key} align="center">
                    <Checkbox
                      checked={
                        currentPreferences[type.key as keyof NotificationPreferences][
                          channel.key as keyof NotificationChannel
                        ]
                      }
                      onChange={() =>
                        handleChannelToggle(
                          type.key as keyof NotificationPreferences,
                          channel.key as keyof NotificationChannel
                        )
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {updatePreferencesMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to update notification preferences. Please try again.
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!isDirty || updatePreferencesMutation.isPending}
        >
          {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outlined" onClick={handleReset} disabled={!isDirty}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}
