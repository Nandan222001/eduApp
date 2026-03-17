import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Card } from '@rneui/themed';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { StudentTabScreenProps } from '@types';
import { scheduleApi, TimetableEntry } from '@api/schedule';

type Props = StudentTabScreenProps<'Schedule'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ScheduleScreen: React.FC<Props> = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      const response = await scheduleApi.getTimetable({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      });
      setTimetable(response.data || []);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTimetable();
    setRefreshing(false);
  }, [fetchTimetable]);

  React.useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? addDays(selectedDate, -7) : addDays(selectedDate, 7);
    setSelectedDate(newDate);
  };

  const getDaySchedule = (date: Date) => {
    const dayOfWeek = format(date, 'EEEE');
    return timetable
      .filter(entry => entry.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const renderDayHeader = (date: Date) => {
    const isToday = isSameDay(date, new Date());
    const isSelected = isSameDay(date, selectedDate);

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayHeader,
          isToday && styles.dayHeaderToday,
          isSelected && styles.dayHeaderSelected,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[styles.dayHeaderText, (isToday || isSelected) && styles.dayHeaderTextActive]}>
          {format(date, 'EEE')}
        </Text>
        <Text style={[styles.dayHeaderDate, (isToday || isSelected) && styles.dayHeaderDateActive]}>
          {format(date, 'd')}
        </Text>
        {isToday && <View style={styles.todayDot} />}
      </TouchableOpacity>
    );
  };

  const renderClassCard = (entry: TimetableEntry) => {
    const getTypeColor = (type?: string) => {
      switch (type) {
        case 'lab':
          return COLORS.secondary;
        case 'tutorial':
          return COLORS.accent;
        case 'practical':
          return COLORS.warning;
        default:
          return COLORS.primary;
      }
    };

    return (
      <Card key={entry.id} containerStyle={styles.classCard}>
        <View style={styles.classCardContent}>
          <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(entry.type) }]} />
          <View style={styles.classInfo}>
            <View style={styles.classHeader}>
              <Text style={styles.subjectName}>{entry.subject}</Text>
              {entry.type && (
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(entry.type) }]}>
                  <Text style={styles.typeBadgeText}>{entry.type.toUpperCase()}</Text>
                </View>
              )}
            </View>
            {entry.subjectCode && <Text style={styles.subjectCode}>{entry.subjectCode}</Text>}
            <View style={styles.classDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🕒</Text>
                <Text style={styles.detailText}>
                  {entry.startTime} - {entry.endTime}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{entry.room}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>👨‍🏫</Text>
                <Text style={styles.detailText}>{entry.teacherName}</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todaySchedule = getDaySchedule(selectedDate);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.weekNavigator}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('prev')}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.weekTitle}>
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('next')}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daysScroll}
          contentContainerStyle={styles.daysScrollContent}
        >
          {weekDates.map(renderDayHeader)}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : todaySchedule.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
            {todaySchedule.map(renderClassCard)}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No classes scheduled</Text>
            <Text style={styles.emptySubtext}>
              {isSameDay(selectedDate, new Date()) ? 'Enjoy your free day!' : 'for this day'}
            </Text>
          </View>
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  weekTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  daysScroll: {
    paddingHorizontal: SPACING.md,
  },
  daysScrollContent: {
    gap: SPACING.sm,
  },
  dayHeader: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    minWidth: 60,
    backgroundColor: COLORS.surface,
  },
  dayHeaderToday: {
    backgroundColor: COLORS.primary + '20',
  },
  dayHeaderSelected: {
    backgroundColor: COLORS.primary,
  },
  dayHeaderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dayHeaderTextActive: {
    color: COLORS.background,
  },
  dayHeaderDate: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dayHeaderDateActive: {
    color: COLORS.background,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  classCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 0,
    margin: 0,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classCardContent: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  typeIndicator: {
    width: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  classInfo: {
    flex: 1,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  subjectName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
  subjectCode: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  classDetails: {
    gap: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
