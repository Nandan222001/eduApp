import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchAttendanceCalendar, fetchSubjectAttendance } from '@store/slices/parentSlice';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';

type AttendanceMonitorScreenRouteProp = RouteProp<MainTabParamList, 'AttendanceMonitor'>;

interface AttendanceMonitorScreenProps {
  route: AttendanceMonitorScreenRouteProp;
}

const screenWidth = Dimensions.get('window').width;

export const AttendanceMonitorScreen: React.FC<AttendanceMonitorScreenProps> = ({ route }) => {
  const { childId } = route.params;
  const dispatch = useAppDispatch();
  const { attendanceCalendar, subjectAttendance, children } = useAppSelector(
    (state) => state.parent
  );

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  const child = children.find((c) => c.id === childId);
  const calendar = attendanceCalendar[childId] || {};
  const subjects = subjectAttendance[childId] || [];

  useEffect(() => {
    loadAttendanceData();
  }, [childId, selectedMonth, selectedYear]);

  const loadAttendanceData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        dispatch(
          fetchAttendanceCalendar({
            childId,
            year: selectedYear,
            month: selectedMonth + 1,
          })
        ),
        dispatch(fetchSubjectAttendance(childId)),
      ]);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallPercentage = () => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((sum, subject) => sum + subject.percentage, 0);
    return total / subjects.length;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarHeatmap = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      const attendance = calendar[dateStr];

      let dayStyle = styles.calendarDayNormal;
      if (attendance) {
        switch (attendance.status) {
          case 'present':
            dayStyle = styles.calendarDayPresent;
            break;
          case 'absent':
            dayStyle = styles.calendarDayAbsent;
            break;
          case 'late':
            dayStyle = styles.calendarDayLate;
            break;
          case 'excused':
            dayStyle = styles.calendarDayExcused;
            break;
        }
      }

      days.push(
        <View key={day} style={[styles.calendarDay, dayStyle]}>
          <Text style={styles.calendarDayText}>{day}</Text>
        </View>
      );
    }

    return days;
  };

  const renderGauge = (percentage: number) => {
    const radius = 80;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let color = '#FF3B30';
    if (percentage >= 75) {
      color = '#34C759';
    } else if (percentage >= 60) {
      color = '#FF9500';
    }

    return (
      <View style={styles.gaugeContainer}>
        <View style={styles.gauge}>
          <View style={styles.gaugeBackground}>
            <Text style={styles.gaugePercentage}>{percentage.toFixed(1)}%</Text>
            <Text style={styles.gaugeLabel}>Attendance</Text>
          </View>
        </View>
        <View
          style={[
            styles.gaugeFill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5856D6" />
      </View>
    );
  }

  const overallPercentage = calculateOverallPercentage();

  return (
    <ScrollView style={styles.container}>
      {child && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {child.first_name} {child.last_name}
          </Text>
          <Text style={styles.headerSubtitle}>Attendance Monitor</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Attendance</Text>
        <View style={styles.gaugeCard}>{renderGauge(overallPercentage)}</View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Monthly Calendar - {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <View style={styles.calendarCard}>
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>{renderCalendarHeatmap()}</View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.calendarDayPresent]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.calendarDayAbsent]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.calendarDayLate]} />
            <Text style={styles.legendText}>Late</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.calendarDayExcused]} />
            <Text style={styles.legendText}>Excused</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject-wise Breakdown</Text>
        {subjects.map((subject, index) => (
          <View key={index} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.subject_name}</Text>
              <Text style={styles.subjectPercentage}>{subject.percentage.toFixed(1)}%</Text>
            </View>
            <View style={styles.subjectStats}>
              <Text style={styles.subjectStat}>
                Present: {subject.present_count}/{subject.total_count}
              </Text>
              <Text style={styles.subjectStat}>
                Absent: {subject.total_count - subject.present_count}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${subject.percentage}%`,
                    backgroundColor:
                      subject.percentage >= 75
                        ? '#34C759'
                        : subject.percentage >= 60
                        ? '#FF9500'
                        : '#FF3B30',
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#5856D6',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gaugeContainer: {
    width: 200,
    height: 40,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  gauge: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  gaugeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 20,
  },
  gaugePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  gaugeLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    width: (screenWidth - 64) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: (screenWidth - 64) / 7,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDayNormal: {
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
  },
  calendarDayPresent: {
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  calendarDayAbsent: {
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  calendarDayLate: {
    backgroundColor: '#FF9500',
    borderRadius: 4,
  },
  calendarDayExcused: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#1C1C1E',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  subjectPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5856D6',
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectStat: {
    fontSize: 14,
    color: '#8E8E93',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
