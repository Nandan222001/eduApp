import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { Event } from '@/types';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

interface CountdownTimerProps {
  event: Event;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ event, compact = false }) => {
  const { theme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const eventDate = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);

      if (eventDate <= now) {
        setTimeRemaining('Started');
        return;
      }

      const days = differenceInDays(eventDate, now);
      const hours = differenceInHours(eventDate, now) % 24;
      const minutes = differenceInMinutes(eventDate, now) % 60;

      if (days > 0) {
        if (compact) {
          setTimeRemaining(`${days}d ${hours}h`);
        } else {
          setTimeRemaining(`${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`);
        }
      } else if (hours > 0) {
        if (compact) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }
      } else {
        if (compact) {
          setTimeRemaining(`${minutes}m`);
        } else {
          setTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [event, compact]);

  const getUrgencyColor = () => {
    const now = new Date();
    const eventDate = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);
    const hoursRemaining = differenceInHours(eventDate, now);

    if (hoursRemaining <= 24) return theme.colors.error;
    if (hoursRemaining <= 72) return theme.colors.warning;
    return theme.colors.success;
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Text
        style={[
          styles.timer,
          { color: getUrgencyColor() },
          compact && styles.compactTimer,
        ]}
      >
        {timeRemaining}
      </Text>
      {!compact && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>remaining</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timer: {
    fontSize: 20,
    fontWeight: '700',
  },
  compactTimer: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
});
