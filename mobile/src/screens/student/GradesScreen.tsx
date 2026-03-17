import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Text, Card, Button } from '@rneui/themed';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { StudentTabScreenProps } from '@types';
import {
  gradesApi,
  GradeDetail,
  ExamDetail,
  PerformanceInsights,
  GradeDistribution,
} from '@api/grades';

type Props = StudentTabScreenProps<'Grades'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export const GradesScreen: React.FC<Props> = () => {
  const [grades, setGrades] = useState<GradeDetail[]>([]);
  const [exams, setExams] = useState<ExamDetail[]>([]);
  const [insights, setInsights] = useState<PerformanceInsights | null>(null);
  const [distribution, setDistribution] = useState<GradeDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<GradeDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [gradesRes, examsRes, insightsRes, distributionRes] = await Promise.all([
        gradesApi.getGrades({
          term: selectedTerm !== 'all' ? selectedTerm : undefined,
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        }),
        gradesApi.getExams({
          term: selectedTerm !== 'all' ? selectedTerm : undefined,
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        }),
        gradesApi.getPerformanceInsights(selectedTerm !== 'all' ? selectedTerm : undefined),
        gradesApi.getGradeDistribution(selectedTerm !== 'all' ? selectedTerm : undefined),
      ]);

      setGrades(gradesRes.data || []);
      setExams(examsRes.data || []);
      setInsights(insightsRes.data);
      setDistribution(distributionRes.data || []);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm, selectedSubject]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(grades.map(g => g.subject))];
    return ['all', ...uniqueSubjects];
  }, [grades]);

  const terms = useMemo(() => {
    const uniqueTerms = [...new Set(grades.map(g => g.term))];
    return ['all', ...uniqueTerms];
  }, [grades]);

  const subjectWiseGrades = useMemo(() => {
    const grouped: Record<string, GradeDetail[]> = {};
    grades.forEach(grade => {
      if (!grouped[grade.subject]) {
        grouped[grade.subject] = [];
      }
      grouped[grade.subject].push(grade);
    });
    return grouped;
  }, [grades]);

  const openGradeDetail = (grade: GradeDetail) => {
    setSelectedGrade(grade);
    setModalVisible(true);
  };

  const closeGradeDetail = () => {
    setSelectedGrade(null);
    setModalVisible(false);
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
        return COLORS.success;
      case 'B+':
      case 'B':
        return COLORS.info;
      case 'C+':
      case 'C':
        return COLORS.accent;
      case 'D':
        return COLORS.warning;
      default:
        return COLORS.error;
    }
  };

  const renderOverviewCard = () => {
    if (!insights) return null;

    return (
      <Card containerStyle={styles.overviewCard}>
        <Text style={styles.cardTitle}>Performance Overview</Text>
        <View style={styles.overviewContent}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{insights.overallAverage.toFixed(1)}%</Text>
            <Text style={styles.overviewLabel}>Overall Average</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: getGradeColor(insights.overallGrade) }]}>
              {insights.overallGrade}
            </Text>
            <Text style={styles.overviewLabel}>Current Grade</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{insights.totalExams}</Text>
            <Text style={styles.overviewLabel}>Total Exams</Text>
          </View>
        </View>
        <View style={styles.trendContainer}>
          <Text style={styles.trendLabel}>Trend: </Text>
          <Text
            style={[
              styles.trendValue,
              {
                color:
                  insights.trend === 'improving'
                    ? COLORS.success
                    : insights.trend === 'declining'
                      ? COLORS.error
                      : COLORS.textSecondary,
              },
            ]}
          >
            {insights.trend === 'improving' ? '📈' : insights.trend === 'declining' ? '📉' : '➡️'}{' '}
            {insights.trend.charAt(0).toUpperCase() + insights.trend.slice(1)}
          </Text>
        </View>
      </Card>
    );
  };

  const renderDistributionChart = () => {
    if (distribution.length === 0) return null;

    const chartData = {
      labels: distribution.map(d => d.grade),
      datasets: [
        {
          data: distribution.map(d => d.count),
        },
      ],
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.cardTitle}>Grade Distribution</Text>
        <BarChart
          data={chartData}
          width={SCREEN_WIDTH - SPACING.md * 4}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: COLORS.background,
            backgroundGradientFrom: COLORS.background,
            backgroundGradientTo: COLORS.background,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: BORDER_RADIUS.lg,
            },
            propsForLabels: {
              fontSize: FONT_SIZES.sm,
            },
          }}
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderPerformanceChart = () => {
    if (grades.length === 0) return null;

    const sortedGrades = [...grades].sort(
      (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    );
    const recentGrades = sortedGrades.slice(-6);

    const chartData = {
      labels: recentGrades.map(g => g.examName.slice(0, 8)),
      datasets: [
        {
          data: recentGrades.map(g => g.percentage),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.cardTitle}>Performance Trend</Text>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - SPACING.md * 4}
          height={220}
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: COLORS.background,
            backgroundGradientFrom: COLORS.background,
            backgroundGradientTo: COLORS.background,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: BORDER_RADIUS.lg,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: COLORS.primary,
            },
            propsForLabels: {
              fontSize: FONT_SIZES.xs,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Term:</Text>
          {terms.map(term => (
            <TouchableOpacity
              key={term}
              style={[styles.filterChip, selectedTerm === term && styles.filterChipActive]}
              onPress={() => setSelectedTerm(term)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedTerm === term && styles.filterChipTextActive,
                ]}
              >
                {term === 'all' ? 'All Terms' : term}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Subject:</Text>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              style={[styles.filterChip, selectedSubject === subject && styles.filterChipActive]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSubject === subject && styles.filterChipTextActive,
                ]}
              >
                {subject === 'all' ? 'All Subjects' : subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderSubjectGrades = (subject: string, subjectGrades: GradeDetail[]) => {
    const average = subjectGrades.reduce((sum, g) => sum + g.percentage, 0) / subjectGrades.length;

    return (
      <Card key={subject} containerStyle={styles.subjectCard}>
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectName}>{subject}</Text>
          <View style={styles.subjectStats}>
            <Text style={styles.subjectAverage}>{average.toFixed(1)}%</Text>
            <Text style={styles.subjectCount}>{subjectGrades.length} exams</Text>
          </View>
        </View>
        <View style={styles.gradesGrid}>
          {subjectGrades.map(grade => (
            <TouchableOpacity
              key={grade.id}
              style={styles.gradeCard}
              onPress={() => openGradeDetail(grade)}
            >
              <Text style={styles.gradeExamName} numberOfLines={1}>
                {grade.examName}
              </Text>
              <View style={styles.gradeScoreContainer}>
                <Text style={styles.gradeScore}>
                  {grade.obtainedMarks}/{grade.totalMarks}
                </Text>
                <Text style={[styles.gradePercentage, { color: getGradeColor(grade.grade) }]}>
                  {grade.percentage.toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(grade.grade) }]}>
                <Text style={styles.gradeBadgeText}>{grade.grade}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    );
  };

  const renderGradeDetailModal = () => {
    if (!selectedGrade) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeGradeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grade Details</Text>
              <TouchableOpacity onPress={closeGradeDetail}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.modalBody}>
                <Text style={styles.modalExamName}>{selectedGrade.examName}</Text>
                <Text style={styles.modalSubject}>{selectedGrade.subject}</Text>

                <View style={styles.modalScoreSection}>
                  <View
                    style={[
                      styles.modalGradeBadge,
                      { backgroundColor: getGradeColor(selectedGrade.grade) },
                    ]}
                  >
                    <Text style={styles.modalGradeBadgeText}>{selectedGrade.grade}</Text>
                  </View>
                  <Text style={styles.modalScore}>
                    {selectedGrade.obtainedMarks} / {selectedGrade.totalMarks}
                  </Text>
                  <Text style={styles.modalPercentage}>{selectedGrade.percentage.toFixed(1)}%</Text>
                </View>

                {selectedGrade.rank && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Class Rank:</Text>
                    <Text style={styles.modalInfoValue}>#{selectedGrade.rank}</Text>
                  </View>
                )}

                {selectedGrade.classAverage !== undefined && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Class Average:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGrade.classAverage.toFixed(1)}%
                    </Text>
                  </View>
                )}

                {selectedGrade.highestMarks !== undefined && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Highest Score:</Text>
                    <Text style={styles.modalInfoValue}>{selectedGrade.highestMarks}</Text>
                  </View>
                )}

                {selectedGrade.lowestMarks !== undefined && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Lowest Score:</Text>
                    <Text style={styles.modalInfoValue}>{selectedGrade.lowestMarks}</Text>
                  </View>
                )}

                <View style={styles.performanceInsightsSection}>
                  <Text style={styles.insightsTitle}>Performance Insights</Text>
                  {selectedGrade.classAverage !== undefined && (
                    <View style={styles.insightCard}>
                      <Text style={styles.insightLabel}>Performance vs Class</Text>
                      <Text
                        style={[
                          styles.insightValue,
                          {
                            color:
                              selectedGrade.percentage >= selectedGrade.classAverage
                                ? COLORS.success
                                : COLORS.error,
                          },
                        ]}
                      >
                        {selectedGrade.percentage >= selectedGrade.classAverage
                          ? '📈 Above Average'
                          : '📉 Below Average'}
                      </Text>
                      <Text style={styles.insightDetail}>
                        {Math.abs(selectedGrade.percentage - selectedGrade.classAverage).toFixed(1)}
                        %{' '}
                        {selectedGrade.percentage >= selectedGrade.classAverage ? 'above' : 'below'}{' '}
                        class average
                      </Text>
                    </View>
                  )}
                </View>

                {selectedGrade.remarks && (
                  <View style={styles.remarksSection}>
                    <Text style={styles.remarksTitle}>Remarks</Text>
                    <Text style={styles.remarksText}>{selectedGrade.remarks}</Text>
                  </View>
                )}

                {selectedGrade.teacherComments && (
                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Teacher Comments</Text>
                    <Text style={styles.commentsText}>{selectedGrade.teacherComments}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <Button
              title="Close"
              onPress={closeGradeDetail}
              buttonStyle={styles.closeModalButton}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading grades...</Text>
          </View>
        ) : (
          <>
            {renderOverviewCard()}
            {renderPerformanceChart()}
            {renderDistributionChart()}
            {renderFilters()}
            {Object.keys(subjectWiseGrades).length > 0 ? (
              Object.entries(subjectWiseGrades).map(([subject, subjectGrades]) =>
                renderSubjectGrades(subject, subjectGrades)
              )
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>No grades available</Text>
                <Text style={styles.emptySubtext}>
                  Grades will appear here once exams are graded
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {renderGradeDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  overviewCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  overviewLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  trendLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  trendValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  filtersContainer: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  subjectCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subjectName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subjectStats: {
    alignItems: 'flex-end',
  },
  subjectAverage: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subjectCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  gradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gradeCard: {
    width: (SCREEN_WIDTH - SPACING.md * 5) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gradeExamName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  gradeScoreContainer: {
    marginBottom: SPACING.sm,
  },
  gradeScore: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  gradePercentage: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  gradeBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textSecondary,
    padding: SPACING.sm,
  },
  modalBody: {
    padding: SPACING.md,
  },
  modalExamName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubject: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  modalScoreSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  modalGradeBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  modalGradeBadgeText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  modalScore: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalPercentage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalInfoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  modalInfoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  performanceInsightsSection: {
    marginTop: SPACING.lg,
  },
  insightsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  insightCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  insightLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  insightValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  insightDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  remarksSection: {
    marginTop: SPACING.lg,
  },
  remarksTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  remarksText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  commentsSection: {
    marginTop: SPACING.md,
  },
  commentsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  commentsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  closeModalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
});
