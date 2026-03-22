import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentApi } from '../../api/studentApi';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { Assignment } from '../../types/student';
import { MainTabParamList } from '../../types/navigation';

type TabType = 'pending' | 'submitted' | 'graded';
type NavigationProp = NativeStackNavigationProp<MainTabParamList>;

export const AssignmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [activeTab]);

  const loadAssignments = async () => {
    try {
      let data;
      if (await isDemoUser()) {
        const allAssignments = await demoDataApi.student.getAssignments();
        data = allAssignments.filter(a => a.status === activeTab);
      } else {
        data = await studentApi.getAssignments(activeTab);
      }
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments();
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
    if (days < 0) return `${Math.abs(days)} days overdue`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDueDateColor = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return '#FF3B30';
    if (days <= 2) return '#FF9500';
    return '#34C759';
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return '#34C759';
    if (percentage >= 50) return '#FF9500';
    return '#FF3B30';
  };

  const renderAssignment = ({ item }: { item: Assignment }) => (
    <TouchableOpacity
      style={styles.assignmentCard}
      onPress={() => {
        if (item.status === 'pending') {
          navigation.navigate('AssignmentSubmission', { assignmentId: item.id });
        } else {
          navigation.navigate('AssignmentDetail', { assignmentId: item.id });
        }
      }}
    >
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentTitle}>{item.title}</Text>
          <Text style={styles.assignmentSubject}>{item.subject}</Text>
        </View>
        {item.status === 'graded' && item.score !== undefined && (
          <View style={styles.scoreContainer}>
            <Text style={[
              styles.scoreText,
              { color: getScoreColor(item.score, item.max_score) }
            ]}>
              {item.score}/{item.max_score}
            </Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.assignmentDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.assignmentFooter}>
        {item.status === 'pending' && (
          <View style={styles.dueDate}>
            <Text style={[styles.dueDateText, { color: getDueDateColor(item.due_date) }]}>
              Due: {formatDate(item.due_date)}
            </Text>
          </View>
        )}
        {item.status === 'submitted' && item.submission_date && (
          <View style={styles.submittedInfo}>
            <Text style={styles.submittedText}>
              Submitted: {formatDate(item.submission_date)}
            </Text>
          </View>
        )}
        {item.status === 'graded' && item.submission_date && (
          <View style={styles.submittedInfo}>
            <Text style={styles.submittedText}>
              Graded: {formatDate(item.submission_date)}
            </Text>
          </View>
        )}
        <Text style={styles.maxScore}>{item.max_score} points</Text>
      </View>

      {item.status === 'graded' && item.feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackLabel}>Feedback:</Text>
          <Text style={styles.feedbackText} numberOfLines={2}>{item.feedback}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'pending' ? '✅' : activeTab === 'submitted' ? '⏳' : '🎓'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'pending' && 'No Pending Assignments'}
        {activeTab === 'submitted' && 'No Submitted Assignments'}
        {activeTab === 'graded' && 'No Graded Assignments'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'pending' && 'You\'re all caught up!'}
        {activeTab === 'submitted' && 'Assignments you submit will appear here'}
        {activeTab === 'graded' && 'Graded assignments will appear here'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'submitted' && styles.activeTab]}
          onPress={() => setActiveTab('submitted')}
        >
          <Text style={[styles.tabText, activeTab === 'submitted' && styles.activeTabText]}>
            Submitted
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'graded' && styles.activeTab]}
          onPress={() => setActiveTab('graded')}
        >
          <Text style={[styles.tabText, activeTab === 'graded' && styles.activeTabText]}>
            Graded
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignment}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  assignmentSubject: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  scoreContainer: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submittedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submittedText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  maxScore: {
    fontSize: 14,
    color: '#8E8E93',
  },
  feedbackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  feedbackLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
