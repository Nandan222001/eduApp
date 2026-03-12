import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useState } from 'react';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';
import type { PrivacySettings as PrivacySettingsType } from '@/types/settings';

export default function PrivacySettings() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: privacySettings, isLoading } = useQuery({
    queryKey: ['privacySettings'],
    queryFn: settingsApi.getPrivacySettings,
  });

  const [localSettings, setLocalSettings] = useState<PrivacySettingsType | null>(null);

  const updatePrivacySettingsMutation = useMutation({
    mutationFn: settingsApi.updatePrivacySettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['privacySettings'], data);
      showToast('Privacy settings updated successfully', 'success');
      setLocalSettings(null);
    },
    onError: () => {
      showToast('Failed to update privacy settings', 'error');
    },
  });

  const currentSettings = localSettings || privacySettings;

  const handleToggle = (field: keyof PrivacySettingsType) => {
    if (!currentSettings) return;
    setLocalSettings({
      ...currentSettings,
      [field]: !currentSettings[field],
    });
  };

  const handleSave = () => {
    if (localSettings) {
      updatePrivacySettingsMutation.mutate(localSettings);
    }
  };

  const handleReset = () => {
    setLocalSettings(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentSettings) {
    return <Alert severity="info">Unable to load privacy settings. Please try again later.</Alert>;
  }

  const isDirty = localSettings !== null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Privacy Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Control who can see your information and activities
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 700 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Profile Visibility
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.profilePublic}
                onChange={() => handleToggle('profilePublic')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Public Profile</Typography>
                <Typography variant="caption" color="text.secondary">
                  Allow others to view your profile information
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Leaderboard & Rankings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.showInLeaderboard}
                onChange={() => handleToggle('showInLeaderboard')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Show in Leaderboard</Typography>
                <Typography variant="caption" color="text.secondary">
                  Display your name and ranking in leaderboards
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Contact Information
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.showEmail}
                onChange={() => handleToggle('showEmail')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Show Email Address</Typography>
                <Typography variant="caption" color="text.secondary">
                  Display your email on your profile
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.showPhone}
                onChange={() => handleToggle('showPhone')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Show Phone Number</Typography>
                <Typography variant="caption" color="text.secondary">
                  Display your phone number on your profile
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Communication
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.allowMessages}
                onChange={() => handleToggle('allowMessages')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Allow Direct Messages</Typography>
                <Typography variant="caption" color="text.secondary">
                  Let others send you direct messages
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Online Status
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.showOnlineStatus}
                onChange={() => handleToggle('showOnlineStatus')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Show Online Status</Typography>
                <Typography variant="caption" color="text.secondary">
                  Let others see when you&apos;re online
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>

      {updatePrivacySettingsMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 700 }}>
          Failed to update privacy settings. Please try again.
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!isDirty || updatePrivacySettingsMutation.isPending}
        >
          {updatePrivacySettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outlined" onClick={handleReset} disabled={!isDirty}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}
