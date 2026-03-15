import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneIphone as PhoneIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';

export const ParentNotificationPreferences: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['eventNotificationPreferences'],
    queryFn: () => eventsApi.getNotificationPreferences(),
  });

  const [localPreferences, setLocalPreferences] = useState({
    event_reminders_enabled: true,
    reminder_methods: ['email', 'push'] as ('email' | 'sms' | 'push')[],
    reminder_hours_before: [24, 1],
    notify_live_start: true,
    notify_recordings_available: true,
    notify_event_updates: true,
  });

  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        event_reminders_enabled: preferences.event_reminders_enabled,
        reminder_methods: preferences.reminder_methods,
        reminder_hours_before: preferences.reminder_hours_before,
        notify_live_start: preferences.notify_live_start,
        notify_recordings_available: preferences.notify_recordings_available,
        notify_event_updates: preferences.notify_event_updates,
      });
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: typeof localPreferences) => eventsApi.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventNotificationPreferences'] });
    },
  });

  const handleToggleMethod = (method: 'email' | 'sms' | 'push') => {
    setLocalPreferences((prev) => ({
      ...prev,
      reminder_methods: prev.reminder_methods.includes(method)
        ? prev.reminder_methods.filter((m) => m !== method)
        : [...prev.reminder_methods, method],
    }));
  };

  const handleToggleReminderTime = (hours: number) => {
    setLocalPreferences((prev) => ({
      ...prev,
      reminder_hours_before: prev.reminder_hours_before.includes(hours)
        ? prev.reminder_hours_before.filter((h) => h !== hours)
        : [...prev.reminder_hours_before, hours],
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(localPreferences);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <NotificationsIcon color="primary" />
        <Typography variant="h6">Event Notification Preferences</Typography>
      </Box>

      {updatePreferencesMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your notification preferences have been saved successfully!
        </Alert>
      )}

      {updatePreferencesMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to save preferences. Please try again.
        </Alert>
      )}

      <Stack spacing={3}>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={localPreferences.event_reminders_enabled}
                onChange={(e) =>
                  setLocalPreferences((prev) => ({
                    ...prev,
                    event_reminders_enabled: e.target.checked,
                  }))
                }
              />
            }
            label="Enable Event Reminders"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
            Receive reminders before school events start
          </Typography>
        </Box>

        <Divider />

        <Box>
          <FormControl component="fieldset" disabled={!localPreferences.event_reminders_enabled}>
            <FormLabel component="legend" sx={{ mb: 2 }}>
              Notification Methods
            </FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.reminder_methods.includes('email')}
                    onChange={() => handleToggleMethod('email')}
                    icon={<EmailIcon />}
                    checkedIcon={<EmailIcon />}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.reminder_methods.includes('sms')}
                    onChange={() => handleToggleMethod('sms')}
                    icon={<SmsIcon />}
                    checkedIcon={<SmsIcon />}
                  />
                }
                label="SMS Notifications"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.reminder_methods.includes('push')}
                    onChange={() => handleToggleMethod('push')}
                    icon={<PhoneIcon />}
                    checkedIcon={<PhoneIcon />}
                  />
                }
                label="Push Notifications"
              />
            </FormGroup>
          </FormControl>
        </Box>

        <Divider />

        <Box>
          <FormControl component="fieldset" disabled={!localPreferences.event_reminders_enabled}>
            <FormLabel component="legend" sx={{ mb: 2 }}>
              Reminder Timing
            </FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.reminder_hours_before.includes(168)}
                    onChange={() => handleToggleReminderTime(168)}
                  />
                }
                label="1 week before event"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.reminder_hours_before.includes(24)}
                    onChange={() => handleToggleReminderTime(24)}
                  />
                }
                label="24 hours before event"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.reminder_hours_before.includes(1)}
                    onChange={() => handleToggleReminderTime(1)}
                  />
                }
                label="1 hour before event"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localPreferences.reminder_hours_before.includes(0.25)}
                    onChange={() => handleToggleReminderTime(0.25)}
                  />
                }
                label="15 minutes before event"
              />
            </FormGroup>
          </FormControl>
        </Box>

        <Divider />

        <Box>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            Additional Notifications
          </FormLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.notify_live_start}
                  onChange={(e) =>
                    setLocalPreferences((prev) => ({
                      ...prev,
                      notify_live_start: e.target.checked,
                    }))
                  }
                />
              }
              label="Notify when live streams start"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 7, mb: 2 }}>
              Get notified immediately when a live event begins broadcasting
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.notify_recordings_available}
                  onChange={(e) =>
                    setLocalPreferences((prev) => ({
                      ...prev,
                      notify_recordings_available: e.target.checked,
                    }))
                  }
                />
              }
              label="Notify when recordings are available"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 7, mb: 2 }}>
              Get notified when event recordings are ready to watch
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.notify_event_updates}
                  onChange={(e) =>
                    setLocalPreferences((prev) => ({
                      ...prev,
                      notify_event_updates: e.target.checked,
                    }))
                  }
                />
              }
              label="Notify about event changes or cancellations"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
              Get notified if event details change or if an event is cancelled
            </Typography>
          </FormGroup>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
          >
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ParentNotificationPreferences;
