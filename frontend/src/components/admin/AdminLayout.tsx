import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import AdminSidebar from './AdminSidebar';
import AdminAppBar from './AdminAppBar';
import AdminBreadcrumb from './AdminBreadcrumb';

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
        }}
      >
        {isMobile ? (
          <AdminSidebar
            open={mobileOpen}
            drawerWidth={DRAWER_WIDTH}
            variant="temporary"
            onClose={() => setMobileOpen(false)}
          />
        ) : (
          <AdminSidebar
            open={desktopOpen}
            drawerWidth={desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}
            variant="permanent"
          />
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Box sx={{ minHeight: 64 }} />

        <AdminBreadcrumb />

        <Box
          sx={{
            p: 3,
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
