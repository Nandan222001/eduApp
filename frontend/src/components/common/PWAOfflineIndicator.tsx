import React from 'react';
import { Box, Chip, Badge } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const { queueCount, isProcessing } = useOfflineQueue();

  if (isOnline && queueCount === 0) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', top: 80, right: 16, zIndex: 1200 }}>
      {!isOnline ? (
        <Chip
          icon={<CloudOffIcon />}
          label="Offline"
          color="warning"
          size="small"
          sx={{ boxShadow: 2 }}
        />
      ) : queueCount > 0 ? (
        <Badge badgeContent={queueCount} color="error">
          <Chip
            icon={isProcessing ? <SyncIcon className="rotating" /> : <CloudDoneIcon />}
            label={isProcessing ? 'Syncing...' : 'Queued'}
            color={isProcessing ? 'info' : 'default'}
            size="small"
            sx={{ boxShadow: 2 }}
          />
        </Badge>
      ) : null}
    </Box>
  );
};

export default OfflineIndicator;
