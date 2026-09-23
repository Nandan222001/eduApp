import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  Badge,
  alpha,
  useTheme,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  Grading as GradingIcon,
  CheckCircle as AttendanceIcon,
  BarChart as PerformanceIcon,
  MenuBook as ResourcesIcon,
  People as StudentsIcon,
  Quiz as TestIcon,
  Event as ScheduleIcon,
  Message as MessagesIcon,
  Analytics as AnalyticsIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Checklist as ChecklistIcon,
} from '@mui/icons-material';

interface TeacherSidebarProps {
  open: boolean;
  drawerWidth: number;
  variant?: 'permanent' | 'temporary' | 'persistent';
  onClose?: () => void;
}

interface NavItem {
  id: string;
  title: string;
  path?: string;
  icon: React.ReactNode;
  badge?: number | string;
  children?: NavItem[];
}

interface ClassScheduleItem {
  id: number;
  subject: string;
  class: string;
  time: string;
  room: string;
}

const teacherNavigation: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/teacher/dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'attendance',
    title: 'Mark Attendance',
    path: '/teacher/attendance',
    icon: <AttendanceIcon />,
    badge: 'Quick',
  },
  {
    id: 'grading-queue',
    title: 'Grading Queue',
    path: '/teacher/grading',
    icon: <GradingIcon />,
    badge: 12,
  },
  {
    id: 'my-classes',
    title: 'My Classes',
    path: '/teacher/classes',
    icon: <ClassIcon />,
  },
  {
    id: 'assignments',
    title: 'Assignments',
    icon: <AssignmentIcon />,
    children: [
      {
        id: 'assignments-create',
        title: 'Create Assignment',
        path: '/teacher/assignments/create',
        icon: <AssignmentIcon />,
      },
      {
        id: 'assignments-manage',
        title: 'Manage Assignments',
        path: '/teacher/assignments/manage',
        icon: <AssignmentIcon />,
      },
      {
        id: 'assignments-submissions',
        title: 'Submissions',
        path: '/teacher/assignments/submissions',
        icon: <AssignmentIcon />,
        badge: 8,
      },
    ],
  },
  {
    id: 'tests',
    title: 'Tests & Exams',
    icon: <TestIcon />,
    children: [
      {
        id: 'tests-create',
        title: 'Create Test',
        path: '/teacher/tests/create',
        icon: <TestIcon />,
      },
      {
        id: 'tests-manage',
        title: 'Manage Tests',
        path: '/teacher/tests/manage',
        icon: <TestIcon />,
      },
      {
        id: 'tests-results',
        title: 'Test Results',
        path: '/teacher/tests/results',
        icon: <TestIcon />,
      },
    ],
  },
  {
    id: 'performance',
    title: 'Class Performance',
    path: '/teacher/performance',
    icon: <PerformanceIcon />,
  },
  {
    id: 'students',
    title: 'Student Management',
    path: '/teacher/students',
    icon: <StudentsIcon />,
  },
  {
    id: 'resources',
    title: 'Teaching Resources',
    path: '/teacher/resources',
    icon: <ResourcesIcon />,
  },
  {
    id: 'schedule',
    title: 'My Schedule',
    path: '/teacher/schedule',
    icon: <ScheduleIcon />,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    path: '/teacher/analytics',
    icon: <AnalyticsIcon />,
  },
  {
    id: 'messages',
    title: 'Messages',
    path: '/teacher/messages',
    icon: <MessagesIcon />,
    badge: 5,
  },
];

const upcomingClasses: ClassScheduleItem[] = [
  {
    id: 1,
    subject: 'Mathematics',
    class: 'Grade 10-A',
    time: '10:00 AM',
    room: 'Room 301',
  },
  {
    id: 2,
    subject: 'Physics',
    class: 'Grade 11-B',
    time: '11:30 AM',
    room: 'Lab 2',
  },
  {
    id: 3,
    subject: 'Chemistry',
    class: 'Grade 12-C',
    time: '2:00 PM',
    room: 'Lab 3',
  },
];

const batchActions = [
  { id: 'mark-all-present', label: 'Mark All Present', icon: <ChecklistIcon fontSize="small" /> },
  { id: 'grade-assignments', label: 'Bulk Grade', icon: <GradingIcon fontSize="small" /> },
  { id: 'send-announcement', label: 'Send Announcement', icon: <MessagesIcon fontSize="small" /> },
];

export default function TeacherSidebar({
  open,
  drawerWidth,
  variant = 'permanent',
  onClose,
}: TeacherSidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleToggle = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary' && onClose) {
      onClose();
    }
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => child.path === location.pathname);
    }
    return false;
  };

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isItemActive(item);

    return (
      <Box key={item.id}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleToggle(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              pl: depth > 0 ? 2.5 + depth * 2 : 2.5,
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
            {hasChildren && open && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
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
              Teacher Portal
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
        <>
          <Box sx={{ px: 2, py: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ mb: 1, display: 'block' }}
            >
              QUICK ACTIONS
            </Typography>
            <Stack spacing={0.5}>
              {batchActions.map((action) => (
                <Chip
                  key={action.id}
                  icon={action.icon}
                  label={action.label}
                  size="small"
                  onClick={() => console.log(`Action: ${action.id}`)}
                  sx={{
                    justifyContent: 'flex-start',
                    px: 1,
                    py: 2,
                    height: 'auto',
                    '& .MuiChip-label': {
                      fontSize: '0.75rem',
                      px: 1,
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List>{teacherNavigation.map((item) => renderNavItem(item))}</List>
      </Box>

      {open && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Card
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    Upcoming Classes
                  </Typography>
                  <Tooltip title="View full schedule">
                    <IconButton
                      size="small"
                      onClick={() => navigate('/teacher/schedule')}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Stack spacing={1.5}>
                  {upcomingClasses.map((cls) => (
                    <Box
                      key={cls.id}
                      sx={{
                        p: 1.5,
                        bgcolor: theme.palette.background.paper,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          boxShadow: theme.shadows[2],
                          cursor: 'pointer',
                        },
                      }}
                      onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                        sx={{ mb: 0.5 }}
                      >
                        {cls.subject}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {cls.class}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {cls.time}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {cls.room}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
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
      PaperProps={
        variant === 'temporary'
          ? { component: 'nav', 'aria-label': 'Mobile navigation' }
          : undefined
      }
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
