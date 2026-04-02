import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  alpha,
  useMediaQuery,
  Stack,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  CheckCircle as AttendanceIcon,
  Grading as GradingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import GlobalSearchBar from '@/components/search/GlobalSearchBar';
import AccessibilityToolbar from '../common/AccessibilityToolbar';

interface TeacherAppBarProps {
  open: boolean;
  onMenuClick: () => void;
  drawerWidth: number;
}

export default function TeacherAppBar({ open, onMenuClick, drawerWidth }: TeacherAppBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleProfile = () => {
    navigate('/teacher/profile');
    handleProfileMenuClose();
  };

  const handleSettings = () => {
    navigate('/teacher/settings');
    handleProfileMenuClose();
  };

  const isProfileMenuOpen = Boolean(profileAnchorEl);
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

  const mockNotifications = [
    { id: 1, title: '12 assignments pending review', time: '5 min ago', read: false },
    { id: 2, title: 'Class 10-A attendance pending', time: '30 min ago', read: false },
    { id: 3, title: 'New message from parent', time: '1 hour ago', read: false },
    { id: 4, title: 'Test scheduled for tomorrow', time: '2 hours ago', read: true },
  ];

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const pendingGrading = 12;
  const pendingAttendance = 3;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
        ml: { sm: `${open ? drawerWidth : 0}px` },
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit" aria-label="toggle drawer" edge="start" onClick={onMenuClick}>
            <MenuIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'center',
            px: 2,
            maxWidth: 600,
          }}
        >
          <GlobalSearchBar />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
          {!isMobile && (
            <Stack direction="row" spacing={1} sx={{ mr: 1 }}>
              {pendingAttendance > 0 && (
                <Tooltip title={`${pendingAttendance} classes need attendance`}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AttendanceIcon />}
                    onClick={() => navigate('/teacher/attendance')}
                    sx={{
                      borderColor: theme.palette.warning.main,
                      color: theme.palette.warning.dark,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: theme.palette.warning.dark,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                      },
                    }}
                  >
                    Attendance
                    <Badge badgeContent={pendingAttendance} color="warning" sx={{ ml: 1 }} />
                  </Button>
                </Tooltip>
              )}
              {pendingGrading > 0 && (
                <Tooltip title={`${pendingGrading} items to grade`}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<GradingIcon />}
                    onClick={() => navigate('/teacher/grading')}
                    sx={{
                      borderColor: theme.palette.info.main,
                      color: theme.palette.info.dark,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: theme.palette.info.dark,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                      },
                    }}
                  >
                    Grade
                    <Badge badgeContent={pendingGrading} color="info" sx={{ ml: 1 }} />
                  </Button>
                </Tooltip>
              )}
            </Stack>
          )}

          <AccessibilityToolbar />

          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              sx={{ minWidth: 44, minHeight: 44 }}
              aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotificationsMenuOpen}
              color="inherit"
              sx={{ minWidth: 44, minHeight: 44 }}
              aria-label={`Notifications. ${unreadCount} unread`}
              aria-expanded={isNotificationsMenuOpen}
              aria-haspopup="true"
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                ml: 1,
                minWidth: 44,
                minHeight: 44,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
              aria-label="Account menu"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="true"
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem',
                }}
                src={user?.avatar}
                alt={`${user?.firstName} ${user?.lastName}`}
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={notificationsAnchorEl}
        open={isNotificationsMenuOpen}
        onClose={handleNotificationsMenuClose}
        aria-labelledby="notifications-button"
        MenuListProps={{
          'aria-label': 'Notifications',
          role: 'menu',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 360,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: theme.shadows[3],
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            You have {unreadCount} unread notifications
          </Typography>
        </Box>
        {mockNotifications.map((notification) => (
          <MenuItem
            key={notification.id}
            onClick={handleNotificationsMenuClose}
            sx={{
              py: 1.5,
              px: 2,
              borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
              bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                {notification.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={handleNotificationsMenuClose}
          sx={{ justifyContent: 'center', py: 1, color: theme.palette.primary.main }}
        >
          View all notifications
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={profileAnchorEl}
        open={isProfileMenuOpen}
        onClose={handleProfileMenuClose}
        aria-labelledby="profile-button"
        MenuListProps={{
          'aria-label': 'Account menu',
          role: 'menu',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 240,
            borderRadius: 2,
            boxShadow: theme.shadows[3],
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user?.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              px: 1,
              py: 0.25,
              display: 'inline-block',
              bgcolor: alpha(theme.palette.success.main, 0.1),
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="success.main" fontWeight={600}>
              TEACHER
            </Typography>
          </Box>
        </Box>
        <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: theme.palette.error.main }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
