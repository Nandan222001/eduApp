import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Autocomplete,
  TextField,
} from '@mui/material';
import { Save as SaveIcon, Public as TimezoneIcon } from '@mui/icons-material';
import { useState } from 'react';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'Europe/London', label: 'London (GMT)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 'UTC+1' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: 'UTC+3' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 'UTC+10' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)', offset: 'UTC+12' },
];

export default function TimezoneConfiguration() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: settingsApi.getProfile,
  });

  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);

  const updateTimezoneMutation = useMutation({
    mutationFn: (timezone: string) =>
      settingsApi.updateProfile({ timezone } as { timezone: string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Timezone updated successfully', 'success');
      setSelectedTimezone(null);
    },
    onError: () => {
      showToast('Failed to update timezone', 'error');
    },
  });

  const currentTimezone = selectedTimezone || profile?.timezone || 'America/New_York';

  const handleSave = () => {
    if (selectedTimezone) {
      updateTimezoneMutation.mutate(selectedTimezone);
    }
  };

  const handleReset = () => {
    setSelectedTimezone(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  const isDirty = selectedTimezone !== null;
  const currentTimezoneData = timezones.find((tz) => tz.value === currentTimezone);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Timezone Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set your timezone for accurate scheduling and notifications
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 600 }}>
        <Autocomplete
          value={currentTimezoneData || null}
          onChange={(_event, newValue) => {
            if (newValue) {
              setSelectedTimezone(newValue.value);
            }
          }}
          options={timezones}
          getOptionLabel={(option) => `${option.label} (${option.offset})`}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Timezone"
              InputProps={{
                ...params.InputProps,
                startAdornment: <TimezoneIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box>
                <Typography variant="body1">{option.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.offset}
                </Typography>
              </Box>
            </li>
          )}
        />

        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Current Time:{' '}
            {new Date().toLocaleString('en-US', {
              timeZone: currentTimezone,
              dateStyle: 'medium',
              timeStyle: 'medium',
            })}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          All dates and times will be displayed in your selected timezone.
        </Alert>
      </Paper>

      {updateTimezoneMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 600 }}>
          Failed to update timezone. Please try again.
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!isDirty || updateTimezoneMutation.isPending}
        >
          {updateTimezoneMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outlined" onClick={handleReset} disabled={!isDirty}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}
