import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import { env } from '@/config/env';

export default function Header() {
  const { isAuthenticated, user, logout } = useAppStore();

  const getMerchandiseStoreLink = () => {
    if (!user) return '/';

    switch (user.role) {
      case 'admin':
      case 'institution_admin':
        return '/admin/merchandise';
      case 'teacher':
        return '/teacher/merchandise/store';
      case 'student':
        return '/student/merchandise/store';
      case 'parent':
        return '/parent/merchandise/store';
      default:
        return '/';
    }
  };

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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/about">
            About
          </Button>
          {isAuthenticated && (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to={getMerchandiseStoreLink()}
                startIcon={<ShoppingCartIcon />}
              >
                Store
              </Button>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                {user?.fullName}
              </Typography>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          )}
          {!isAuthenticated && <Button color="inherit">Login</Button>}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
