import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Icon, Badge } from '@rneui/themed';
import { useQuery } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { StudentTabScreenProps } from '@types';
import { studentApi, TimetableEntry } from '../../api/student';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';

type Props = StudentTabScreenProps<'Schedule'>;

interface TimetableCardProps {
  entry: TimetableEntry;
  isCurrentClass: boolean;
}

const TimetableCard: React.FC<TimetableCardProps> = ({ entry, isCurrentClass }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return COLORS.primary;
      case 'lab':
        return COLORS.success;
      case 'tutorial':
        return COLORS.warning;
      case 'exam':
        return COLORS.error;
      default:
        return COLORS.info;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'book-open';
      case 'lab':
        return 'cpu';
      case 'tutorial':
        return 'edit';
      case 'exam':
        return 'clipboard';
      default:
        return 'calendar';
    }
  };

  return (
    <Card containerStyle={[styles.timetableCard, isCurrentClass && styles.currentClassCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.subjectRow}>
            <Icon
              name={getTypeIcon(entry.type)}
              type="feather"
              size={20}
              color={getTypeColor(entry.type)}
            />
            <Text style={styles.subjectName}>{entry.subject}</Text>
          </View>
          <Text style={styles.subjectCode}>{entry.subjectCode}</Text>
        </View>
        <Badge
          value={entry.type.toUpperCase()}
          badgeStyle={[styles.typeBadge, { backgroundColor: getTypeColor(entry.type) }]}
          textStyle={styles.typeBadgeText}
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Icon name="clock" type="feather" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {entry.startTime} - {entry.endTime}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="user" type="feather" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{entry.teacher}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="map-pin" type="feather" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{entry.room}</Text>
        </View>
      </View>

      {isCurrentClass && (
        <View style={styles.currentClassBanner}>
          <Icon name="activity" type="feather" size={16} color={COLORS.background} />
          <Text style={styles.currentClassText}>In Progress</Text>
        </View>
      )}
    </Card>
  );
};

interface DayScheduleProps {
  day: string;
  entries: TimetableEntry[];
  currentDay: string;
}

const DaySchedule: React.FC<DayScheduleProps> = ({ day, entries, currentDay }) => {
  const isToday = day === currentDay;
  const now = new Date();
  const currentTime = format(now, 'HH:mm');

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const timeA = parse(a.startTime, 'HH:mm', new Date());
      const timeB = parse(b.startTime, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });
  }, [entries]);

  const isCurrentClass = (entry: TimetableEntry) => {
    if (!isToday) return false;
    return currentTime >= entry.startTime && currentTime <= entry.endTime;
  };

  if (entries.length === 0) {
    return (
      <View style={styles.emptyDayContainer}>
        <Icon name="coffee" type="feather" size={32} color={COLORS.textSecondary} />
        <Text style={styles.emptyDayText}>No classes scheduled</Text>
      </View>
    );
  }

  return (
    <View style={styles.dayScheduleContainer}>
      {sortedEntries.map(entry => (
        <TimetableCard key={entry.id} entry={entry} isCurrentClass={isCurrentClass(entry)} />
      ))}
    </View>
  );
};

export const ScheduleScreen: React.FC<Props> = ({ navigation }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const {
    data: timetableData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['timetable'],
    queryFn: async () => {
      if (isDemoUser()) {
        const response = await demoDataApi.student.getTimetable();
        return response.data;
      }
      const response = await studentApi.getTimetable();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const entriesByDay = useMemo(() => {
    if (!timetableData?.entries) return {};

    return timetableData.entries.reduce(
      (acc, entry) => {
        if (!acc[entry.day]) {
          acc[entry.day] = [];
        }
        acc[entry.day].push(entry);
        return acc;
      },
      {} as Record<string, TimetableEntry[]>
    );
  }, [timetableData]);

  const displayDay = selectedDay || timetableData?.currentDay || daysOfWeek[0];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRetry = () => {
    refetch();
  };

  const handleDayPress = (day: string) => {
    setSelectedDay(day);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" type="feather" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Failed to load schedule</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Icon name="refresh-cw" type="feather" size={20} color={COLORS.background} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabsContainer}
        >
          {daysOfWeek.map(day => {
            const isSelected = day === displayDay;
            const isCurrentDay = day === timetableData?.currentDay;
            const hasClasses = entriesByDay[day]?.length > 0;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayTab,
                  isSelected && styles.dayTabSelected,
                  isCurrentDay && styles.dayTabCurrent,
                ]}
                onPress={() => handleDayPress(day)}
              >
                <Text style={[styles.dayTabText, isSelected && styles.dayTabTextSelected]}>
                  {day.substring(0, 3)}
                </Text>
                {hasClasses && (
                  <View
                    style={[styles.dayTabIndicator, isSelected && styles.dayTabIndicatorSelected]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{displayDay}</Text>
          {displayDay === timetableData?.currentDay && (
            <Badge value="Today" badgeStyle={styles.todayBadge} />
          )}
        </View>

        <DaySchedule
          day={displayDay}
          entries={entriesByDay[displayDay] || []}
          currentDay={timetableData?.currentDay || ''}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayTabsContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  dayTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 60,
  },
  dayTabSelected: {
    backgroundColor: COLORS.primary,
  },
  dayTabCurrent: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dayTabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayTabTextSelected: {
    color: COLORS.background,
  },
  dayTabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
    marginTop: 4,
  },
  dayTabIndicatorSelected: {
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dayTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  todayBadge: {
    backgroundColor: COLORS.primary,
  },
  dayScheduleContainer: {
    gap: SPACING.md,
  },
  emptyDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyDayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  timetableCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentClassCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  subjectName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  subjectCode: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: 28,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  cardBody: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  currentClassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
  },
  currentClassText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
});
