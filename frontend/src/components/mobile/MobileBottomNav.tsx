import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAppStore();

  const getNavItems = () => {
    const role = (user as { role?: string })?.role;

    if (role === 'admin') {
      return [
        { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
        { label: 'Attendance', icon: <SchoolIcon />, path: '/admin/attendance' },
        { label: 'Exams', icon: <AssignmentIcon />, path: '/admin/examinations/list' },
        { label: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
        { label: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
      ];
    } else if (role === 'teacher') {
      return [
        { label: 'Dashboard', icon: <DashboardIcon />, path: '/teacher/dashboard' },
        { label: 'Attendance', icon: <SchoolIcon />, path: '/admin/attendance/mark' },
        { label: 'Assignments', icon: <AssignmentIcon />, path: '/admin/assignments' },
        { label: 'Analytics', icon: <AnalyticsIcon />, path: '/teacher/analytics' },
        { label: 'Settings', icon: <SettingsIcon />, path: '/teacher/settings' },
      ];
    } else if (role === 'student') {
      return [
        { label: 'Dashboard', icon: <DashboardIcon />, path: '/student/dashboard' },
        { label: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
        { label: 'Analytics', icon: <AnalyticsIcon />, path: '/student/analytics' },
        { label: 'Materials', icon: <SchoolIcon />, path: '/student/materials' },
        { label: 'Settings', icon: <SettingsIcon />, path: '/student/settings' },
      ];
    } else if (role === 'parent') {
      return [
        { label: 'Dashboard', icon: <DashboardIcon />, path: '/parent/dashboard' },
        { label: 'Attendance', icon: <SchoolIcon />, path: '/parent/attendance' },
        { label: 'Grades', icon: <AssignmentIcon />, path: '/parent/grades' },
        { label: 'Messages', icon: <AnalyticsIcon />, path: '/parent/communication' },
        { label: 'Settings', icon: <SettingsIcon />, path: '/parent/settings' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const index = navItems.findIndex((item) => currentPath.startsWith(item.path));
    return index !== -1 ? index : 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    navigate(navItems[newValue].path);
  };

  if (navItems.length === 0) return null;

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
          },
        }}
      >
        {navItems.map((item, index) => (
          <BottomNavigationAction key={index} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
