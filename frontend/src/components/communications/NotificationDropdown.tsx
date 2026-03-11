import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as AttendanceIcon,
  Message as MessageIcon,
  Info as SystemIcon,
  Announcement as AnnouncementIcon,
  School as ExamIcon,
  Grade as GradeIcon,
  MarkEmailRead as MarkReadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';
import type { Notification, NotificationType } from '@/types/communications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'assignment':
      return <AssignmentIcon fontSize="small" color="primary" />;
    case 'attendance':
      return <AttendanceIcon fontSize="small" color="success" />;
    case 'message':
      return <MessageIcon fontSize="small" color="info" />;
    case 'announcement':
      return <AnnouncementIcon fontSize="small" color="warning" />;
    case 'exam':
      return <ExamIcon fontSize="small" color="secondary" />;
    case 'grade':
      return <GradeIcon fontSize="small" color="success" />;
    case 'system':
      return <SystemIcon fontSize="small" color="action" />;
    default:
      return <NotificationsIcon fontSize="small" />;
  }
};

interface NotificationDropdownProps {
  onOpenPreferences?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onOpenPreferences,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => communicationsApi.getNotifications(undefined, undefined, 0, 10),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => communicationsApi.getNotificationStats(),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => communicationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => communicationsApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markReadMutation.mutate(notification.id);
    }

    if (notification.data?.url) {
      navigate(notification.data.url as string);
    }

    handleClose();
  };

  const handleViewAll = () => {
    navigate('/communication-center');
    handleClose();
  };

  const open = Boolean(anchorEl);
  const unreadNotifications = notifications.filter((n) => !n.read_at);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} size="large">
        <Badge badgeContent={stats?.unread || 0} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 380, maxHeight: 500 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          <Box display="flex" gap={1}>
            {unreadNotifications.length > 0 && (
              <IconButton
                size="small"
                onClick={() => markAllReadMutation.mutate()}
                title="Mark all as read"
              >
                <MarkReadIcon fontSize="small" />
              </IconButton>
            )}
            {onOpenPreferences && (
              <IconButton size="small" onClick={onOpenPreferences} title="Settings">
                <SettingsIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
        <Divider />

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={2}>
            <Alert severity="info">No notifications</Alert>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read_at ? 'transparent' : 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.notification_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="body2"
                          fontWeight={notification.read_at ? 400 : 600}
                          noWrap
                          sx={{ flex: 1 }}
                        >
                          {notification.title}
                        </Typography>
                        {notification.priority === 'urgent' && (
                          <Chip label="Urgent" size="small" color="error" />
                        )}
                        {notification.priority === 'high' && (
                          <Chip label="High" size="small" color="warning" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1 }}>
          <Button fullWidth onClick={handleViewAll}>
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};
