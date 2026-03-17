import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Text, Icon } from '@rneui/themed';
import { ParentTabScreenProps } from '@types';
import { Card } from '@components';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import {
  parentsApi,
  Child,
  ChildOverview,
  TodayAttendance,
  RecentGrade,
  PendingAssignment,
  FeePaymentStatus,
  MessagePreview,
} from '@api/parents';

type Props = ParentTabScreenProps<'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [childOverview, setChildOverview] = useState<ChildOverview | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [feeStatus, setFeeStatus] = useState<FeePaymentStatus | null>(null);
  const [messages, setMessages] = useState<MessagePreview[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const dashboardResponse = await parentsApi.getDashboard();
      const childrenData = dashboardResponse.data.children;
      setChildren(childrenData);

      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  }, [selectedChildId]);

  const fetchChildData = useCallback(async (childId: number) => {
    try {
      const [
        overviewResponse,
        attendanceResponse,
        gradesResponse,
        assignmentsResponse,
        feesResponse,
        messagesResponse,
      ] = await Promise.all([
        parentsApi.getChildOverview(childId),
        parentsApi.getTodayAttendance(childId),
        parentsApi.getRecentGrades(childId),
        parentsApi.getPendingAssignments(childId),
        parentsApi.getOutstandingFees(),
        parentsApi.getMessages(),
      ]);

      setChildOverview(overviewResponse.data);
      setTodayAttendance(attendanceResponse.data);
      setRecentGrades(gradesResponse.data);
      setPendingAssignments(assignmentsResponse.data);
      setFeeStatus(feesResponse.data);
      setMessages(messagesResponse.data);
    } catch (error) {
      console.error('Error fetching child data:', error);
      Alert.alert('Error', 'Failed to load child data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedChildId) {
      setLoading(true);
      fetchChildData(selectedChildId);
    }
  }, [selectedChildId, fetchChildData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    if (selectedChildId) {
      await fetchChildData(selectedChildId);
    }
    setRefreshing(false);
  }, [selectedChildId, fetchDashboardData, fetchChildData]);

  const handleChildChange = (childId: number) => {
    setSelectedChildId(childId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'absent':
        return COLORS.error;
      case 'late':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'check-circle';
      case 'absent':
        return 'close-circle';
      case 'late':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>No children found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.header}>
          <Text h3 style={styles.headerTitle}>
            Parent Dashboard
          </Text>
        </View>

        <View style={styles.childSelector}>
          <Text style={styles.childSelectorLabel}>Select Child</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedChildId}
              onValueChange={itemValue => handleChildChange(itemValue as number)}
              style={styles.picker}
            >
              {children.map(child => (
                <Picker.Item
                  key={child.id}
                  label={`${child.firstName} ${child.lastName}`}
                  value={child.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {todayAttendance?.status === 'absent' && (
          <Card style={styles.alertCard}>
            <View style={styles.alertContent}>
              <Icon name="alert-circle" type="ionicon" color={COLORS.error} size={24} />
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>Absent Today</Text>
                <Text style={styles.alertMessage}>
                  {childOverview?.firstName} was marked absent today
                </Text>
              </View>
            </View>
          </Card>
        )}

        {childOverview && (
          <Card style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              {childOverview.profilePhoto ? (
                <Image source={{ uri: childOverview.profilePhoto }} style={styles.profilePhoto} />
              ) : (
                <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder]}>
                  <Icon name="person" type="ionicon" color={COLORS.textSecondary} size={40} />
                </View>
              )}
              <View style={styles.overviewInfo}>
                <Text style={styles.childName}>
                  {childOverview.firstName} {childOverview.lastName}
                </Text>
                <Text style={styles.studentId}>ID: {childOverview.studentId}</Text>
                {childOverview.grade && (
                  <Text style={styles.gradeSection}>
                    Grade {childOverview.grade}
                    {childOverview.section && ` - ${childOverview.section}`}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {childOverview.attendancePercentage.toFixed(1)}%
                </Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {childOverview.rank}/{childOverview.totalStudents}
                </Text>
                <Text style={styles.statLabel}>Rank</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{childOverview.averageScore.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
            </View>
          </Card>
        )}

        {todayAttendance && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today&apos;s Attendance</Text>
            </View>
            <View style={styles.attendanceStatus}>
              <Icon
                name={getAttendanceStatusIcon(todayAttendance.status)}
                type="ionicon"
                color={getAttendanceStatusColor(todayAttendance.status)}
                size={32}
              />
              <View style={styles.attendanceInfo}>
                <Text
                  style={[
                    styles.attendanceStatusText,
                    { color: getAttendanceStatusColor(todayAttendance.status) },
                  ]}
                >
                  {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)}
                </Text>
                {todayAttendance.markedAt && (
                  <Text style={styles.attendanceTime}>
                    Marked at{' '}
                    {new Date(todayAttendance.markedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
                {todayAttendance.remarks && (
                  <Text style={styles.attendanceRemarks}>{todayAttendance.remarks}</Text>
                )}
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Grades</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Grades', { childId: selectedChildId?.toString() })
              }
            >
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentGrades.length > 0 ? (
            <View style={styles.gradesTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.subjectColumn]}>Subject</Text>
                <Text style={[styles.tableHeaderText, styles.scoreColumn]}>Score</Text>
                <Text style={[styles.tableHeaderText, styles.gradeColumn]}>Grade</Text>
              </View>
              {recentGrades.map(grade => (
                <View key={grade.id} style={styles.tableRow}>
                  <View style={styles.subjectColumn}>
                    <Text style={styles.tableText}>{grade.subject}</Text>
                    <Text style={styles.examName}>{grade.examName}</Text>
                  </View>
                  <Text style={[styles.tableText, styles.scoreColumn]}>
                    {grade.obtainedMarks}/{grade.totalMarks}
                  </Text>
                  <Text style={[styles.tableText, styles.gradeColumn, styles.gradeText]}>
                    {grade.grade}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No recent grades</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pending Assignments</Text>
          </View>
          {pendingAssignments.length > 0 ? (
            <View style={styles.assignmentsList}>
              {pendingAssignments.map(assignment => (
                <TouchableOpacity
                  key={assignment.id}
                  style={styles.assignmentItem}
                  onPress={() =>
                    navigation.navigate('AssignmentDetail', {
                      assignmentId: assignment.id.toString(),
                    })
                  }
                >
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <Text style={styles.assignmentSubject}>{assignment.subject}</Text>
                    <View style={styles.assignmentMeta}>
                      <Icon name="calendar" type="ionicon" color={COLORS.textSecondary} size={14} />
                      <Text style={styles.assignmentDueDate}>
                        Due: {formatDate(assignment.dueDate)}
                      </Text>
                    </View>
                  </View>
                  {assignment.status === 'overdue' && (
                    <View style={styles.overdueTag}>
                      <Text style={styles.overdueText}>Overdue</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No pending assignments</Text>
          )}
        </Card>

        {feeStatus && feeStatus.totalOutstanding > 0 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Fee Payment Status</Text>
            </View>
            <View style={styles.feeStatusContainer}>
              <View style={styles.feeOutstanding}>
                <Text style={styles.feeAmount}>
                  {feeStatus.currency} {feeStatus.totalOutstanding.toFixed(2)}
                </Text>
                <Text style={styles.feeLabel}>Total Outstanding</Text>
                {feeStatus.dueDate && (
                  <Text style={styles.feeDueDate}>Due: {formatDate(feeStatus.dueDate)}</Text>
                )}
              </View>
              {feeStatus.fees.slice(0, 3).map(fee => (
                <View key={fee.id} style={styles.feeItem}>
                  <View style={styles.feeItemInfo}>
                    <Text style={styles.feeDescription}>{fee.description}</Text>
                    <Text style={styles.feeItemDate}>Due: {formatDate(fee.dueDate)}</Text>
                  </View>
                  <Text style={styles.feeItemAmount}>
                    {feeStatus.currency} {fee.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Teacher Communication</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {messages.length > 0 ? (
            <View style={styles.messagesList}>
              {messages.slice(0, 3).map(message => (
                <TouchableOpacity
                  key={message.id}
                  style={styles.messageItem}
                  onPress={() =>
                    navigation.navigate('MessageDetail', { messageId: message.id.toString() })
                  }
                >
                  <View style={styles.messageHeader}>
                    <View style={styles.messageHeaderLeft}>
                      <Text style={styles.messageSender}>{message.senderName}</Text>
                      {!message.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.messageDate}>{formatDate(message.sentAt)}</Text>
                  </View>
                  <Text style={styles.messageSubject}>{message.subject}</Text>
                  <Text style={styles.messagePreview} numberOfLines={2}>
                    {message.preview}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No messages</Text>
          )}
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    marginBottom: 0,
  },
  childSelector: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  childSelectorLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  alertCard: {
    margin: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  alertTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  alertMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  overviewCard: {
    margin: SPACING.lg,
    marginTop: SPACING.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePhotoPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  childName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  studentId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  gradeSection: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  attendanceStatusText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  attendanceTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  attendanceRemarks: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  gradesTable: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  tableHeaderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  subjectColumn: {
    flex: 2,
  },
  scoreColumn: {
    flex: 1,
    textAlign: 'center',
  },
  gradeColumn: {
    flex: 1,
    textAlign: 'center',
  },
  tableText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  examName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  gradeText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  assignmentsList: {
    gap: SPACING.sm,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  assignmentSubject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  assignmentDueDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  overdueTag: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  overdueText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: '600',
  },
  feeStatusContainer: {
    gap: SPACING.md,
  },
  feeOutstanding: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  feeAmount: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  feeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  feeDueDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  feeItemInfo: {
    flex: 1,
  },
  feeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  feeItemDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  feeItemAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
  },
  messagesList: {
    gap: SPACING.sm,
  },
  messageItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  messageSender: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  messageDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  messageSubject: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  messagePreview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
