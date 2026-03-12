import React from 'react';
import { Box, Button, Card, CardContent, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import { usePWA } from '@/hooks/usePWA';

interface InstallPromptProps {
  onClose?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose }) => {
  const { canInstall, install } = usePWA();
  const [isVisible, setIsVisible] = React.useState(true);

  const handleInstall = async () => {
    const installed = await install();
    if (installed) {
      setIsVisible(false);
      onClose?.();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!canInstall || !isVisible) {
    return null;
  }

  return (
    <Card
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 400,
        width: '90%',
        zIndex: 1300,
        boxShadow: 3,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Install App
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Install this app on your device for quick access and offline functionality.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<GetAppIcon />}
                onClick={handleInstall}
                size="small"
              >
                Install
              </Button>
              <Button variant="outlined" onClick={handleClose} size="small">
                Not Now
              </Button>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ ml: 1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InstallPrompt;
