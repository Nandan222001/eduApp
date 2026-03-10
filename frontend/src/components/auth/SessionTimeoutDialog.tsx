import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface SessionTimeoutDialogProps {
  open: boolean;
  countdown: number;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutDialog({
  open,
  countdown,
  onExtend,
  onLogout,
}: SessionTimeoutDialogProps) {
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    if (open) {
      setTimeLeft(countdown);
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open, countdown, onLogout]);

  const progress = (timeLeft / countdown) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Dialog open={open} onClose={onExtend} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          <Typography variant="h6">Session Timeout Warning</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Your session is about to expire due to inactivity.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You will be automatically logged out in:
        </Typography>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3" color="warning.main">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          color="warning"
          sx={{ height: 8, borderRadius: 4 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="error">
          Logout Now
        </Button>
        <Button onClick={onExtend} variant="contained" autoFocus>
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
