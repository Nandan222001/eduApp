import { Box, CircularProgress, Typography, LinearProgress, Paper } from '@mui/material';
import { ReactNode } from 'react';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  backdrop?: boolean;
  children?: ReactNode;
}

export const LoadingOverlay = ({
  open,
  message = 'Loading...',
  progress,
  showProgress = false,
  backdrop = true,
  children,
}: LoadingOverlayProps) => {
  if (!open) return null;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: 200,
      }}
    >
      {showProgress && progress !== undefined ? (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress variant="determinate" value={progress} size={60} thickness={4} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary">
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      ) : (
        <CircularProgress size={60} />
      )}

      <Typography variant="body1" color="text.secondary" align="center">
        {message}
      </Typography>

      {children}
    </Box>
  );

  if (backdrop) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            minWidth: 300,
            maxWidth: 500,
          }}
        >
          {content}
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.paper',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {content}
    </Box>
  );
};

export default LoadingOverlay;
