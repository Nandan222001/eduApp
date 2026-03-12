import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  getNotificationPermissionStatus,
  checkNotificationSupport,
} from '@/utils/pushNotifications';
import { clearAllCaches } from '@/utils/pwa';
import { OfflineQueueViewer } from '../common/OfflineQueueViewer';

export const PWASettings: React.FC = () => {
  const { isInstalled, isOnline, serviceWorkerRegistered, canInstall, install } = usePWA();
  const { queueCount, clearQueue } = useOfflineQueue();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [showQueueViewer, setShowQueueViewer] = useState(false);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      const permission = getNotificationPermissionStatus();
      setNotificationsEnabled(permission === 'granted');

      const subscription = await getPushSubscription();
      setPushSubscribed(subscription !== null);
    };

    checkNotificationStatus();
  }, []);

  const handleInstallApp = async () => {
    await install();
  };

  const handleToggleNotifications = async () => {
    if (!checkNotificationSupport()) {
      alert('Notifications are not supported on this device');
      return;
    }

    if (notificationsEnabled) {
      const unsubscribed = await unsubscribeFromPushNotifications();
      if (unsubscribed) {
        setNotificationsEnabled(false);
        setPushSubscribed(false);
      }
    } else {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);

        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const subscription = await subscribeToPushNotifications(vapidKey);
          setPushSubscribed(subscription !== null);
        }
      }
    }
  };

  const handleClearCache = async () => {
    if (
      window.confirm('Are you sure you want to clear all cached data? This will reload the app.')
    ) {
      await clearAllCaches();
      window.location.reload();
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('Are you sure you want to clear all queued requests?')) {
      await clearQueue();
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progressive Web App (PWA)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage offline capabilities and app installation
          </Typography>

          <Divider sx={{ my: 2 }} />

          <List>
            <ListItem>
              <ListItemText
                primary="App Status"
                secondary={isInstalled ? 'Installed as PWA' : 'Running in browser'}
              />
              <ListItemSecondaryAction>
                <Chip
                  label={isInstalled ? 'Installed' : 'Not Installed'}
                  color={isInstalled ? 'success' : 'default'}
                  size="small"
                />
              </ListItemSecondaryAction>
            </ListItem>

            {canInstall && !isInstalled && (
              <ListItem>
                <ListItemText primary="Install App" secondary="Install for better performance" />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<InstallMobileIcon />}
                    onClick={handleInstallApp}
                  >
                    Install
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            )}

            <ListItem>
              <ListItemText
                primary="Service Worker"
                secondary={serviceWorkerRegistered ? 'Active' : 'Not registered'}
              />
              <ListItemSecondaryAction>
                <Chip
                  label={serviceWorkerRegistered ? 'Active' : 'Inactive'}
                  color={serviceWorkerRegistered ? 'success' : 'default'}
                  size="small"
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText primary="Connection" secondary="Network status" />
              <ListItemSecondaryAction>
                <Chip
                  label={isOnline ? 'Online' : 'Offline'}
                  color={isOnline ? 'success' : 'warning'}
                  size="small"
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>

          {!checkNotificationSupport() && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Push notifications are not supported on this device
            </Alert>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
                disabled={!checkNotificationSupport()}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Enable Push Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive notifications about assignments, attendance, and announcements
                </Typography>
              </Box>
            }
          />

          {notificationsEnabled && (
            <Alert severity="info" sx={{ mt: 2 }} icon={<NotificationsIcon />}>
              <AlertTitle>Push Notifications {pushSubscribed ? 'Active' : 'Inactive'}</AlertTitle>
              {pushSubscribed
                ? 'You will receive push notifications when the app is closed'
                : 'Push subscription not active. Try toggling notifications.'}
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Offline Queue
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="Queued Requests"
                secondary={`${queueCount} request(s) waiting to sync`}
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowQueueViewer(true)}
                  disabled={queueCount === 0}
                >
                  View Queue
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          {queueCount > 0 && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<CloudSyncIcon />}>
              You have {queueCount} action(s) that will be synced when you&apos;re back online.
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Storage Management
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearCache}
              fullWidth
            >
              Clear Cache
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearQueue}
              disabled={queueCount === 0}
              fullWidth
            >
              Clear Offline Queue
            </Button>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            Clearing cache will remove all offline data and reload the app.
          </Alert>
        </CardContent>
      </Card>

      <OfflineQueueViewer open={showQueueViewer} onClose={() => setShowQueueViewer(false)} />
    </Box>
  );
};

export default PWASettings;
