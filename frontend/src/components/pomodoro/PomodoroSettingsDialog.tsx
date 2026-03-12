import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { PomodoroSettings } from '@/types/pomodoro';

interface PomodoroSettingsDialogProps {
  open: boolean;
  settings: PomodoroSettings;
  onClose: () => void;
  onSave: (settings: PomodoroSettings) => void;
}

export default function PomodoroSettingsDialog({
  open,
  settings,
  onClose,
  onSave,
}: PomodoroSettingsDialogProps) {
  const theme = useTheme();
  const [localSettings, setLocalSettings] = useState<PomodoroSettings>(settings);

  const handleChange = (field: keyof PomodoroSettings, value: number | boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Pomodoro Settings
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Timer Durations (minutes)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Work Duration"
              type="number"
              value={localSettings.work_duration}
              onChange={(e) => handleChange('work_duration', parseInt(e.target.value, 10) || 25)}
              inputProps={{ min: 1, max: 60 }}
              fullWidth
              helperText="Recommended: 25 minutes"
            />
            <TextField
              label="Short Break Duration"
              type="number"
              value={localSettings.short_break_duration}
              onChange={(e) =>
                handleChange('short_break_duration', parseInt(e.target.value, 10) || 5)
              }
              inputProps={{ min: 1, max: 30 }}
              fullWidth
              helperText="Recommended: 5 minutes"
            />
            <TextField
              label="Long Break Duration"
              type="number"
              value={localSettings.long_break_duration}
              onChange={(e) =>
                handleChange('long_break_duration', parseInt(e.target.value, 10) || 15)
              }
              inputProps={{ min: 1, max: 60 }}
              fullWidth
              helperText="Recommended: 15 minutes"
            />
            <TextField
              label="Sessions Until Long Break"
              type="number"
              value={localSettings.sessions_until_long_break}
              onChange={(e) =>
                handleChange('sessions_until_long_break', parseInt(e.target.value, 10) || 4)
              }
              inputProps={{ min: 1, max: 10 }}
              fullWidth
              helperText="Recommended: 4 sessions"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Automation
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.auto_start_breaks}
                  onChange={(e) => handleChange('auto_start_breaks', e.target.checked)}
                />
              }
              label="Auto-start breaks"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.auto_start_work}
                  onChange={(e) => handleChange('auto_start_work', e.target.checked)}
                />
              }
              label="Auto-start work sessions"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.sound_enabled}
                  onChange={(e) => handleChange('sound_enabled', e.target.checked)}
                />
              }
              label="Sound notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.notification_enabled}
                  onChange={(e) => handleChange('notification_enabled', e.target.checked)}
                />
              }
              label="Browser notifications"
            />
          </Box>
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: alpha(theme.palette.info.main, 0.1),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Tip:</strong> The Pomodoro Technique recommends 25-minute work sessions with
            5-minute breaks, and a 15-minute break after every 4 sessions.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}
