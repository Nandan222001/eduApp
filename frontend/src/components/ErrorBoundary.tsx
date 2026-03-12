import React from 'react';
import * as Sentry from '@sentry/react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface FallbackProps {
  error: Error;
  componentStack: string | null;
  resetError: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetError }) => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 500,
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We&apos;ve been notified of the issue and are working to fix it.
          </Typography>
          {import.meta.env.DEV && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                textAlign: 'left',
                overflow: 'auto',
              }}
            >
              <Typography variant="body2" component="pre">
                {error.toString()}
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={resetError}>
              Try Again
            </Button>
            <Button variant="outlined" onClick={() => (window.location.href = '/')}>
              Go Home
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ErrorFallback,
    showDialog: false,
  }
);

export default SentryErrorBoundary;
