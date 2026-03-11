import { useState, useEffect } from 'react';
import { Alert, Slide, Box, IconButton } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CloseIcon from '@mui/icons-material/Close';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
}

export const OfflineIndicator = ({ position = 'top' }: OfflineIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(false);
      setDismissed(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (isOnline || dismissed) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        [position]: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        px: 2,
        pt: position === 'top' ? 2 : 0,
        pb: position === 'bottom' ? 2 : 0,
      }}
    >
      <Slide
        direction={position === 'top' ? 'down' : 'up'}
        in={showAlert}
        mountOnEnter
        unmountOnExit
      >
        <Alert
          severity="warning"
          icon={<WifiOffIcon />}
          action={
            <IconButton aria-label="close" color="inherit" size="small" onClick={handleDismiss}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            boxShadow: 3,
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
        >
          You are currently offline. Some features may not be available.
        </Alert>
      </Slide>
    </Box>
  );
};

export default OfflineIndicator;
