import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { studentApi } from '../api/studentApi';
import {
  StudentStats,
  Assignment,
  Grade,
  AttendanceStatus,
  AIPrediction,
  WeakArea,
  GamificationBadge,
} from '../types/student';

export const StudentDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [badges, setBadges] = useState<GamificationBadge[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        statsData,
        attendanceData,
        assignmentsData,
        gradesData,
        predictionsData,
        weakAreasData,
        badgesData,
      ] = await Promise.all([
        studentApi.getStats(),
        studentApi.getAttendance(),
        studentApi.getAssignments('pending'),
        studentApi.getGrades(5),
        studentApi.getAIPredictions(),
        studentApi.getWeakAreas(),
        studentApi.getBadges(),
      ]);

      setStats(statsData);
      setAttendance(attendanceData);
      setAssignments(assignmentsData.slice(0, 3));
      setGrades(gradesData);
      setPredictions(predictionsData);
      setWeakAreas(weakAreasData.slice(0, 3));
      setBadges(badgesData.filter(b => b.is_earned).slice(0, 4));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0 && days <= 7) return `In ${days} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present': return '#34C759';
      case 'absent': return '#FF3B30';
      case 'late': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>Hello, {user?.first_name || 'Student'}! 👋</Text>
        <Text style={styles.subtitle}>Ready to learn something new today?</Text>
      </View>

      {attendance && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Attendance Status</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getAttendanceColor(attendance.today_status) }
            ]}>
              <Text style={styles.statusText}>
                {attendance.today_status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.attendanceStats}>
            <View style={styles.attendanceStat}>
              <Text style={styles.attendanceValue}>{attendance.current_week_percentage}%</Text>
              <Text style={styles.attendanceLabel}>This Week</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={styles.attendanceValue}>{attendance.present_days}</Text>
              <Text style={styles.attendanceLabel}>Present</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={styles.attendanceValue}>{attendance.absent_days}</Text>
              <Text style={styles.attendanceLabel}>Absent</Text>
            </View>
          </View>
        </View>
      )}

      {stats && (
        <View style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakDays}>{stats.streak_days} Day Streak!</Text>
              <Text style={styles.streakSubtext}>Keep up the great work</Text>
            </View>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsValue}>⭐ {stats.points}</Text>
            <Text style={styles.pointsLabel}>Level {stats.level}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Upcoming Assignments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('StudentAssignments' as never)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <TouchableOpacity
              key={assignment.id}
              style={styles.assignmentItem}
            >
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                <Text style={styles.assignmentSubject}>{assignment.subject}</Text>
              </View>
              <View style={styles.assignmentMeta}>
                <Text style={styles.assignmentDue}>{formatDate(assignment.due_date)}</Text>
                <Text style={styles.assignmentScore}>{assignment.max_score} pts</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No pending assignments</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Grades</Text>
        </View>
        {grades.length > 0 ? (
          grades.map((grade) => (
            <View key={grade.id} style={styles.gradeItem}>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeSubject}>{grade.subject}</Text>
                <Text style={styles.gradeAssignment}>{grade.assignment_title}</Text>
              </View>
              <View style={styles.gradeScore}>
                <Text style={styles.gradeValue}>
                  {grade.score}/{grade.max_score}
                </Text>
                <Text style={[
                  styles.gradePercentage,
                  { color: grade.percentage >= 70 ? '#34C759' : grade.percentage >= 50 ? '#FF9500' : '#FF3B30' }
                ]}>
                  {grade.percentage}%
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No grades yet</Text>
        )}
      </View>

      {predictions.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI Performance Predictions</Text>
          </View>
          {predictions.map((prediction, index) => (
            <View key={index} style={styles.predictionItem}>
              <View style={styles.predictionInfo}>
                <Text style={styles.predictionSubject}>{prediction.subject}</Text>
                <Text style={styles.predictionGrade}>
                  Predicted: {prediction.predicted_grade}%
                </Text>
              </View>
              <View style={styles.predictionMeta}>
                <Text style={styles.trendIcon}>{getTrendIcon(prediction.trend)}</Text>
                <Text style={styles.confidence}>{Math.round(prediction.confidence * 100)}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {weakAreas.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Areas to Improve</Text>
          </View>
          {weakAreas.map((area, index) => (
            <View key={index} style={styles.weakAreaItem}>
              <View style={styles.weakAreaHeader}>
                <Text style={styles.weakAreaSubject}>{area.subject}</Text>
                <Text style={styles.weakAreaScore}>{area.score_percentage}%</Text>
              </View>
              <Text style={styles.weakAreaTopic}>{area.topic}</Text>
              <Text style={styles.weakAreaRecommendation}>{area.recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      {badges.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Badges</Text>
          </View>
          <View style={styles.badgesContainer}>
            {badges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
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
  welcomeCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceStat: {
    alignItems: 'center',
  },
  attendanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  streakInfo: {
    justifyContent: 'center',
  },
  streakDays: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  streakSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  assignmentSubject: {
    fontSize: 14,
    color: '#8E8E93',
  },
  assignmentMeta: {
    alignItems: 'flex-end',
  },
  assignmentDue: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  assignmentScore: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  gradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  gradeAssignment: {
    fontSize: 14,
    color: '#8E8E93',
  },
  gradeScore: {
    alignItems: 'flex-end',
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  gradePercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  predictionInfo: {
    flex: 1,
  },
  predictionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  predictionGrade: {
    fontSize: 14,
    color: '#8E8E93',
  },
  predictionMeta: {
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 24,
  },
  confidence: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  weakAreaItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  weakAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weakAreaSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  weakAreaScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  weakAreaTopic: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  weakAreaRecommendation: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    width: '22%',
  },
  badgeIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
