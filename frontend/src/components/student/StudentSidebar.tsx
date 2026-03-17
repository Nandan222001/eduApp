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
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  Quiz as TestIcon,
  MenuBook as StudyMaterialsIcon,
  Psychology as AIPredictionIcon,
  Timer as PomodoroIcon,
  EmojiEvents as GamificationIcon,
  Forum as ForumIcon,
  ChatBubble as ChatIcon,
  CalendarMonth as CalendarIcon,
  Flag as GoalsIcon,
  SmartToy as StudyBuddyIcon,
  EmojiEvents as OlympicsIcon,
} from '@mui/icons-material';

interface StudentSidebarProps {
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

const studentNavigation: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/student/dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'my-classes',
    title: 'My Classes',
    path: '/student/classes',
    icon: <ClassIcon />,
  },
  {
    id: 'assignments',
    title: 'Assignments',
    path: '/student/assignments',
    icon: <AssignmentIcon />,
    badge: 3,
  },
  {
    id: 'tests',
    title: 'Tests',
    path: '/student/tests',
    icon: <TestIcon />,
  },
  {
    id: 'study-materials',
    title: 'Study Materials',
    icon: <StudyMaterialsIcon />,
    children: [
      {
        id: 'materials-library',
        title: 'Library',
        path: '/student/materials/library',
        icon: <StudyMaterialsIcon />,
      },
      {
        id: 'materials-notes',
        title: 'My Notes',
        path: '/student/materials/notes',
        icon: <StudyMaterialsIcon />,
      },
      {
        id: 'materials-papers',
        title: 'Previous Papers',
        path: '/student/materials/papers',
        icon: <StudyMaterialsIcon />,
      },
    ],
  },
  {
    id: 'ai-predictions',
    title: 'AI Predictions',
    path: '/student/ai-prediction',
    icon: <AIPredictionIcon />,
    badge: 'NEW',
  },
  {
    id: 'study-buddy',
    title: 'AI Study Buddy',
    path: '/student/study-buddy',
    icon: <StudyBuddyIcon />,
    badge: 'NEW',
  },
  {
    id: 'pomodoro',
    title: 'Study Timer',
    path: '/student/pomodoro',
    icon: <PomodoroIcon />,
  },
  {
    id: 'calendar',
    title: 'Calendar',
    path: '/student/calendar',
    icon: <CalendarIcon />,
  },
  {
    id: 'goals',
    title: 'My Goals',
    path: '/student/goals',
    icon: <GoalsIcon />,
  },
  {
    id: 'gamification',
    title: 'Achievements',
    path: '/student/gamification',
    icon: <GamificationIcon />,
  },
  {
    id: 'olympics',
    title: 'Virtual Olympics',
    path: '/student/olympics',
    icon: <OlympicsIcon />,
    badge: 'NEW',
  },
  {
    id: 'doubt-forum',
    title: 'Doubt Forum',
    path: '/student/doubts',
    icon: <ForumIcon />,
    badge: 2,
  },
  {
    id: 'ai-chatbot',
    title: 'AI Study Helper',
    path: '/student/chatbot',
    icon: <ChatIcon />,
  },
];

export default function StudentSidebar({
  open,
  drawerWidth,
  variant = 'permanent',
  onClose,
}: StudentSidebarProps) {
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
              Student Portal
            </Typography>
          </Box>
        ) : (
          <Typography variant="h6" fontWeight={700} color="primary.main">
            EP
          </Typography>
        )}
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List>{studentNavigation.map((item) => renderNavItem(item))}</List>
      </Box>
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
