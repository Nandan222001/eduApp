import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
  variant?: 'standard' | 'minimal' | 'inline';
}

export const ErrorDisplay = ({
  title = 'Error',
  message = 'Something went wrong. Please try again.',
  error,
  onRetry,
  retryLabel = 'Retry',
  showIcon = true,
  variant = 'standard',
}: ErrorDisplayProps) => {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  if (variant === 'minimal') {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="error" gutterBottom>
          {message}
        </Typography>
        {onRetry && (
          <Button size="small" onClick={onRetry} startIcon={<RefreshIcon />}>
            {retryLabel}
          </Button>
        )}
      </Box>
    );
  }

  if (variant === 'inline') {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button size="small" color="inherit" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : undefined
        }
      >
        <Typography variant="body2">{message}</Typography>
        {errorMessage && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            {errorMessage}
          </Typography>
        )}
      </Alert>
    );
  }

  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        backgroundColor: 'error.lighter',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {showIcon && (
          <ErrorOutlineIcon
            sx={{
              fontSize: 60,
              color: 'error.main',
            }}
          />
        )}

        <Box>
          <Typography variant="h6" color="error" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
          {errorMessage && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {errorMessage}
            </Typography>
          )}
        </Box>

        {onRetry && (
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorDisplay;
