import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  SmartToy as StudyBuddyIcon,
  MenuBook as StudyMaterialsIcon,
  EmojiEvents as AchievementsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function StudentBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const navItems = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/student/dashboard',
    },
    {
      label: 'Assignments',
      icon: <AssignmentIcon />,
      path: '/student/assignments',
    },
    {
      label: 'AI Buddy',
      icon: <StudyBuddyIcon />,
      path: '/student/study-buddy',
    },
    {
      label: 'Materials',
      icon: <StudyMaterialsIcon />,
      path: '/student/materials/library',
    },
    {
      label: 'Rewards',
      icon: <AchievementsIcon />,
      path: '/student/gamification',
    },
  ];

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const index = navItems.findIndex((item) => currentPath.startsWith(item.path));
    return index !== -1 ? index : 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    navigate(navItems[newValue].path);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: { xs: 'block', md: 'none' },
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px',
            '&.Mui-selected': {
              fontSize: '0.75rem',
              fontWeight: 600,
            },
          },
          '& .Mui-selected': {
            color: theme.palette.primary.main,
          },
        }}
      >
        {navItems.map((item, index) => (
          <BottomNavigationAction
            key={index}
            label={item.label}
            icon={item.icon}
            sx={{
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
