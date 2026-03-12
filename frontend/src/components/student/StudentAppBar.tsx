import { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import GlobalSearchBar from '@/components/search/GlobalSearchBar';
import { MobileHamburgerMenu } from '../mobile';
import AccessibilityToolbar from '../common/AccessibilityToolbar';
import { gamificationAPI } from '@/api/gamification';

interface StudentAppBarProps {
  open: boolean;
  onMenuClick: () => void;
  drawerWidth: number;
}

export default function StudentAppBar({ open, onMenuClick, drawerWidth }: StudentAppBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  const loadStreakData = useCallback(async () => {
    try {
      if (user?.id && user?.institution_id) {
        const pointsData = await gamificationAPI.getUserPoints(
          Number(user.id),
          user.institution_id
        );
        setCurrentStreak(pointsData.current_streak || 0);
        setTotalPoints(pointsData.total_points || 0);
      }
    } catch (error) {
      console.error('Failed to load streak data:', error);
    }
  }, [user?.id, user?.institution_id]);

  useEffect(() => {
    if (user?.id) {
      loadStreakData();
    }
  }, [user?.id, loadStreakData]);

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
    navigate('/student/profile');
    handleProfileMenuClose();
  };

  const handleSettings = () => {
    navigate('/student/settings');
    handleProfileMenuClose();
  };

  const isProfileMenuOpen = Boolean(profileAnchorEl);
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

  const mockNotifications = [
    { id: 1, title: 'New assignment posted', time: '5 min ago', read: false },
    { id: 2, title: 'Test scheduled for tomorrow', time: '2 hours ago', read: false },
    { id: 3, title: 'Achievement unlocked: Week Warrior', time: '1 day ago', read: true },
  ];

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

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
          {isMobile ? (
            <MobileHamburgerMenu />
          ) : (
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={onMenuClick}
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
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
          {!isMobile && currentStreak > 0 && (
            <Tooltip title={`${currentStreak} day streak! Keep it up!`}>
              <Chip
                icon={<FireIcon />}
                label={`${currentStreak} 🔥`}
                onClick={() => navigate('/student/gamification')}
                sx={{
                  background: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f4511e 0%, #fb8c00 100%)',
                  },
                }}
              />
            </Tooltip>
          )}

          {!isMobile && totalPoints > 0 && (
            <Tooltip title="Your total points">
              <Chip
                icon={<TrophyIcon />}
                label={totalPoints.toLocaleString()}
                onClick={() => navigate('/student/gamification')}
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.dark,
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.warning.main, 0.2),
                  },
                }}
              />
            </Tooltip>
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
            minWidth: 320,
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
          {currentStreak > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                icon={<FireIcon fontSize="small" />}
                label={`${currentStreak} days`}
                sx={{
                  height: 20,
                  background: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)',
                  color: 'white',
                }}
              />
              <Chip
                size="small"
                icon={<TrophyIcon fontSize="small" />}
                label={`${totalPoints} pts`}
                sx={{
                  height: 20,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.dark,
                }}
              />
            </Stack>
          )}
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
