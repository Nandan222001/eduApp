import React, { useEffect, useState } from 'react';
import { Box, Chip, alpha, useTheme } from '@mui/material';
import { People as PeopleIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

interface LiveViewerCounterProps {
  count: number;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
}

export const LiveViewerCounter: React.FC<LiveViewerCounterProps> = ({
  count,
  variant = 'default',
  showIcon = true,
}) => {
  const theme = useTheme();
  const [animatedCount, setAnimatedCount] = useState(count);

  useEffect(() => {
    const duration = 500;
    const steps = 20;
    const stepValue = (count - animatedCount) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedCount(count);
        clearInterval(interval);
      } else {
        setAnimatedCount((prev) => prev + stepValue);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [count, animatedCount]);

  const formatCount = (num: number) => {
    const rounded = Math.round(num);
    if (rounded >= 1000000) return `${(rounded / 1000000).toFixed(1)}M`;
    if (rounded >= 1000) return `${(rounded / 1000).toFixed(1)}K`;
    return rounded.toString();
  };

  if (variant === 'compact') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
        }}
      >
        {showIcon && <VisibilityIcon fontSize="small" color="action" />}
        <Box component="span" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
          {formatCount(animatedCount)}
        </Box>
      </Box>
    );
  }

  return (
    <Chip
      icon={showIcon ? <PeopleIcon /> : undefined}
      label={`${formatCount(animatedCount)} watching`}
      sx={{
        bgcolor: alpha('#000', 0.6),
        color: 'white',
        backdropFilter: 'blur(10px)',
        fontWeight: 'bold',
        '& .MuiChip-icon': {
          color: 'white',
        },
      }}
    />
  );
};

export default LiveViewerCounter;
