import { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export default function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const theme = useTheme();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setCanPull(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0 && distance <= threshold * 2) {
        setPullDistance(distance);
        if (distance > threshold) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull || isRefreshing) return;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
      setCanPull(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canPull, pullDistance, threshold, onRefresh, isRefreshing]);

  const getRefreshProgress = () => {
    if (isRefreshing) return 1;
    return Math.min(pullDistance / threshold, 1);
  };

  const refreshProgress = getRefreshProgress();

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        overflow: 'auto',
        height: '100%',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: pullDistance || (isRefreshing ? 60 : 0),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isRefreshing ? 'height 0.3s ease' : 'none',
          bgcolor: theme.palette.background.paper,
          zIndex: 1,
        }}
      >
        {isRefreshing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Refreshing...
            </Typography>
          </Box>
        ) : pullDistance > 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RefreshIcon
              sx={{
                transform: `rotate(${refreshProgress * 360}deg)`,
                transition: 'transform 0.1s ease',
                color: refreshProgress >= 1 ? 'primary.main' : 'text.secondary',
              }}
            />
            <Typography
              variant="body2"
              color={refreshProgress >= 1 ? 'primary.main' : 'text.secondary'}
            >
              {refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Box
        sx={{
          transform: `translateY(${pullDistance || (isRefreshing ? 60 : 0)}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
