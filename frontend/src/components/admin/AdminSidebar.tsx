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
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { navigationConfig } from '@/config/navigation';
import { NavigationItem } from '@/types/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface AdminSidebarProps {
  open: boolean;
  drawerWidth: number;
  variant?: 'permanent' | 'temporary' | 'persistent';
  onClose?: () => void;
}

export default function AdminSidebar({
  open,
  drawerWidth,
  variant = 'permanent',
  onClose,
}: AdminSidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
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

  const isItemAllowed = (item: NavigationItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return user?.role ? item.roles.includes(user.role) : false;
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => child.path === location.pathname);
    }
    return false;
  };

  const renderNavItem = (item: NavigationItem, depth: number = 0) => {
    if (!isItemAllowed(item)) return null;

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
            disabled={item.disabled}
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
              Admin Panel
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
        <List>{navigationConfig.map((item) => renderNavItem(item))}</List>
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
