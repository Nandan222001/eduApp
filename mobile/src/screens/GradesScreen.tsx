import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchGrades } from '../store/slices/gradesSlice';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { CachedDataBanner } from '../components/CachedDataBanner';
import { Grade } from '../types/student';

export const GradesScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { grades, isLoading, lastUpdated } = useAppSelector((state) => state.grades);

  useEffect(() => {
    if (grades.length === 0) {
      dispatch(fetchGrades(undefined));
    }
  }, [dispatch, grades.length]);

  const handleRefresh = async () => {
    await dispatch(fetchGrades(undefined)).unwrap();
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#28A745';
    if (percentage >= 80) return '#17A2B8';
    if (percentage >= 70) return '#FFC107';
    if (percentage >= 60) return '#FD7E14';
    return '#DC3545';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderGrade = ({ item }: { item: Grade }) => (
    <View style={styles.gradeCard}>
      <View style={styles.gradeHeader}>
        <View style={styles.gradeInfo}>
          <Text style={styles.assignmentTitle} numberOfLines={2}>
            {item.assignment_title}
          </Text>
          <Text style={styles.subject}>{item.subject}</Text>
        </View>
        <View style={styles.scoreSection}>
          <View
            style={[
              styles.percentageCircle,
              { borderColor: getGradeColor(item.percentage) },
            ]}
          >
            <Text style={[styles.percentage, { color: getGradeColor(item.percentage) }]}>
              {item.percentage}%
            </Text>
          </View>
          {item.grade_letter && (
            <Text style={[styles.gradeLetter, { color: getGradeColor(item.percentage) }]}>
              {item.grade_letter}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.gradeDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Score:</Text>
          <Text style={styles.detailValue}>
            {item.score}/{item.max_score}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </View>
  );

  const calculateAverage = () => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc: number, grade) => acc + grade.percentage, 0);
    return (sum / grades.length).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <CachedDataBanner lastUpdated={lastUpdated} onRefresh={handleRefresh} />
      
      {grades.length > 0 && (
        <View style={styles.averageCard}>
          <Text style={styles.averageLabel}>Overall Average</Text>
          <Text style={styles.averageValue}>{calculateAverage()}%</Text>
        </View>
      )}

      <FlatList
        data={grades}
        renderItem={renderGrade}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading grades...' : 'No grades found'}
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
  averageCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  averageLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeCard: {
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
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gradeInfo: {
    flex: 1,
    marginRight: 16,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subject: {
    fontSize: 14,
    color: '#007AFF',
  },
  scoreSection: {
    alignItems: 'center',
    gap: 4,
  },
  percentageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gradeLetter: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gradeDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
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
