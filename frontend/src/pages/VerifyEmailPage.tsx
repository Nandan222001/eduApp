import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { CheckCircle, Email, Error as ErrorIcon } from '@mui/icons-material';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, updateUser } = useAuthStore();

  const [isVerifying, setIsVerifying] = useState(!!token);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await authApi.verifyEmail(verificationToken);
      setVerified(true);
      updateUser({ emailVerified: true });
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const response = await authApi.resendVerificationEmail();
      setSuccess(response.message || 'Verification email sent successfully');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to resend verification email';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <Paper elevation={3} sx={{ width: '100%', p: 4, textAlign: 'center' }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Verifying Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we verify your email address...
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (verified) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <Paper elevation={3} sx={{ width: '100%', p: 4, textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Email Verified!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your email has been verified successfully. You will be redirected to the dashboard
              shortly.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ width: '100%', p: 4, textAlign: 'center' }}>
          {error ? (
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          ) : (
            <Email sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
          )}

          <Typography variant="h5" gutterBottom>
            {error ? 'Verification Failed' : 'Verify Your Email'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
              {success}
            </Alert>
          )}

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {user?.emailVerified
              ? 'Your email is already verified.'
              : "Please check your email and click the verification link. If you haven't received the email, you can request a new one."}
          </Typography>

          {!user?.emailVerified && (
            <Button
              variant="contained"
              onClick={handleResendEmail}
              disabled={isResending}
              sx={{ mb: 2 }}
            >
              {isResending ? <CircularProgress size={24} /> : 'Resend Verification Email'}
            </Button>
          )}

          <Box sx={{ mt: 2 }}>
            <Button variant="text" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
