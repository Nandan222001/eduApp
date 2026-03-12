import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Badge,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Visibility as VisibilityIcon,
  Grade as GradeIcon,
  CheckCircle as AttendanceIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  TrendingUp as ProgressIcon,
  EmojiEvents as GoalsIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface ParentSidebarProps {
  open: boolean;
  drawerWidth: number;
  variant?: 'permanent' | 'temporary' | 'persistent';
  onClose?: () => void;
}

interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | string;
}

const parentNavigation: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Overview',
    path: '/parent/dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'attendance',
    title: 'Attendance Monitor',
    path: '/parent/attendance',
    icon: <AttendanceIcon />,
  },
  {
    id: 'grades',
    title: 'Grades & Results',
    path: '/parent/grades',
    icon: <GradeIcon />,
  },
  {
    id: 'assignments',
    title: 'Assignments',
    path: '/parent/assignments',
    icon: <AssignmentIcon />,
    badge: 3,
  },
  {
    id: 'progress',
    title: 'Academic Progress',
    path: '/parent/progress',
    icon: <ProgressIcon />,
  },
  {
    id: 'goals',
    title: 'Goals & Achievements',
    path: '/parent/goals',
    icon: <GoalsIcon />,
  },
  {
    id: 'communication',
    title: 'Teacher Communication',
    path: '/parent/communication',
    icon: <MessageIcon />,
    badge: 2,
  },
  {
    id: 'schedule',
    title: 'Class Schedule',
    path: '/parent/schedule',
    icon: <CalendarIcon />,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    path: '/parent/notifications',
    icon: <NotificationsIcon />,
    badge: 5,
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/parent/settings',
    icon: <SettingsIcon />,
  },
];

export default function ParentSidebar({
  open,
  drawerWidth,
  variant = 'permanent',
  onClose,
}: ParentSidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary' && onClose) {
      onClose();
    }
  };

  const isItemActive = (item: NavItem): boolean => {
    return location.pathname === item.path;
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          px: 2.5,
          py: 2,
          minHeight: 64,
        }}
      >
        {open ? (
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              EduPortal
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Parent Portal
            </Typography>
          </Box>
        ) : (
          <Typography variant="h6" fontWeight={700} color="primary.main">
            EP
          </Typography>
        )}
      </Box>
      <Divider />

      {open && (
        <Box
          sx={{
            px: 2,
            py: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            m: 2,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <VisibilityIcon sx={{ fontSize: 18, color: 'info.main' }} />
            <Typography variant="caption" fontWeight={600} color="info.main">
              MONITORING MODE
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            View your child&apos;s academic progress and stay informed about their performance.
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List>
          {parentNavigation.map((item) => {
            const isActive = isItemActive(item);

            return (
              <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    sx={{
                      opacity: open ? 1 : 0,
                      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                    }}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {open && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" fontWeight={600} color="success.main" gutterBottom>
                💡 QUICK TIP
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Set up notifications to stay updated on your child&apos;s academic activities in
                real-time.
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
