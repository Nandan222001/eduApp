import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar as RNCalendar, CalendarProps, DateData } from 'react-native-calendars';
import { useTheme } from '@/theme';
import { Event, EventType, MarkedDates } from '@/types';
import { format } from 'date-fns';

interface CustomCalendarProps extends Omit<CalendarProps, 'onDayPress'> {
  events: Event[];
  onDayPress?: (date: string) => void;
  selectedDate?: string;
  showMultiDot?: boolean;
}

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

export const Calendar: React.FC<CustomCalendarProps> = ({
  events,
  onDayPress,
  selectedDate,
  showMultiDot = true,
  ...props
}) => {
  const { theme } = useTheme();

  const markedDates: MarkedDates = useMemo(() => {
    const marked: MarkedDates = {};

    events.forEach(event => {
      const dateKey = format(new Date(event.startDate), 'yyyy-MM-dd');

      if (!marked[dateKey]) {
        marked[dateKey] = {
          marked: true,
          dots: [],
        };
      }

      if (showMultiDot) {
        const existingDots = marked[dateKey].dots || [];
        const eventColor = getEventTypeColor(event.type, theme);
        
        const dotExists = existingDots.some(dot => dot.color === eventColor);
        if (!dotExists && existingDots.length < 3) {
          existingDots.push({
            key: `${event.id}`,
            color: eventColor,
          });
        }
        marked[dateKey].dots = existingDots;
      } else {
        marked[dateKey].dotColor = getEventTypeColor(event.type, theme);
      }
    });

    if (selectedDate) {
      if (marked[selectedDate]) {
        marked[selectedDate].selected = true;
        marked[selectedDate].selectedColor = theme.colors.primary;
      } else {
        marked[selectedDate] = {
          selected: true,
          selectedColor: theme.colors.primary,
          marked: false,
        };
      }
    }

    return marked;
  }, [events, selectedDate, showMultiDot, theme]);

  const calendarTheme = {
    backgroundColor: theme.colors.background,
    calendarBackground: theme.colors.background,
    textSectionTitleColor: theme.colors.textSecondary,
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: theme.colors.textInverse,
    todayTextColor: theme.colors.primary,
    dayTextColor: theme.colors.text,
    textDisabledColor: theme.colors.disabled,
    dotColor: theme.colors.primary,
    selectedDotColor: theme.colors.textInverse,
    arrowColor: theme.colors.primary,
    monthTextColor: theme.colors.text,
    indicatorColor: theme.colors.primary,
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
  };

  return (
    <View style={styles.container}>
      <RNCalendar
        theme={calendarTheme}
        markedDates={markedDates}
        markingType={showMultiDot ? 'multi-dot' : 'dot'}
        onDayPress={(day: DateData) => onDayPress?.(day.dateString)}
        enableSwipeMonths
        {...props}
      />
    </View>
  );
};

export const CalendarLegend: React.FC = () => {
  const { theme } = useTheme();

  const legendItems = [
    { type: EventType.EXAM, label: 'Exam' },
    { type: EventType.ASSIGNMENT, label: 'Assignment' },
    { type: EventType.PARENT_TEACHER_MEETING, label: 'PT Meeting' },
    { type: EventType.SCHOOL_EVENT, label: 'School Event' },
    { type: EventType.HOLIDAY, label: 'Holiday' },
    { type: EventType.SPORTS_DAY, label: 'Sports' },
  ];

  return (
    <View style={styles.legend}>
      {legendItems.map(item => (
        <View key={item.type} style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: getEventTypeColor(item.type, theme) },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
