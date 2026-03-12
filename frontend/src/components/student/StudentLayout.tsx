import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import StudentSidebar from './StudentSidebar';
import StudentAppBar from './StudentAppBar';
import StudentBreadcrumb from './StudentBreadcrumb';
import StudentBottomNav from './StudentBottomNav';
import SkipToContent from '../common/SkipToContent';

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

export default function StudentLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  const drawerWidth = isMobile ? DRAWER_WIDTH : desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SkipToContent targetId="main-content" />

      <StudentAppBar
        open={isMobile ? false : desktopOpen}
        onMenuClick={handleDrawerToggle}
        drawerWidth={drawerWidth}
      />

      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          display: { xs: 'none', md: 'block' },
        }}
        aria-label="Main navigation"
      >
        <StudentSidebar
          open={desktopOpen}
          drawerWidth={desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}
          variant="permanent"
        />
      </Box>

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        role="main"
        aria-label="Main content"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          pb: { xs: 8, md: 0 },
          '&:focus': {
            outline: 'none',
          },
        }}
      >
        <Box sx={{ minHeight: 64 }} aria-hidden="true" />

        <Box
          sx={{ display: { xs: 'none', md: 'block' } }}
          role="navigation"
          aria-label="Breadcrumb"
        >
          <StudentBreadcrumb />
        </Box>

        <Box
          sx={{
            p: { xs: 2, sm: 2, md: 3 },
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <StudentBottomNav />
    </Box>
  );
}
