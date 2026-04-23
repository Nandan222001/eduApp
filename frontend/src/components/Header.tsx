import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  ArrowForward,
} from '@mui/icons-material';
import { useAppStore } from '@/store/useAppStore';
import { env } from '@/config/env';
import { motion } from 'motion/react';

const NAV_LINKS = [
  { label: 'Features', to: '/#features' },
  { label: 'For Schools', to: '/#roles' },
  { label: 'How It Works', to: '/#how' },
  { label: 'About', to: '/about' },
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAppStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
      case 'institution_admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      case 'parent':
        return '/parent/dashboard';
      case 'super_admin':
      case 'superadmin':
        return '/super-admin/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: 'rgba(255, 244, 240, 0.82)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(221, 159, 124, 0.18)',
          color: 'text.primary',
          boxShadow: '0 1px 0 rgba(75,36,10,0.06)',
          zIndex: 1100,
        }}
      >
        <Toolbar
          sx={{
            minHeight: '72px !important',
            px: { xs: 2, md: 4 },
            maxWidth: 1280,
            mx: 'auto',
            width: '100%',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: 800,
                fontFamily: 'Manrope',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #FF7A45, #6C5CE7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SchoolIcon sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              <Box component="span" sx={{ color: 'primary.main' }}>
                {env.appName?.split(' ')[0]}
              </Box>
              {env.appName?.includes(' ') && (
                <Box component="span" sx={{ color: 'secondary.main' }}>
                  {env.appName.split(' ').slice(1).join(' ')}
                </Box>
              )}
            </Typography>
          </motion.div>

          <Box sx={{ flex: 1 }} />

          {/* Desktop nav */}
          {!isMobile && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}
            >
              {NAV_LINKS.map((link) => (
                <motion.div key={link.label} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    component={RouterLink}
                    to={link.to}
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      px: 1.5,
                      '&:hover': { color: 'primary.main', bgcolor: 'rgba(255,122,69,0.06)' },
                    }}
                  >
                    {link.label}
                  </Button>
                </motion.div>
              ))}
            </Box>
          )}

          {/* Desktop CTAs */}
          {!isMobile && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              {isAuthenticated ? (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to={getDashboardLink()}
                      sx={{
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                        color: 'secondary.main',
                        borderColor: 'secondary.light',
                      }}
                    >
                      Dashboard
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={logout}
                      sx={{ fontWeight: 600, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                      Logout
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      component={RouterLink}
                      to="/login"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      Sign In
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/login"
                      endIcon={<ArrowForward sx={{ fontSize: '16px !important' }} />}
                      sx={{
                        fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(255,122,69,0.3)',
                        '&:hover': { boxShadow: '0 6px 20px rgba(255,122,69,0.4)' },
                      }}
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </>
              )}
            </Box>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ color: 'text.primary' }}
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: 'background.default',
            pt: 2,
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'Manrope' }}
          >
            {env.appName}
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={link.to}
                onClick={() => setDrawerOpen(false)}
                sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
              >
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {isAuthenticated ? (
            <>
              <Button
                variant="contained"
                component={RouterLink}
                to={getDashboardLink()}
                fullWidth
                onClick={() => setDrawerOpen(false)}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  logout();
                  setDrawerOpen(false);
                }}
                fullWidth
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                component={RouterLink}
                to="/login"
                fullWidth
                endIcon={<ArrowForward />}
                onClick={() => setDrawerOpen(false)}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/login"
                fullWidth
                onClick={() => setDrawerOpen(false)}
              >
                Sign In
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}
