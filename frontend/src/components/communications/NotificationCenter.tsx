import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as AttendanceIcon,
  Message as MessageIcon,
  Info as SystemIcon,
  MarkEmailRead as MarkReadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';
import type { Notification, NotificationGroup, NotificationType } from '@/types/communications';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'assignment':
      return <AssignmentIcon fontSize="small" />;
    case 'attendance':
      return <AttendanceIcon fontSize="small" />;
    case 'message':
      return <MessageIcon fontSize="small" />;
    case 'system':
      return <SystemIcon fontSize="small" />;
    default:
      return <NotificationsIcon fontSize="small" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    default:
      return 'default';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  return (
    <ListItem
      button
      onClick={onClick}
      sx={{
        backgroundColor: notification.read_at ? 'transparent' : 'action.hover',
        '&:hover': {
          backgroundColor: 'action.selected',
        },
      }}
    >
      <ListItemIcon>{getNotificationIcon(notification.notification_type)}</ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="body2"
              fontWeight={notification.read_at ? 400 : 600}
              sx={{ flex: 1 }}
            >
              {notification.title}
            </Typography>
            <Chip
              label={notification.priority}
              size="small"
              color={getPriorityColor(notification.priority)}
            />
          </Box>
        }
        secondary={
          <>
            <Typography variant="body2" color="text.secondary" noWrap>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </Typography>
          </>
        }
      />
    </ListItem>
  );
};

interface NotificationCenterProps {
  onOpenPreferences?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onOpenPreferences }) => {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationsApi.getNotifications(),
  });

  const { data: stats } = useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => communicationsApi.getNotificationStats(),
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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markReadMutation.mutate(notification.id);
    }
  };

  const groupNotifications = (notifs: Notification[]): NotificationGroup[] => {
    const groups: Record<NotificationType, NotificationGroup> = {} as Record<
      NotificationType,
      NotificationGroup
    >;

    notifs.forEach((notif) => {
      if (!groups[notif.notification_type]) {
        groups[notif.notification_type] = {
          type: notif.notification_type,
          count: 0,
          notifications: [],
          unread_count: 0,
        };
      }
      groups[notif.notification_type].count++;
      groups[notif.notification_type].notifications.push(notif);
      if (!notif.read_at) {
        groups[notif.notification_type].unread_count++;
      }
    });

    return Object.values(groups);
  };

  const open = Boolean(anchorEl);
  const unreadNotifications = notifications.filter((n) => !n.read_at);
  const groupedNotifications = groupNotifications(notifications);

  const getFilteredNotifications = () => {
    if (tabValue === 0) return unreadNotifications;
    if (tabValue === 1) return notifications;
    const selectedGroup = groupedNotifications[tabValue - 2];
    return selectedGroup ? selectedGroup.notifications : [];
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={stats?.unread || 0} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400, maxHeight: 600 }}>
          <Box
            sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="h6">Notifications</Typography>
            <Box display="flex" gap={1}>
              {unreadNotifications.length > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkReadIcon />}
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                >
                  Mark all read
                </Button>
              )}
              {onOpenPreferences && (
                <IconButton size="small" onClick={onOpenPreferences}>
                  <SettingsIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          <Divider />

          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Unread (${stats?.unread || 0})`} />
            <Tab label="All" />
            {groupedNotifications.map((group) => (
              <Tab
                key={group.type}
                label={
                  <Badge badgeContent={group.unread_count} color="error">
                    <Typography variant="body2" textTransform="capitalize">
                      {group.type}
                    </Typography>
                  </Badge>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Box p={2}>
                <Alert severity="info">No notifications</Alert>
              </Box>
            ) : (
              <List disablePadding>
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    {index > 0 && <Divider />}
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};
