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
  Select,
  FormControl,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import GlobalSearchBar from '@/components/search/GlobalSearchBar';
import { MobileHamburgerMenu } from '../mobile';
import AccessibilityToolbar from '../common/AccessibilityToolbar';

interface ParentAppBarProps {
  open: boolean;
  onMenuClick: () => void;
  drawerWidth: number;
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  photoUrl?: string;
}

export default function ParentAppBar({ open, onMenuClick, drawerWidth }: ParentAppBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedChildId, setSelectedChildId] = useState<number>(1);

  const mockChildren: Child[] = [
    {
      id: 1,
      firstName: 'Emma',
      lastName: 'Johnson',
      grade: 'Grade 10',
      section: 'A',
      photoUrl: '',
    },
    {
      id: 2,
      firstName: 'James',
      lastName: 'Johnson',
      grade: 'Grade 8',
      section: 'B',
      photoUrl: '',
    },
    {
      id: 3,
      firstName: 'Olivia',
      lastName: 'Johnson',
      grade: 'Grade 6',
      section: 'C',
      photoUrl: '',
    },
  ];

  const selectedChild =
    mockChildren.find((child) => child.id === selectedChildId) || mockChildren[0];

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
    navigate('/parent/profile');
    handleProfileMenuClose();
  };

  const handleSettings = () => {
    navigate('/parent/settings');
    handleProfileMenuClose();
  };

  const handleChildChange = (childId: number) => {
    setSelectedChildId(childId);
  };

  const isProfileMenuOpen = Boolean(profileAnchorEl);
  const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

  const mockNotifications = [
    { id: 1, title: 'Emma received a new grade in Mathematics', time: '10 min ago', read: false },
    { id: 2, title: 'James was marked present today', time: '1 hour ago', read: false },
    { id: 3, title: 'New message from Ms. Anderson', time: '2 hours ago', read: false },
    { id: 4, title: 'Olivia completed homework assignment', time: '3 hours ago', read: true },
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

          {!isMobile && mockChildren.length > 1 && (
            <FormControl
              size="small"
              sx={{
                minWidth: 240,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
            >
              <Select
                value={selectedChildId}
                onChange={(e) => handleChildChange(e.target.value as number)}
                displayEmpty
                IconComponent={ExpandMoreIcon}
                renderValue={() => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                    <Avatar
                      src={selectedChild.photoUrl}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: theme.palette.primary.main,
                        fontSize: '0.875rem',
                      }}
                    >
                      {selectedChild.firstName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedChild.firstName} {selectedChild.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedChild.grade} - Section {selectedChild.section}
                      </Typography>
                    </Box>
                  </Box>
                )}
                sx={{
                  '& .MuiSelect-select': {
                    py: 1,
                    px: 1.5,
                  },
                }}
              >
                {mockChildren.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                      <Avatar
                        src={child.photoUrl}
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '0.875rem',
                        }}
                      >
                        {child.firstName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {child.firstName} {child.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {child.grade} - Section {child.section}
                        </Typography>
                      </Box>
                      {child.id === selectedChildId && (
                        <Chip
                          label="Active"
                          size="small"
                          color="primary"
                          sx={{ ml: 'auto', height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              bgcolor: alpha(theme.palette.info.main, 0.1),
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="info.main" fontWeight={600}>
              PARENT
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
