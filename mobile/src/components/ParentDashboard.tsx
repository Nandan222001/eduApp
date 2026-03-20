import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  fetchChildren,
  fetchChildStats,
  fetchTodayAttendance,
  fetchRecentGrades,
  fetchPendingAssignments,
  fetchFeePayments,
  setSelectedChild,
} from '@store/slices/parentSlice';
import { Child } from '../types/parent';

interface ParentDashboardProps {
  navigation: any;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const {
    children,
    selectedChildId,
    childStats,
    todayAttendance,
    recentGrades,
    pendingAssignments,
    feePayments,
    isLoading,
  } = useAppSelector((state) => state.parent);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadChildData(selectedChildId);
    }
  }, [selectedChildId]);

  const loadDashboardData = async () => {
    try {
      await dispatch(fetchChildren()).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to load children data');
    }
  };

  const loadChildData = async (childId: number) => {
    try {
      await Promise.all([
        dispatch(fetchChildStats(childId)),
        dispatch(fetchTodayAttendance(childId)),
        dispatch(fetchRecentGrades(childId)),
        dispatch(fetchPendingAssignments(childId)),
        dispatch(fetchFeePayments(childId)),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load child data');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (selectedChildId) {
      await loadChildData(selectedChildId);
    }
    setRefreshing(false);
  };

  const handleChildSelect = (childId: number) => {
    dispatch(setSelectedChild(childId));
  };

  const selectedChild = children.find((child) => child.id === selectedChildId);
  const stats = selectedChildId ? childStats[selectedChildId] : null;
  const attendance = selectedChildId ? todayAttendance[selectedChildId] : null;
  const grades = selectedChildId ? recentGrades[selectedChildId] : [];
  const assignments = selectedChildId ? pendingAssignments[selectedChildId] : [];
  const fees = selectedChildId ? feePayments[selectedChildId] : [];

  if (isLoading && children.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5856D6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Child Dashboard</Text>
      </View>

      {children.length > 1 && (
        <View style={styles.childSelector}>
          <Text style={styles.selectorLabel}>Select Child:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childOption,
                  selectedChildId === child.id && styles.childOptionActive,
                ]}
                onPress={() => handleChildSelect(child.id)}
              >
                <Text
                  style={[
                    styles.childOptionText,
                    selectedChildId === child.id && styles.childOptionTextActive,
                  ]}
                >
                  {child.first_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedChild && (
        <>
          <View style={styles.overviewCard}>
            <View style={styles.childHeader}>
              {selectedChild.photo_url ? (
                <Image source={{ uri: selectedChild.photo_url }} style={styles.childPhoto} />
              ) : (
                <View style={[styles.childPhoto, styles.photoPlaceholder]}>
                  <Text style={styles.photoPlaceholderText}>
                    {selectedChild.first_name[0]}
                    {selectedChild.last_name[0]}
                  </Text>
                </View>
              )}
              <View style={styles.childInfo}>
                <Text style={styles.childName}>
                  {selectedChild.first_name} {selectedChild.last_name}
                </Text>
                <Text style={styles.childDetails}>
                  {selectedChild.grade} • {selectedChild.class_name}
                </Text>
                <Text style={styles.childId}>ID: {selectedChild.student_id}</Text>
              </View>
            </View>

            {stats && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.attendance_percentage.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </View>
                {stats.rank && (
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>#{stats.rank}</Text>
                    <Text style={styles.statLabel}>Rank</Text>
                  </View>
                )}
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.average_score.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Average Score</Text>
                </View>
              </View>
            )}
          </View>

          {attendance && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Attendance</Text>
              <View
                style={[
                  styles.attendanceCard,
                  attendance.status === 'absent' && styles.attendanceAbsent,
                  attendance.status === 'present' && styles.attendancePresent,
                  attendance.status === 'late' && styles.attendanceLate,
                ]}
              >
                <View style={styles.attendanceContent}>
                  <Text style={styles.attendanceIcon}>
                    {attendance.status === 'present'
                      ? '✓'
                      : attendance.status === 'absent'
                      ? '✕'
                      : attendance.status === 'late'
                      ? '⏰'
                      : '❓'}
                  </Text>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceStatus}>
                      {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                    </Text>
                    {attendance.marked_at && (
                      <Text style={styles.attendanceTime}>
                        Marked at {new Date(attendance.marked_at).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                </View>
                {attendance.status === 'absent' && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertText}>⚠️ Alert</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('AttendanceMonitor', { childId: selectedChild.id })}
              >
                <Text style={styles.viewMoreText}>View Full Attendance →</Text>
              </TouchableOpacity>
            </View>
          )}

          {grades && grades.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Grades</Text>
              {grades.slice(0, 3).map((grade) => (
                <View key={grade.id} style={styles.gradeCard}>
                  <View style={styles.gradeHeader}>
                    <Text style={styles.gradeSubject}>{grade.subject_name}</Text>
                    <View style={styles.gradeScoreBadge}>
                      <Text style={styles.gradeScore}>{grade.grade}</Text>
                    </View>
                  </View>
                  <Text style={styles.gradeExam}>{grade.exam_name}</Text>
                  <Text style={styles.gradeMarks}>
                    {grade.marks_obtained}/{grade.total_marks} ({grade.percentage.toFixed(1)}%)
                  </Text>
                  <Text style={styles.gradeDate}>
                    {new Date(grade.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('GradesMonitor', { childId: selectedChild.id })}
              >
                <Text style={styles.viewMoreText}>View All Grades →</Text>
              </TouchableOpacity>
            </View>
          )}

          {assignments && assignments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Assignments</Text>
              {assignments.slice(0, 3).map((assignment) => (
                <View key={assignment.id} style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        assignment.status === 'overdue' && styles.statusOverdue,
                      ]}
                    >
                      <Text style={styles.statusText}>{assignment.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentSubject}>{assignment.subject_name}</Text>
                  <Text style={styles.assignmentDue}>
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
              {assignments.length > 3 && (
                <Text style={styles.moreItemsText}>
                  +{assignments.length - 3} more assignments
                </Text>
              )}
            </View>
          )}

          {fees && fees.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fee Payment Status</Text>
              {fees.slice(0, 2).map((fee) => (
                <View key={fee.id} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <Text style={styles.feeType}>{fee.fee_type}</Text>
                    <View
                      style={[
                        styles.feeStatusBadge,
                        fee.status === 'paid' && styles.feeStatusPaid,
                        fee.status === 'overdue' && styles.feeStatusOverdue,
                        fee.status === 'pending' && styles.feeStatusPending,
                      ]}
                    >
                      <Text style={styles.feeStatusText}>{fee.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.feeAmount}>₹{fee.amount.toFixed(2)}</Text>
                  {fee.balance && fee.balance > 0 && (
                    <Text style={styles.feeBalance}>Balance: ₹{fee.balance.toFixed(2)}</Text>
                  )}
                  <Text style={styles.feeDue}>
                    Due: {new Date(fee.due_date).toLocaleDateString()}
                  </Text>
                  {fee.paid_date && (
                    <Text style={styles.feePaid}>
                      Paid: {new Date(fee.paid_date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.communicationButton}
              onPress={() => navigation.navigate('Communication')}
            >
              <Text style={styles.communicationIcon}>💬</Text>
              <Text style={styles.communicationText}>Teacher Communication</Text>
              <Text style={styles.communicationArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {children.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No children found</Text>
        </View>
      )}
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
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childSelector: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  childOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  childOptionActive: {
    backgroundColor: '#5856D6',
  },
  childOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  childOptionTextActive: {
    color: '#FFFFFF',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  childPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    backgroundColor: '#5856D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childInfo: {
    marginLeft: 16,
    justifyContent: 'center',
    flex: 1,
  },
  childName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  childDetails: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  childId: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5856D6',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attendancePresent: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  attendanceAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  attendanceLate: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  attendanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  attendanceTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  alertBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewMoreButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  viewMoreText: {
    color: '#5856D6',
    fontSize: 16,
    fontWeight: '600',
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  gradeScoreBadge: {
    backgroundColor: '#5856D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  gradeScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeExam: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  gradeMarks: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  gradeDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusOverdue: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  assignmentSubject: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  assignmentDue: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  moreItemsText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  feeStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feeStatusPaid: {
    backgroundColor: '#34C759',
  },
  feeStatusPending: {
    backgroundColor: '#FF9500',
  },
  feeStatusOverdue: {
    backgroundColor: '#FF3B30',
  },
  feeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  feeAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  feeBalance: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 4,
  },
  feeDue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  feePaid: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 4,
  },
  communicationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  communicationIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  communicationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  communicationArrow: {
    fontSize: 20,
    color: '#5856D6',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
