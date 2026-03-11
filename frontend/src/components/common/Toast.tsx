import { Snackbar, Alert, AlertColor, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TransitionProps } from '@mui/material/transitions';
import { ReactElement, useEffect } from 'react';
import { useAnnounce } from '../../hooks/useAnnounce';

interface ToastProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  onClose: () => void;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

function SlideTransition(props: TransitionProps & { children: ReactElement }) {
  return <Slide {...props} direction="up" />;
}

export const Toast = ({
  open,
  message,
  severity = 'info',
  autoHideDuration = 6000,
  onClose,
  position = { vertical: 'bottom', horizontal: 'right' },
}: ToastProps) => {
  const announce = useAnnounce();

  useEffect(() => {
    if (open) {
      const priority = severity === 'error' || severity === 'warning' ? 'assertive' : 'polite';
      announce(`${severity}: ${message}`, priority);
    }
  }, [open, message, severity, announce]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={position}
      TransitionComponent={SlideTransition}
      role="alert"
      aria-live={severity === 'error' || severity === 'warning' ? 'assertive' : 'polite'}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%', minWidth: 300 }}
        action={
          <IconButton
            size="small"
            aria-label="close notification"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        role="alert"
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
