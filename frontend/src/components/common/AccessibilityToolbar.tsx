import { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Stack,
} from '@mui/material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ContrastIcon from '@mui/icons-material/Contrast';
import SpeedIcon from '@mui/icons-material/Speed';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useAccessibility } from '../../contexts/AccessibilityContext';

export const AccessibilityToolbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { settings, updateSettings, increaseFontSize, decreaseFontSize, resetFontSize } =
    useAccessibility();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (setting: keyof typeof settings) => {
    updateSettings({ [setting]: !settings[setting] });
  };

  return (
    <>
      <Tooltip title="Accessibility options">
        <IconButton
          onClick={handleClick}
          aria-label="Open accessibility menu"
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={open ? 'accessibility-menu' : undefined}
          color="inherit"
          sx={{
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
          }}
        >
          <AccessibilityNewIcon />
        </IconButton>
      </Tooltip>

      <Menu
        id="accessibility-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'accessibility-button',
          role: 'menu',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Accessibility Settings
          </Typography>

          <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom>
              Font Size: {settings.fontSize}%
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Decrease font size">
                <IconButton
                  size="small"
                  onClick={decreaseFontSize}
                  disabled={settings.fontSize <= 75}
                  aria-label="Decrease font size"
                >
                  <TextDecreaseIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset font size">
                <IconButton
                  size="small"
                  onClick={resetFontSize}
                  disabled={settings.fontSize === 100}
                  aria-label="Reset font size to default"
                >
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Increase font size">
                <IconButton
                  size="small"
                  onClick={increaseFontSize}
                  disabled={settings.fontSize >= 200}
                  aria-label="Increase font size"
                >
                  <TextIncreaseIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>

          <Divider sx={{ my: 2 }} />

          <MenuItem
            onClick={() => handleToggle('reducedMotion')}
            aria-label={`${settings.reducedMotion ? 'Disable' : 'Enable'} reduced motion`}
          >
            <SpeedIcon sx={{ mr: 2 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.reducedMotion}
                  onChange={() => handleToggle('reducedMotion')}
                  inputProps={{
                    'aria-label': 'Toggle reduced motion',
                  }}
                />
              }
              label="Reduce Motion"
              sx={{ flex: 1, ml: 0 }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleToggle('highContrast')}
            aria-label={`${settings.highContrast ? 'Disable' : 'Enable'} high contrast`}
          >
            <ContrastIcon sx={{ mr: 2 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.highContrast}
                  onChange={() => handleToggle('highContrast')}
                  inputProps={{
                    'aria-label': 'Toggle high contrast mode',
                  }}
                />
              }
              label="High Contrast"
              sx={{ flex: 1, ml: 0 }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleToggle('keyboardNavigationEnabled')}
            aria-label={`${settings.keyboardNavigationEnabled ? 'Disable' : 'Enable'} keyboard navigation`}
          >
            <KeyboardIcon sx={{ mr: 2 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.keyboardNavigationEnabled}
                  onChange={() => handleToggle('keyboardNavigationEnabled')}
                  inputProps={{
                    'aria-label': 'Toggle keyboard navigation',
                  }}
                />
              }
              label="Keyboard Navigation"
              sx={{ flex: 1, ml: 0 }}
            />
          </MenuItem>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2 }}>
            These settings are saved locally and will persist across sessions.
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default AccessibilityToolbar;
