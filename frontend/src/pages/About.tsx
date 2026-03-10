import { Container, Typography, Box, Paper } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import RequireRole from '@/components/common/RequireRole';

export default function About() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          About This Application
        </Typography>

        <Typography variant="body1" paragraph>
          This is a demo application showcasing a comprehensive authentication system with:
        </Typography>

        <Box component="ul" sx={{ mb: 3 }}>
          <li>Email/Password and OTP login options</li>
          <li>Forgot password and reset flow</li>
          <li>Session timeout with warnings</li>
          <li>Automatic JWT token refresh</li>
          <li>Protected routes with authentication guards</li>
          <li>Role-based access control</li>
          <li>Responsive design for all devices</li>
        </Box>

        {isAuthenticated && user && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Your Session Info
            </Typography>
            <Typography variant="body2">
              Logged in as: {user.fullName} ({user.email})
            </Typography>
            <Typography variant="body2">Role: {user.role}</Typography>
            <Typography variant="body2">
              Email Verified: {user.emailVerified ? 'Yes' : 'No'}
            </Typography>
          </Box>
        )}

        <RequireRole roles={['admin']}>
          <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body1" color="error.contrastText">
              🔒 This section is only visible to administrators
            </Typography>
          </Box>
        </RequireRole>

        <RequireRole roles={['teacher', 'admin']}>
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body1" color="info.contrastText">
              📚 This section is visible to teachers and administrators
            </Typography>
          </Box>
        </RequireRole>
      </Paper>
    </Container>
  );
}
