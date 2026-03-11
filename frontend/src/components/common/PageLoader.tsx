import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';

interface PageLoaderProps {
  message?: string;
  variant?: 'circular' | 'linear';
  fullScreen?: boolean;
}

export const PageLoader = ({
  message = 'Loading...',
  variant = 'circular',
  fullScreen = false,
}: PageLoaderProps) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: fullScreen ? '100vh' : 400,
        width: '100%',
      }}
    >
      {variant === 'circular' ? (
        <CircularProgress size={48} />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress />
        </Box>
      )}
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'background.default',
          zIndex: 9999,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default PageLoader;
