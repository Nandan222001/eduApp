import { Box, Container, Typography, Paper, Button, Alert } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import RequireRole from '@/components/common/RequireRole';
import { getRoleLabel } from '@/utils/authHelpers';

export function BasicAuthExample() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Basic Authentication
      </Typography>
      {isAuthenticated ? (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            You are logged in as {user?.fullName}
          </Alert>
          <Button variant="contained" onClick={logout}>
            Logout
          </Button>
        </>
      ) : (
        <Alert severity="info">
          You are not logged in. Please <a href="/login">login</a>.
        </Alert>
      )}
    </Paper>
  );
}

export function RoleBasedExample() {
  const { user } = useAuth();

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Role-Based Content
      </Typography>

      {user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Current Role: {getRoleLabel(user.role)}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <RequireRole roles="admin">
          <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
            <Typography variant="h6" color="error.contrastText">
              🔐 Admin Only Content
            </Typography>
            <Typography color="error.contrastText">
              This is only visible to administrators.
            </Typography>
          </Paper>
        </RequireRole>

        <RequireRole roles={['teacher', 'admin']}>
          <Paper sx={{ p: 3, bgcolor: 'warning.light' }}>
            <Typography variant="h6">📚 Teacher & Admin Content</Typography>
            <Typography>This is visible to teachers and administrators.</Typography>
          </Paper>
        </RequireRole>

        <RequireRole roles="student">
          <Paper sx={{ p: 3, bgcolor: 'info.light' }}>
            <Typography variant="h6" color="info.contrastText">
              📖 Student Content
            </Typography>
            <Typography color="info.contrastText">This is only visible to students.</Typography>
          </Paper>
        </RequireRole>

        <RequireRole
          roles={['parent']}
          fallback={
            <Paper sx={{ p: 3, bgcolor: 'grey.200' }}>
              <Typography>This content requires parent role (showing fallback)</Typography>
            </Paper>
          }
        >
          <Paper sx={{ p: 3, bgcolor: 'success.light' }}>
            <Typography variant="h6" color="success.contrastText">
              👪 Parent Content
            </Typography>
            <Typography color="success.contrastText">This is only visible to parents.</Typography>
          </Paper>
        </RequireRole>
      </Box>
    </Container>
  );
}

export function UserInfoExample() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Alert severity="warning">Please login to view user information.</Alert>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        User Information
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography>
          <strong>ID:</strong> {user.id}
        </Typography>
        <Typography>
          <strong>Name:</strong> {user.fullName}
        </Typography>
        <Typography>
          <strong>Email:</strong> {user.email}
        </Typography>
        <Typography>
          <strong>Role:</strong> {getRoleLabel(user.role)}
        </Typography>
        <Typography>
          <strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}
        </Typography>
        <Typography>
          <strong>Active:</strong> {user.isActive ? '✅' : '❌'}
        </Typography>
        <Typography>
          <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
    </Paper>
  );
}

export function LoginExample() {
  const { login } = useAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password123',
    });

    if (result.success) {
      console.log('Login successful!');
    } else {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Programmatic Login
      </Typography>
      <Button variant="contained" onClick={handleLogin}>
        Login (Example)
      </Button>
    </Paper>
  );
}

export default function AuthExamples() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Authentication Examples
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
        <BasicAuthExample />
        <UserInfoExample />
        <RoleBasedExample />
        <LoginExample />
      </Box>
    </Container>
  );
}
