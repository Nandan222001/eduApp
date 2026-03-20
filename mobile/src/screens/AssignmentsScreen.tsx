import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchAssignments } from '@store/slices/assignmentsSlice';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { CachedDataBanner } from '../components/CachedDataBanner';
import { Assignment } from '../types/student';

export const AssignmentsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { assignments, isLoading, lastUpdated } = useAppSelector((state) => state.assignments);

  useEffect(() => {
    if (assignments.length === 0) {
      dispatch(fetchAssignments(undefined));
    }
  }, [dispatch, assignments.length]);

  const handleRefresh = async () => {
    await dispatch(fetchAssignments(undefined)).unwrap();
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'submitted':
        return '#17A2B8';
      case 'graded':
        return '#28A745';
      default:
        return '#6C757D';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderAssignment = ({ item }: { item: Assignment }) => (
    <TouchableOpacity style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.assignmentSubject}>{item.subject}</Text>
      
      <View style={styles.assignmentDetails}>
        <Text style={styles.detailText}>Due: {formatDate(item.due_date)}</Text>
        <Text style={styles.detailText}>Max Score: {item.max_score}</Text>
      </View>

      {item.score !== undefined && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score:</Text>
          <Text style={styles.scoreValue}>
            {item.score}/{item.max_score}
          </Text>
          {item.grade_letter && (
            <Text style={styles.gradeLetter}>{item.grade_letter}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <CachedDataBanner lastUpdated={lastUpdated} onRefresh={handleRefresh} />
      
      <FlatList
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading assignments...' : 'No assignments found'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 16,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
  assignmentTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  assignmentSubject: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  assignmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  detailText: {
    fontSize: 14,
    color: '#6C757D',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  gradeLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
});
