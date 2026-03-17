import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { CachedDataBanner } from '../components/CachedDataBanner';

export const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, attendance, isLoading, error, lastUpdated } = useAppSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    if (!stats && !attendance) {
      dispatch(fetchDashboardData());
    }
  }, [dispatch, stats, attendance]);

  const handleRefresh = async () => {
    await dispatch(fetchDashboardData()).unwrap();
  };

  if (isLoading && !stats && !attendance) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && !stats && !attendance) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <CachedDataBanner lastUpdated={lastUpdated} onRefresh={handleRefresh} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.attendance_percentage}%</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total_courses}</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.pending_assignments}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.average_grade.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Grade</Text>
              </View>
            </View>
          </View>
        )}

        {attendance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendance</Text>
            <View style={styles.attendanceCard}>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Today:</Text>
                <Text style={[
                  styles.attendanceValue,
                  attendance.today_status === 'present' && styles.present,
                  attendance.today_status === 'absent' && styles.absent,
                  attendance.today_status === 'late' && styles.late,
                  attendance.today_status === 'pending' && styles.pending,
                ]}>
                  {attendance.today_status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>This Week:</Text>
                <Text style={styles.attendanceValue}>
                  {attendance.current_week_percentage}%
                </Text>
              </View>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Present Days:</Text>
                <Text style={styles.attendanceValue}>{attendance.present_days}</Text>
              </View>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Absent Days:</Text>
                <Text style={styles.attendanceValue}>{attendance.absent_days}</Text>
              </View>
            </View>
          </View>
        )}

        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gamification</Text>
            <View style={styles.gamificationCard}>
              <View style={styles.gamificationRow}>
                <Text style={styles.gamificationLabel}>🔥 Streak:</Text>
                <Text style={styles.gamificationValue}>{stats.streak_days} days</Text>
              </View>
              <View style={styles.gamificationRow}>
                <Text style={styles.gamificationLabel}>⭐ Points:</Text>
                <Text style={styles.gamificationValue}>{stats.points}</Text>
              </View>
              <View style={styles.gamificationRow}>
                <Text style={styles.gamificationLabel}>📊 Level:</Text>
                <Text style={styles.gamificationValue}>{stats.level}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212529',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  attendanceLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  attendanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  present: {
    color: '#28A745',
  },
  absent: {
    color: '#DC3545',
  },
  late: {
    color: '#FFC107',
  },
  pending: {
    color: '#6C757D',
  },
  gamificationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gamificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  gamificationLabel: {
    fontSize: 16,
    color: '#212529',
  },
  gamificationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
  },
});
