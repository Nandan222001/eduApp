import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Laptop as LaptopIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export default function ConnectedDevicesList() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const confirmDialog = useConfirmDialog();

  const confirm = async (options: {
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
  }) => {
    return new Promise<boolean>((resolve) => {
      confirmDialog.openDialog(options.title, options.message, () => resolve(true));
    });
  };

  const { data: devices, isLoading } = useQuery({
    queryKey: ['connectedDevices'],
    queryFn: settingsApi.getConnectedDevices,
  });

  const logoutDeviceMutation = useMutation({
    mutationFn: settingsApi.logoutDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedDevices'] });
      showToast('Device logged out successfully', 'success');
    },
    onError: () => {
      showToast('Failed to logout device', 'error');
    },
  });

  const logoutAllDevicesMutation = useMutation({
    mutationFn: settingsApi.logoutAllDevices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedDevices'] });
      showToast('All devices logged out successfully', 'success');
    },
    onError: () => {
      showToast('Failed to logout all devices', 'error');
    },
  });

  const handleLogoutDevice = async (deviceId: string, deviceName: string) => {
    const confirmed = await confirm({
      title: 'Logout Device',
      message: `Are you sure you want to logout "${deviceName}"? You'll need to login again on that device.`,
      confirmText: 'Logout',
      confirmColor: 'error',
    });

    if (confirmed) {
      logoutDeviceMutation.mutate(deviceId);
    }
  };

  const handleLogoutAllDevices = async () => {
    const confirmed = await confirm({
      title: 'Logout All Devices',
      message:
        "Are you sure you want to logout all devices except the current one? You'll need to login again on those devices.",
      confirmText: 'Logout All',
      confirmColor: 'error',
    });

    if (confirmed) {
      logoutAllDevicesMutation.mutate();
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <SmartphoneIcon />;
      case 'tablet':
        return <TabletIcon />;
      default:
        return <LaptopIcon />;
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Connected Devices
        </Typography>
        <Alert severity="info">No connected devices found.</Alert>
      </Box>
    );
  }

  const currentDevice = devices.find((d) => d.isCurrent);
  const otherDevices = devices.filter((d) => !d.isCurrent);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Connected Devices
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage devices where you&apos;re currently logged in
      </Typography>

      {otherDevices.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutAllDevices}
            disabled={logoutAllDevicesMutation.isPending}
          >
            Logout All Other Devices
          </Button>
        </Box>
      )}

      <Paper variant="outlined">
        <List>
          {currentDevice && (
            <>
              <ListItem>
                <ListItemIcon>{getDeviceIcon(currentDevice.deviceType)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">{currentDevice.deviceName}</Typography>
                      <Chip label="Current Device" color="primary" size="small" />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" display="block">
                        {currentDevice.browser} • {currentDevice.os}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {currentDevice.ipAddress}
                        {currentDevice.location && ` • ${currentDevice.location}`}
                      </Typography>
                      <Typography variant="caption" display="block" color="success.main">
                        Active now
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {otherDevices.length > 0 && <Divider />}
            </>
          )}

          {otherDevices.map((device, index) => (
            <Box key={device.id}>
              <ListItem>
                <ListItemIcon>{getDeviceIcon(device.deviceType)}</ListItemIcon>
                <ListItemText
                  primary={device.deviceName}
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" display="block">
                        {device.browser} • {device.os}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {device.ipAddress}
                        {device.location && ` • ${device.location}`}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Last active: {formatLastActive(device.lastActive)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleLogoutDevice(device.id, device.deviceName)}
                    disabled={logoutDeviceMutation.isPending}
                  >
                    <LogoutIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < otherDevices.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        If you notice any suspicious activity, logout that device immediately and change your
        password.
      </Alert>
    </Box>
  );
}
