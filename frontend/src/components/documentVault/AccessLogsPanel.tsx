import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Alert,
} from '@mui/material';
import { Visibility, GetApp, Share } from '@mui/icons-material';
import { AccessLog, RecipientRole } from '@/types/documentVault';
import { format } from 'date-fns';

interface AccessLogsPanelProps {
  logs: AccessLog[];
}

const accessTypeIcons = {
  view: <Visibility />,
  download: <GetApp />,
  share: <Share />,
};

const accessTypeColors = {
  view: 'info' as const,
  download: 'success' as const,
  share: 'warning' as const,
};

const roleLabels: Record<RecipientRole, string> = {
  [RecipientRole.TEACHER]: 'Teacher',
  [RecipientRole.COUNSELOR]: 'Counselor',
  [RecipientRole.NURSE]: 'Nurse',
  [RecipientRole.ADMIN]: 'Admin',
};

export const AccessLogsPanel: React.FC<AccessLogsPanelProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <Alert severity="info">
        No access logs yet. Logs will appear when someone views, downloads, or shares this document.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Access History ({logs.length} events)
      </Typography>

      <List>
        {logs.map((log) => (
          <ListItem key={log.id} divider>
            <ListItemAvatar>
              <Avatar>{accessTypeIcons[log.access_type]}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {log.accessed_by}
                  </Typography>
                  <Chip
                    label={log.access_type}
                    size="small"
                    color={accessTypeColors[log.access_type]}
                  />
                  <Chip label={roleLabels[log.accessed_by_role]} size="small" variant="outlined" />
                </Box>
              }
              secondary={
                <>
                  {format(new Date(log.accessed_date), 'PPp')}
                  {log.ip_address && ` • IP: ${log.ip_address}`}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
