import { Box, Tooltip } from '@mui/material';
import { Circle } from '@mui/icons-material';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';

interface OnlinePresenceIndicatorProps {
  userId: number;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

const sizeMap = {
  small: 8,
  medium: 12,
  large: 16,
};

const statusColors = {
  online: '#4caf50',
  away: '#ff9800',
  busy: '#f44336',
  offline: '#9e9e9e',
};

export const OnlinePresenceIndicator = ({
  userId,
  size = 'medium',
  showTooltip = true,
}: OnlinePresenceIndicatorProps) => {
  const { getUserStatus } = useOnlinePresence([userId]);
  const presence = getUserStatus(userId);

  const indicator = (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Circle
        sx={{
          fontSize: sizeMap[size],
          color: statusColors[presence.status],
          filter: presence.status === 'online' ? 'drop-shadow(0 0 2px currentColor)' : 'none',
        }}
      />
    </Box>
  );

  if (showTooltip) {
    const tooltipText =
      presence.status === 'offline' && presence.last_seen
        ? `Last seen: ${new Date(presence.last_seen).toLocaleString()}`
        : presence.status.charAt(0).toUpperCase() + presence.status.slice(1);

    return <Tooltip title={tooltipText}>{indicator}</Tooltip>;
  }

  return indicator;
};
