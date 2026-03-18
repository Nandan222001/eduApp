import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';
import { Event, EventType } from '@/types';
import { format } from 'date-fns';
import { Card } from './Card';
import { CountdownTimer } from './CountdownTimer';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  showCountdown?: boolean;
}

const getEventIcon = (type: EventType): string => {
  switch (type) {
    case EventType.EXAM:
      return 'pencil';
    case EventType.ASSIGNMENT:
      return 'clipboard-text';
    case EventType.PARENT_TEACHER_MEETING:
      return 'account-group';
    case EventType.SCHOOL_EVENT:
      return 'school';
    case EventType.HOLIDAY:
      return 'beach';
    case EventType.SPORTS_DAY:
      return 'basketball';
    case EventType.CULTURAL_EVENT:
      return 'music';
    case EventType.WORKSHOP:
      return 'tools';
    default:
      return 'calendar';
  }
};

const getEventTypeColor = (type: EventType, theme: any): string => {
  switch (type) {
    case EventType.EXAM:
      return theme.colors.error;
    case EventType.ASSIGNMENT:
      return theme.colors.warning;
    case EventType.PARENT_TEACHER_MEETING:
      return theme.colors.primary;
    case EventType.SCHOOL_EVENT:
      return theme.colors.secondary;
    case EventType.HOLIDAY:
      return theme.colors.success;
    case EventType.SPORTS_DAY:
      return theme.colors.accent;
    case EventType.CULTURAL_EVENT:
      return theme.colors.info;
    default:
      return theme.colors.textSecondary;
  }
};

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onPress, 
  showCountdown = false 
}) => {
  const { theme } = useTheme();
  const eventColor = getEventTypeColor(event.type, theme);

  const formatEventDate = () => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (event.startDate === event.endDate) {
      return format(startDate, 'MMM dd, yyyy');
    }
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
  };

  const formatEventTime = () => {
    if (event.isAllDay) return 'All Day';
    if (!event.startTime) return '';
    
    const timeStr = event.endTime 
      ? `${event.startTime} - ${event.endTime}`
      : event.startTime;
    
    return timeStr;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: `${eventColor}20` }]}>
            <MaterialCommunityIcons
              name={getEventIcon(event.type)}
              size={24}
              color={eventColor}
            />
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text
                style={[styles.title, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {event.title}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: `${eventColor}20` }]}>
                <Text style={[styles.typeText, { color: eventColor }]}>
                  {event.type.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {event.description && (
              <Text
                style={[styles.description, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {event.description}
              </Text>
            )}

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {formatEventDate()}
                </Text>
              </View>

              {formatEventTime() && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                    {formatEventTime()}
                  </Text>
                </View>
              )}

              {event.location && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {event.location}
                  </Text>
                </View>
              )}
            </View>

            {showCountdown && event.status === 'upcoming' && (
              <View style={styles.countdownContainer}>
                <CountdownTimer event={event} compact />
              </View>
            )}

            {event.requiresRSVP && (
              <View style={styles.rsvpBadge}>
                <MaterialCommunityIcons
                  name="account-check"
                  size={14}
                  color={theme.colors.info}
                />
                <Text style={[styles.rsvpText, { color: theme.colors.info }]}>
                  RSVP Required
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
  },
  countdownContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
