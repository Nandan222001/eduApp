import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import ParentSidebar from './ParentSidebar';
import ParentAppBar from './ParentAppBar';
import ParentBreadcrumb from './ParentBreadcrumb';
import ParentBottomNav from './ParentBottomNav';
import SkipToContent from '../common/SkipToContent';

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

export default function ParentLayout() {
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
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SkipToContent targetId="main-content" />

      <ParentAppBar
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
        <ParentSidebar
          open={desktopOpen}
          drawerWidth={desktopOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}
          variant="permanent"
        />
      </Box>

      <Box
        component="nav"
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
        aria-label="Mobile navigation"
      >
        <ParentSidebar
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          drawerWidth={DRAWER_WIDTH}
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
          <ParentBreadcrumb />
        </Box>

        <Box
          sx={{
            p: { xs: 2, sm: 2, md: 3 },
            maxWidth: '100%',
            mx: 'auto',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      <ParentBottomNav />
    </Box>
  );
}
