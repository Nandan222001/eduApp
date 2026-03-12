import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

export const WebSocketConnectionStatus = () => {
  const { isConnected } = useWebSocket();
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setShowDisconnected(true);
      setShowReconnected(false);
    } else {
      if (showDisconnected) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
      setShowDisconnected(false);
    }
  }, [isConnected, showDisconnected]);

  return (
    <>
      <Snackbar open={showDisconnected} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          severity="warning"
          action={
            <IconButton size="small" color="inherit" onClick={() => setShowDisconnected(false)}>
              <Close fontSize="small" />
            </IconButton>
          }
        >
          Real-time connection lost. Attempting to reconnect...
        </Alert>
      </Snackbar>

      <Snackbar
        open={showReconnected}
        autoHideDuration={3000}
        onClose={() => setShowReconnected(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowReconnected(false)}>
          Real-time connection restored!
        </Alert>
      </Snackbar>
    </>
  );
};
