import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';

interface BreadcrumbMapping {
  [key: string]: string;
}

const breadcrumbNameMap: BreadcrumbMapping = {
  '/student': 'Student Portal',
  '/student/dashboard': 'Dashboard',
  '/student/classes': 'My Classes',
  '/student/assignments': 'Assignments',
  '/student/tests': 'Tests',
  '/student/materials': 'Study Materials',
  '/student/materials/library': 'Library',
  '/student/materials/notes': 'My Notes',
  '/student/materials/papers': 'Previous Papers',
  '/student/ai-prediction': 'AI Predictions',
  '/student/pomodoro': 'Study Timer',
  '/student/calendar': 'Calendar',
  '/student/goals': 'My Goals',
  '/student/gamification': 'Achievements',
  '/student/doubts': 'Doubt Forum',
  '/student/chatbot': 'AI Study Helper',
  '/student/profile': 'Profile',
  '/student/settings': 'Settings',
};

export default function StudentBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || location.pathname === '/student/dashboard') {
    return null;
  }

  const breadcrumbs = [];

  breadcrumbs.push(
    <Link
      component={RouterLink}
      to="/student/dashboard"
      color="inherit"
      sx={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
      }}
      key="home"
    >
      <HomeIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
      Dashboard
    </Link>
  );

  let currentPath = '';
  pathnames.forEach((value, index) => {
    currentPath += `/${value}`;
    const isLast = index === pathnames.length - 1;
    const breadcrumbName = breadcrumbNameMap[currentPath] || value;

    if (isLast) {
      breadcrumbs.push(
        <Typography key={currentPath} color="text.primary" fontWeight={600}>
          {breadcrumbName}
        </Typography>
      );
    } else if (breadcrumbNameMap[currentPath]) {
      breadcrumbs.push(
        <Link
          component={RouterLink}
          to={currentPath}
          color="inherit"
          sx={{
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
          key={currentPath}
        >
          {breadcrumbName}
        </Link>
      );
    }
  });

  return (
    <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1,
          },
        }}
      >
        {breadcrumbs}
      </Breadcrumbs>
    </Box>
  );
}
