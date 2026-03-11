import { useState } from 'react';
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard,
  Assignment,
  School,
  BarChart,
  Settings,
  Logout,
  Person,
  Event,
  EmojiEvents,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function MobileHamburgerMenu() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getMenuItems = () => {
    const role = (user as { role?: string })?.role;

    if (role === 'admin') {
      return [
        { label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
        { label: 'Students', icon: <School />, path: '/admin/users/students' },
        { label: 'Teachers', icon: <Person />, path: '/admin/users/teachers' },
        { label: 'Attendance', icon: <Event />, path: '/admin/attendance' },
        { label: 'Examinations', icon: <Assignment />, path: '/admin/examinations/list' },
        { label: 'Analytics', icon: <BarChart />, path: '/admin/analytics' },
        { label: 'Gamification', icon: <EmojiEvents />, path: '/admin/gamification' },
        { label: 'Search', icon: <Search />, path: '/admin/search' },
        { label: 'Settings', icon: <Settings />, path: '/admin/settings' },
      ];
    } else if (role === 'teacher') {
      return [
        { label: 'Dashboard', icon: <Dashboard />, path: '/teacher/dashboard' },
        { label: 'Mark Attendance', icon: <Event />, path: '/admin/attendance/mark' },
        { label: 'Assignments', icon: <Assignment />, path: '/admin/assignments' },
        { label: 'Analytics', icon: <BarChart />, path: '/teacher/analytics' },
        { label: 'Gamification', icon: <EmojiEvents />, path: '/teacher/gamification' },
        { label: 'Search', icon: <Search />, path: '/teacher/search' },
        { label: 'Settings', icon: <Settings />, path: '/teacher/settings' },
      ];
    } else if (role === 'student') {
      return [
        { label: 'Dashboard', icon: <Dashboard />, path: '/student/dashboard' },
        { label: 'Assignments', icon: <Assignment />, path: '/student/assignments' },
        { label: 'My Analytics', icon: <BarChart />, path: '/student/analytics' },
        { label: 'Materials', icon: <School />, path: '/student/materials' },
        { label: 'Gamification', icon: <EmojiEvents />, path: '/student/gamification' },
        { label: 'Search', icon: <Search />, path: '/student/search' },
        { label: 'Settings', icon: <Settings />, path: '/student/settings' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  const handleToggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/login');
  };

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        onClick={handleToggleDrawer}
        sx={{
          display: { xs: 'flex', md: 'none' },
          mr: 1,
          minWidth: 44,
          minHeight: 44,
        }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: 'background.default',
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={(user as { avatar?: string })?.avatar}
                alt={(user as { name?: string })?.name}
                sx={{ width: 48, height: 48 }}
              >
                {(user as { name?: string })?.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {(user as { name?: string })?.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {(user as { role?: string })?.role?.toUpperCase()}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleToggleDrawer} sx={{ color: 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1, py: 2 }}>
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    minHeight: 48,
                    px: 3,
                    '&:active': {
                      bgcolor: theme.palette.action.selected,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                minHeight: 56,
                px: 3,
                color: 'error.main',
                '&:active': {
                  bgcolor: theme.palette.action.selected,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                <Logout />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </>
  );
}
