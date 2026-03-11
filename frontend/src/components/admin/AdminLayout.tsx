import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import AdminSidebar from './AdminSidebar';
import AdminAppBar from './AdminAppBar';
import AdminBreadcrumb from './AdminBreadcrumb';
import { MobileBottomNav } from '../mobile';

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

export default function AdminLayout() {
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
      <AdminAppBar
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
      >
        <AdminSidebar
          open={desktopOpen}
          drawerWidth={desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}
          variant="permanent"
        />
      </Box>

      <Box
        component="main"
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
        }}
      >
        <Box sx={{ minHeight: 64 }} />

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <AdminBreadcrumb />
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

      <MobileBottomNav />
    </Box>
  );
}
