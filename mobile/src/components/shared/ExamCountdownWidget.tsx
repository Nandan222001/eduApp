import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTheme } from '@/theme';
import { Card } from './Card';
import { CountdownTimer } from './CountdownTimer';
import { LoadingSpinner } from './LoadingSpinner';
import { eventsApi } from '@/api/events';
import { EventType, EventStatus } from '@/types';

interface ExamCountdownWidgetProps {
  onPress?: () => void;
}

export const ExamCountdownWidget: React.FC<ExamCountdownWidgetProps> = ({ onPress }) => {
  const { theme } = useTheme();

  const { data: upcomingEvents, isLoading } = useQuery({
    queryKey: ['upcomingExams'],
    queryFn: async () => {
      const response = await eventsApi.getEvents({
        types: [EventType.EXAM],
        status: [EventStatus.UPCOMING],
      });
      return response.data.events.slice(0, 3);
    },
  });

  if (isLoading) {
    return (
      <Card style={styles.container}>
        <LoadingSpinner size="small" />
      </Card>
    );
  }

  if (!upcomingEvents || upcomingEvents.length === 0) {
    return (
      <Card style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="calendar-check"
            size={40}
            color={theme.colors.success}
          />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No upcoming exams
          </Text>
        </View>
      </Card>
    );
  }

  const nextExam = upcomingEvents[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.container, { backgroundColor: `${theme.colors.error}10` }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.error }]}>
              <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Next Exam
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                {nextExam.title}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.countdownSection}>
          <CountdownTimer event={nextExam} />
        </View>

        <View style={styles.footer}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {format(new Date(nextExam.startDate), 'MMM dd, yyyy')}
            </Text>
          </View>
          {nextExam.startTime && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {nextExam.startTime}
              </Text>
            </View>
          )}
        </View>

        {upcomingEvents.length > 1 && (
          <View style={styles.moreExams}>
            <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>
              +{upcomingEvents.length - 1} more exam{upcomingEvents.length > 2 ? 's' : ''}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  countdownSection: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
  },
  moreExams: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
