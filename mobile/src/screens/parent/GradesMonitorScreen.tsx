import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchExamResults, fetchSubjectPerformance } from '@store/slices/parentSlice';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { ExamResult, SubjectPerformance } from '../../types/parent';

type GradesMonitorScreenRouteProp = RouteProp<MainTabParamList, 'GradesMonitor'>;

interface GradesMonitorScreenProps {
  route: GradesMonitorScreenRouteProp;
}

const screenWidth = Dimensions.get('window').width;

export const GradesMonitorScreen: React.FC<GradesMonitorScreenProps> = ({ route }) => {
  const { childId } = route.params;
  const dispatch = useAppDispatch();
  const { examResults, subjectPerformance, children } = useAppSelector((state) => state.parent);

  const [selectedTerm, setSelectedTerm] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [demoResults, setDemoResults] = useState<ExamResult[]>([]);
  const [demoPerformance, setDemoPerformance] = useState<SubjectPerformance[]>([]);

  const child = children.find((c) => c.id === childId);
  const isDemo = isDemoUser();
  const results = isDemo ? demoResults : (examResults[childId] || []);
  const performance = isDemo ? demoPerformance : (subjectPerformance[childId] || []);

  useEffect(() => {
    loadGradesData();
  }, [childId, selectedTerm]);

  const loadGradesData = async () => {
    setIsLoading(true);
    try {
      if (isDemoUser()) {
        const [resultsData, performanceData] = await Promise.all([
          demoDataApi.parent.getExamResults(childId, selectedTerm),
          demoDataApi.parent.getSubjectPerformance(childId),
        ]);
        setDemoResults(resultsData);
        setDemoPerformance(performanceData);
      } else {
        await Promise.all([
          dispatch(fetchExamResults({ childId, term: selectedTerm })),
          dispatch(fetchSubjectPerformance(childId)),
        ]);
      }
    } catch (error) {
      console.error('Failed to load grades data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTerms = () => {
    const terms = new Set<string>();
    results.forEach((result) => {
      if (result.term) {
        terms.add(result.term);
      }
    });
    return Array.from(terms);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#34C759';
    if (percentage >= 80) return '#30D158';
    if (percentage >= 70) return '#FF9500';
    if (percentage >= 60) return '#FF9F0A';
    return '#FF3B30';
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '➡️';
    }
  };

  const renderBarChart = (subjectResults: any[]) => {
    const maxMarks = Math.max(...subjectResults.map((s) => s.total_marks));
    const chartHeight = 200;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {subjectResults.map((subject, index) => {
            const heightPercentage = (subject.marks_obtained / maxMarks) * 100;
            const barHeight = (chartHeight * heightPercentage) / 100;

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: getGradeColor(subject.percentage),
                      },
                    ]}
                  >
                    <Text style={styles.barValue}>{subject.marks_obtained}</Text>
                  </View>
                </View>
                <Text style={styles.barLabel} numberOfLines={2}>
                  {subject.subject_name}
                </Text>
                <Text style={styles.barPercentage}>{subject.percentage.toFixed(0)}%</Text>
              </View>
            );
          })}
        </View>
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

  const terms = getTerms();

  return (
    <ScrollView style={styles.container}>
      {child && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {child.first_name} {child.last_name}
          </Text>
          <Text style={styles.headerSubtitle}>Grades Monitor</Text>
        </View>
      )}

      {terms.length > 0 && (
        <View style={styles.termSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.termButton, !selectedTerm && styles.termButtonActive]}
              onPress={() => setSelectedTerm(undefined)}
            >
              <Text
                style={[styles.termButtonText, !selectedTerm && styles.termButtonTextActive]}
              >
                All Terms
              </Text>
            </TouchableOpacity>
            {terms.map((term) => (
              <TouchableOpacity
                key={term}
                style={[styles.termButton, selectedTerm === term && styles.termButtonActive]}
                onPress={() => setSelectedTerm(term)}
              >
                <Text
                  style={[
                    styles.termButtonText,
                    selectedTerm === term && styles.termButtonTextActive,
                  ]}
                >
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exam Results</Text>
        {results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No exam results available</Text>
          </View>
        ) : (
          results.map((result) => (
            <View key={result.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultExam}>{result.exam_name}</Text>
                  {result.term && <Text style={styles.resultTerm}>{result.term}</Text>}
                </View>
                <View style={styles.resultScore}>
                  <Text style={styles.resultPercentage}>{result.percentage.toFixed(1)}%</Text>
                  {result.rank && <Text style={styles.resultRank}>Rank: #{result.rank}</Text>}
                </View>
              </View>

              <View style={styles.resultMarks}>
                <Text style={styles.resultMarksText}>
                  {result.marks_obtained}/{result.total_marks} marks
                </Text>
              </View>

              {result.subjects && result.subjects.length > 0 && (
                <>
                  <Text style={styles.subjectsTitle}>Subject Breakdown:</Text>
                  {renderBarChart(result.subjects)}

                  <View style={styles.subjectsList}>
                    {result.subjects.map((subject, index) => (
                      <View key={index} style={styles.subjectRow}>
                        <Text style={styles.subjectRowName}>{subject.subject_name}</Text>
                        <View style={styles.subjectRowScore}>
                          <Text style={styles.subjectRowMarks}>
                            {subject.marks_obtained}/{subject.total_marks}
                          </Text>
                          <View
                            style={[
                              styles.gradeBadge,
                              { backgroundColor: getGradeColor(subject.percentage) },
                            ]}
                          >
                            <Text style={styles.gradeText}>{subject.grade}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject Performance</Text>
        {performance.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No performance data available</Text>
          </View>
        ) : (
          performance.map((subject, index) => (
            <View key={index} style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceName}>{subject.subject_name}</Text>
                <Text style={styles.performanceTrend}>{getTrendIcon(subject.trend)}</Text>
              </View>

              <View style={styles.performanceStats}>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceStatLabel}>Average</Text>
                  <Text
                    style={[
                      styles.performanceStatValue,
                      { color: getGradeColor(subject.average_score) },
                    ]}
                  >
                    {subject.average_score.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceStatLabel}>Highest</Text>
                  <Text style={styles.performanceStatValue}>
                    {subject.highest_score.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceStatLabel}>Lowest</Text>
                  <Text style={styles.performanceStatValue}>
                    {subject.lowest_score.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <View style={styles.performanceBar}>
                <View
                  style={[
                    styles.performanceBarFill,
                    {
                      width: `${subject.average_score}%`,
                      backgroundColor: getGradeColor(subject.average_score),
                    },
                  ]}
                />
              </View>

              <Text style={styles.performanceExams}>
                Based on {subject.total_exams} exam(s)
              </Text>
            </View>
          ))
        )}
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
  termSelector: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  termButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  termButtonActive: {
    backgroundColor: '#5856D6',
  },
  termButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  termButtonTextActive: {
    color: '#FFFFFF',
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultExam: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  resultTerm: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resultScore: {
    alignItems: 'flex-end',
  },
  resultPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5856D6',
  },
  resultRank: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  resultMarks: {
    marginBottom: 16,
  },
  resultMarksText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  subjectsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 12,
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barColumn: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    minHeight: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  barLabel: {
    fontSize: 10,
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 4,
    height: 28,
  },
  barPercentage: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
  },
  subjectsList: {
    marginTop: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  subjectRowName: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  subjectRowScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectRowMarks: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  performanceCard: {
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
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  performanceTrend: {
    fontSize: 24,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  performanceStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  performanceBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceExams: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
