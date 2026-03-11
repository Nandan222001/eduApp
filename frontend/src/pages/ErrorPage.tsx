import { useRouteError, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const ErrorPage = () => {
  const error = useRouteError() as { status?: number; message?: string; stack?: string };
  const navigate = useNavigate();

  const getErrorDetails = () => {
    if (error?.status === 404) {
      return {
        title: '404 - Page Not Found',
        message: "The page you're looking for doesn't exist or has been moved.",
        code: '404',
      };
    }

    if (error?.status === 403) {
      return {
        title: '403 - Access Denied',
        message: "You don't have permission to access this page.",
        code: '403',
      };
    }

    if (error?.status === 500) {
      return {
        title: '500 - Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        code: '500',
      };
    }

    return {
      title: 'Oops! Something Went Wrong',
      message: error?.message || 'An unexpected error occurred.',
      code: 'ERROR',
    };
  };

  const { title, message, code } = getErrorDetails();

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
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            width: '100%',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
              fontWeight: 700,
              color: 'error.main',
              mb: 2,
            }}
          >
            {code}
          </Typography>

          <ErrorOutlineIcon
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 3,
            }}
          />

          <Typography variant="h4" gutterBottom fontWeight={600}>
            {title}
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            {message}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
              Go Home
            </Button>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Box>

          {import.meta.env.DEV && error?.stack && (
            <Box
              sx={{
                mt: 4,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                textAlign: 'left',
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                {error.stack}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ErrorPage;
