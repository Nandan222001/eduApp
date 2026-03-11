import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';
import type { NotificationPreferenceUpdate, NotificationType } from '@/types/communications';

interface NotificationPreferencesProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  open,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferenceUpdate>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    in_app_enabled: true,
    notification_types: {
      assignment: true,
      attendance: true,
      message: true,
      announcement: true,
      exam: true,
      grade: true,
      system: true,
    },
    quiet_hours_start: '',
    quiet_hours_end: '',
  });

  const { data: currentPreferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => communicationsApi.getNotificationPreferences(),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (data: NotificationPreferenceUpdate) =>
      communicationsApi.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      onClose();
    },
  });

  useEffect(() => {
    if (currentPreferences) {
      setPreferences({
        email_enabled: currentPreferences.email_enabled,
        sms_enabled: currentPreferences.sms_enabled,
        push_enabled: currentPreferences.push_enabled,
        in_app_enabled: currentPreferences.in_app_enabled,
        notification_types: currentPreferences.notification_types || {
          assignment: true,
          attendance: true,
          message: true,
          announcement: true,
          exam: true,
          grade: true,
          system: true,
        },
        quiet_hours_start: currentPreferences.quiet_hours_start || '',
        quiet_hours_end: currentPreferences.quiet_hours_end || '',
      });
    }
  }, [currentPreferences]);

  const handleChannelToggle = (channel: keyof NotificationPreferenceUpdate) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  const handleNotificationTypeToggle = (type: NotificationType) => {
    setPreferences((prev) => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: !(prev.notification_types?.[type] ?? true),
      } as Record<NotificationType, boolean>,
    }));
  };

  const handleSubmit = () => {
    updateMutation.mutate(preferences);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Notification Preferences</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {updateMutation.isError && (
              <Alert severity="error">Failed to update preferences. Please try again.</Alert>
            )}

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Notification Channels
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose how you want to receive notifications
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.in_app_enabled}
                      onChange={() => handleChannelToggle('in_app_enabled')}
                    />
                  }
                  label="In-App Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.email_enabled}
                      onChange={() => handleChannelToggle('email_enabled')}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.sms_enabled}
                      onChange={() => handleChannelToggle('sms_enabled')}
                    />
                  }
                  label="SMS Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.push_enabled}
                      onChange={() => handleChannelToggle('push_enabled')}
                    />
                  }
                  label="Push Notifications"
                />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Notification Types
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose which types of notifications you want to receive
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(
                  [
                    'assignment',
                    'attendance',
                    'message',
                    'announcement',
                    'exam',
                    'grade',
                    'system',
                  ] as NotificationType[]
                ).map((type) => (
                  <FormControlLabel
                    key={type}
                    control={
                      <Switch
                        checked={preferences.notification_types?.[type] ?? true}
                        onChange={() => handleNotificationTypeToggle(type)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" textTransform="capitalize">
                          {type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type === 'assignment' &&
                            'Notifications about new assignments and submissions'}
                          {type === 'attendance' && 'Attendance updates and alerts'}
                          {type === 'message' && 'Direct messages from teachers and staff'}
                          {type === 'announcement' && 'School and class announcements'}
                          {type === 'exam' && 'Exam schedules and results'}
                          {type === 'grade' && 'Grade updates and report cards'}
                          {type === 'system' && 'System updates and important notices'}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Quiet Hours
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Set hours when you don&apos;t want to receive notifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        quiet_hours_start: e.target.value,
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        quiet_hours_end: e.target.value,
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={updateMutation.isPending || isLoading}
        >
          {updateMutation.isPending ? <CircularProgress size={20} /> : 'Save Preferences'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
