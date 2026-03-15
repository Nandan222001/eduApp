import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from 'date-fns';

interface EventCountdownProps {
  targetDate: string;
  onComplete?: () => void;
  compact?: boolean;
}

export const EventCountdown: React.FC<EventCountdownProps> = ({
  targetDate,
  onComplete,
  compact = false,
}) => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
        return;
      }

      const days = differenceInDays(target, now);
      const hours = differenceInHours(target, now) % 24;
      const minutes = differenceInMinutes(target, now) % 60;
      const seconds = differenceInSeconds(target, now) % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => {
    if (compact) {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {value.toString().padStart(2, '0')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      );
    }

    return (
      <Paper
        elevation={2}
        sx={{
          p: 2,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
        }}
      >
        <Typography variant="h3" fontWeight="bold">
          {value.toString().padStart(2, '0')}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
          {label}
        </Typography>
      </Paper>
    );
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
        <TimeUnit value={timeLeft.days} label="Days" />
        <Typography variant="h6">:</Typography>
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <Typography variant="h6">:</Typography>
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <Typography variant="h6">:</Typography>
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" textAlign="center" gutterBottom>
        Event starts in:
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <TimeUnit value={timeLeft.days} label="Days" />
        </Grid>
        <Grid item xs={3}>
          <TimeUnit value={timeLeft.hours} label="Hours" />
        </Grid>
        <Grid item xs={3}>
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
        </Grid>
        <Grid item xs={3}>
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventCountdown;
