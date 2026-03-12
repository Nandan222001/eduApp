import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Paper,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  SettingsBrightness as AutoIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';
import type { ThemeSettings, ThemeMode } from '@/types/settings';

export default function ThemeCustomization() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ['themeSettings'],
    queryFn: settingsApi.getThemeSettings,
  });

  const [localSettings, setLocalSettings] = useState<ThemeSettings | null>(null);

  const updateThemeSettingsMutation = useMutation({
    mutationFn: settingsApi.updateThemeSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['themeSettings'], data);
      showToast('Theme settings updated successfully', 'success');
      setLocalSettings(null);
    },
    onError: () => {
      showToast('Failed to update theme settings', 'error');
    },
  });

  const currentSettings = localSettings || themeSettings;

  const handleModeChange = (mode: ThemeMode) => {
    if (!currentSettings) return;
    setLocalSettings({
      ...currentSettings,
      mode,
    });
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    if (!currentSettings) return;
    setLocalSettings({
      ...currentSettings,
      fontSize,
    });
  };

  const handleCompactModeChange = (compactMode: boolean) => {
    if (!currentSettings) return;
    setLocalSettings({
      ...currentSettings,
      compactMode,
    });
  };

  const handleSave = () => {
    if (localSettings) {
      updateThemeSettingsMutation.mutate(localSettings);
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
    return <Alert severity="info">Unable to load theme settings. Please try again later.</Alert>;
  }

  const isDirty = localSettings !== null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Theme Customization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Personalize the appearance of your interface
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 2 }}>
                Theme Mode
              </FormLabel>
              <RadioGroup
                value={currentSettings.mode}
                onChange={(e) => handleModeChange(e.target.value as ThemeMode)}
              >
                <FormControlLabel
                  value="light"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <LightIcon />
                      <Box>
                        <Typography variant="body1">Light Mode</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bright theme for daytime use
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="dark"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <DarkIcon />
                      <Box>
                        <Typography variant="body1">Dark Mode</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Reduced eye strain in low light
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ my: 2 }}
                />
                <FormControlLabel
                  value="auto"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <AutoIcon />
                      <Box>
                        <Typography variant="body1">Auto</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Follow system preferences
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={currentSettings.fontSize || 'medium'}
                label="Font Size"
                onChange={(e) =>
                  handleFontSizeChange(e.target.value as 'small' | 'medium' | 'large')
                }
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium (Default)</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={currentSettings.compactMode || false}
                  onChange={(e) => handleCompactModeChange(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Compact Mode</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reduce spacing for more content visibility
                  </Typography>
                </Box>
              }
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Preview
            </Typography>
            <Box
              sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: currentSettings.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                color: currentSettings.mode === 'dark' ? '#ffffff' : '#000000',
                border: '1px solid',
                borderColor: 'divider',
                fontSize:
                  currentSettings.fontSize === 'small'
                    ? '0.875rem'
                    : currentSettings.fontSize === 'large'
                      ? '1.125rem'
                      : '1rem',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Sample Heading
              </Typography>
              <Typography variant="body1" paragraph>
                This is how your content will look with the selected theme settings. The text size
                and spacing will adjust according to your preferences.
              </Typography>
              <Button variant="contained" size={currentSettings.compactMode ? 'small' : 'medium'}>
                Sample Button
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {updateThemeSettingsMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to update theme settings. Please try again.
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!isDirty || updateThemeSettingsMutation.isPending}
        >
          {updateThemeSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outlined" onClick={handleReset} disabled={!isDirty}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}
