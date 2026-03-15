import React from 'react';
import { Box, Chip, Tooltip, Typography, LinearProgress, Paper, Grid } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  SignalCellularAlt as SignalIcon,
} from '@mui/icons-material';
import { StreamHealth } from '@/types/event';

interface StreamHealthIndicatorProps {
  health: StreamHealth;
  compact?: boolean;
}

export const StreamHealthIndicator: React.FC<StreamHealthIndicatorProps> = ({
  health,
  compact = false,
}) => {
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon fontSize="small" />;
      case 'warning':
        return <WarningIcon fontSize="small" />;
      case 'critical':
        return <ErrorIcon fontSize="small" />;
      default:
        return <SignalIcon fontSize="small" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Excellent';
      case 'warning':
        return 'Fair';
      case 'critical':
        return 'Poor';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getHealthPercentage = (status: string) => {
    switch (status) {
      case 'healthy':
        return 100;
      case 'warning':
        return 60;
      case 'critical':
        return 30;
      default:
        return 0;
    }
  };

  if (compact) {
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="caption" display="block">
              Bitrate: {(health.bitrate / 1000).toFixed(1)} Mbps
            </Typography>
            <Typography variant="caption" display="block">
              FPS: {health.fps}
            </Typography>
            <Typography variant="caption" display="block">
              Latency: {health.latency}ms
            </Typography>
            <Typography variant="caption" display="block">
              Dropped Frames: {health.dropped_frames}
            </Typography>
          </Box>
        }
      >
        <Chip
          icon={getStatusIcon(health.status)}
          label={getStatusLabel(health.status)}
          color={getStatusColor(health.status)}
          size="small"
        />
      </Tooltip>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {getStatusIcon(health.status)}
        <Typography variant="h6">Stream Health</Typography>
        <Chip
          label={getStatusLabel(health.status)}
          color={getStatusColor(health.status)}
          size="small"
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={getHealthPercentage(health.status)}
        color={
          health.status === 'healthy'
            ? 'success'
            : health.status === 'warning'
              ? 'warning'
              : 'error'
        }
        sx={{ mb: 3, height: 8, borderRadius: 1 }}
      />

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Bitrate
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {(health.bitrate / 1000).toFixed(1)} Mbps
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Frame Rate
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {health.fps} FPS
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Latency
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {health.latency}ms
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Dropped Frames
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {health.dropped_frames}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StreamHealthIndicator;
