import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { studentApi } from '../../api/studentApi';
import { Assignment } from '../../types/student';

export const AssignmentDetailScreen: React.FC = () => {
  const route = useRoute();
  const { assignmentId } = route.params as { assignmentId: number };

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignment();
  }, []);

  const loadAssignment = async () => {
    try {
      const data = await studentApi.getAssignmentById(assignmentId);
      setAssignment(data);
    } catch (error) {
      console.error('Error loading assignment:', error);
      Alert.alert('Error', 'Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return '#34C759';
    if (percentage >= 50) return '#FF9500';
    return '#FF3B30';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Assignment not found</Text>
      </View>
    );
  }

  const percentage = assignment.score
    ? Math.round((assignment.score / assignment.max_score) * 100)
    : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{assignment.title}</Text>
        <Text style={styles.subject}>{assignment.subject}</Text>
      </View>

      {assignment.status === 'graded' && assignment.score !== undefined && (
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={[
              styles.scoreText,
              { color: getScoreColor(assignment.score, assignment.max_score) }
            ]}>
              {percentage}%
            </Text>
            <Text style={styles.scoreSubtext}>
              {assignment.score}/{assignment.max_score}
            </Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            {assignment.grade_letter && (
              <Text style={styles.gradeLetter}>{assignment.grade_letter}</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{assignment.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={[
            styles.statusBadge,
            assignment.status === 'graded' ? styles.statusGraded :
            assignment.status === 'submitted' ? styles.statusSubmitted :
            styles.statusPending
          ]}>
            <Text style={styles.statusText}>{assignment.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date</Text>
          <Text style={styles.detailValue}>{formatDate(assignment.due_date)}</Text>
        </View>

        {assignment.submission_date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>{formatDate(assignment.submission_date)}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Max Score</Text>
          <Text style={styles.detailValue}>{assignment.max_score} points</Text>
        </View>
      </View>

      {assignment.feedback && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teacher Feedback</Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>{assignment.feedback}</Text>
          </View>
        </View>
      )}

      {assignment.attachments && assignment.attachments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          {assignment.attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Text style={styles.attachmentIcon}>📎</Text>
              <Text style={styles.attachmentText}>{attachment}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomPadding} />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subject: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 8,
  },
  gradeLetter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusGraded: {
    backgroundColor: '#34C759',
  },
  statusSubmitted: {
    backgroundColor: '#007AFF',
  },
  statusPending: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  feedbackCard: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  attachmentText: {
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
  },
  bottomPadding: {
    height: 32,
  },
});
