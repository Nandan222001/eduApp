import { Box, Container, Typography, Paper, Grid, Button } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/utils/authHelpers';
import RequireRole from '@/components/common/RequireRole';

export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user.fullName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Role: {getRoleLabel(user.role)}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Typography variant="body2">Email: {user.email}</Typography>
            <Typography variant="body2">
              Email Verified: {user.emailVerified ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2">
              Account Status: {user.isActive ? 'Active' : 'Inactive'}
            </Typography>
          </Paper>
        </Grid>

        <RequireRole roles={['admin']}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Admin Panel
              </Typography>
              <Typography variant="body2" gutterBottom>
                You have administrative privileges.
              </Typography>
              <Button variant="contained" fullWidth>
                Manage Users
              </Button>
            </Paper>
          </Grid>
        </RequireRole>

        <RequireRole roles={['teacher', 'admin']}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Teaching Tools
              </Typography>
              <Typography variant="body2" gutterBottom>
                Access your teaching resources.
              </Typography>
              <Button variant="contained" fullWidth>
                View Classes
              </Button>
            </Paper>
          </Grid>
        </RequireRole>

        <RequireRole roles={['student']}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                My Courses
              </Typography>
              <Typography variant="body2" gutterBottom>
                View your enrolled courses.
              </Typography>
              <Button variant="contained" fullWidth>
                Go to Courses
              </Button>
            </Paper>
          </Grid>
        </RequireRole>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined">Edit Profile</Button>
              <Button variant="outlined">Change Password</Button>
              <Button variant="outlined" color="error" onClick={logout}>
                Logout
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
