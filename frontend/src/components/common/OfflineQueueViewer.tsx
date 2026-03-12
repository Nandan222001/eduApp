import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SyncIcon from '@mui/icons-material/Sync';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { format } from 'date-fns';

interface OfflineQueueViewerProps {
  open: boolean;
  onClose: () => void;
}

export const OfflineQueueViewer: React.FC<OfflineQueueViewerProps> = ({ open, onClose }) => {
  const { queue, queueCount, isProcessing, processQueue, clearQueue } = useOfflineQueue();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <EventIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      default:
        return <SyncIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'Attendance';
      case 'assignment':
        return 'Assignment';
      default:
        return 'Other';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Offline Queue ({queueCount})</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {queueCount === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No items in queue
            </Typography>
          </Box>
        ) : (
          <List>
            {queue.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>{getTypeIcon(item.type)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2">
                        {item.method} {item.url.split('/').pop()}
                      </Typography>
                      <Chip label={getTypeLabel(item.type)} size="small" />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        Queued: {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                      {item.metadata && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {Object.entries(item.metadata)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={clearQueue} color="error" disabled={queueCount === 0 || isProcessing}>
          Clear All
        </Button>
        <Button
          onClick={processQueue}
          variant="contained"
          startIcon={isProcessing ? <SyncIcon className="rotating" /> : <SyncIcon />}
          disabled={queueCount === 0 || isProcessing}
        >
          {isProcessing ? 'Syncing...' : 'Sync Now'}
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfflineQueueViewer;
