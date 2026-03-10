import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { env } from '@/config/env';

export default function Header() {
  const { isAuthenticated, user, logout } = useAppStore();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          {env.appName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/about">
            About
          </Button>
          {isAuthenticated ? (
            <>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                {user?.name}
              </Typography>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit">Login</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
