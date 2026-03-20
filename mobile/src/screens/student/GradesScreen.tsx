import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text, Card, Icon, ButtonGroup } from '@rneui/themed';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { StudentTabScreenProps } from '@types';
import { studentApi } from '../../api/student';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { Grade } from '../../types/student';

type Props = StudentTabScreenProps<'Grades'>;

const { width } = Dimensions.get('window');

interface GradeCardProps {
  grade: Grade;
}

const GradeCard: React.FC<GradeCardProps> = ({ grade }) => {
  const getGradeColor = (gradeValue: string) => {
    const upperGrade = gradeValue.toUpperCase();
    if (upperGrade === 'A+' || upperGrade === 'A') return COLORS.success;
    if (upperGrade === 'A-' || upperGrade === 'B+' || upperGrade === 'B') return COLORS.info;
    if (upperGrade === 'B-' || upperGrade === 'C+' || upperGrade === 'C') return COLORS.warning;
    return COLORS.error;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return COLORS.success;
    if (percentage >= 75) return COLORS.info;
    if (percentage >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <Card containerStyle={styles.gradeCard}>
      <View style={styles.gradeCardHeader}>
        <View style={styles.gradeCardHeaderLeft}>
          <Text style={styles.examName}>{grade.examName}</Text>
          <Text style={styles.subjectName}>{grade.subject}</Text>
        </View>
        <View style={styles.gradeCircle}>
          <Text style={[styles.gradeValue, { color: getGradeColor(grade.grade) }]}>
            {grade.grade}
          </Text>
        </View>
      </View>

      <View style={styles.gradeCardBody}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {grade.obtainedMarks}/{grade.totalMarks}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Percentage</Text>
            <Text style={[styles.scoreValue, { color: getPercentageColor(grade.percentage) }]}>
              {grade.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.examDateRow}>
          <Icon name="calendar" type="feather" size={14} color={COLORS.textSecondary} />
          <Text style={styles.examDate}>{format(parseISO(grade.examDate), 'MMM dd, yyyy')}</Text>
        </View>

        {grade.remarks && (
          <View style={styles.remarksContainer}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{grade.remarks}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

interface PerformanceChartProps {
  grades: Grade[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ grades }) => {
  const chartData = useMemo(() => {
    const subjectAverages = grades.reduce(
      (acc, grade) => {
        if (!acc[grade.subject]) {
          acc[grade.subject] = { total: 0, count: 0 };
        }
        acc[grade.subject].total += grade.percentage;
        acc[grade.subject].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    return Object.entries(subjectAverages).map(([subject, data]) => ({
      subject,
      average: data.total / data.count,
    }));
  }, [grades]);

  const maxPercentage = 100;
  const chartWidth = width - SPACING.md * 4;

  return (
    <Card containerStyle={styles.chartCard}>
      <Text style={styles.chartTitle}>Performance Overview</Text>
      <View style={styles.chartContainer}>
        {chartData.map((item, index) => {
          const barHeight = (item.average / maxPercentage) * 150;
          const barColor =
            item.average >= 75
              ? COLORS.success
              : item.average >= 60
                ? COLORS.warning
                : COLORS.error;

          return (
            <View key={index} style={styles.chartBarContainer}>
              <View style={styles.barWrapper}>
                <View style={[styles.chartBar, { height: barHeight, backgroundColor: barColor }]}>
                  <Text style={styles.barValueText}>{item.average.toFixed(0)}%</Text>
                </View>
              </View>
              <Text style={styles.barLabel} numberOfLines={2}>
                {item.subject}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

interface StatsSummaryProps {
  grades: Grade[];
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ grades }) => {
  const stats = useMemo(() => {
    if (grades.length === 0) {
      return { average: 0, highest: 0, lowest: 0, totalExams: 0 };
    }

    const percentages = grades.map(g => g.percentage);
    return {
      average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      totalExams: grades.length,
    };
  }, [grades]);

  return (
    <Card containerStyle={styles.statsCard}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Icon name="trending-up" type="feather" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats.average.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="arrow-up" type="feather" size={24} color={COLORS.success} />
          <Text style={styles.statValue}>{stats.highest.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Highest</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="arrow-down" type="feather" size={24} color={COLORS.error} />
          <Text style={styles.statValue}>{stats.lowest.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Lowest</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="file-text" type="feather" size={24} color={COLORS.info} />
          <Text style={styles.statValue}>{stats.totalExams}</Text>
          <Text style={styles.statLabel}>Total Exams</Text>
        </View>
      </View>
    </Card>
  );
};

export const GradesScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedTerm, setSelectedTerm] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const terms = ['All', 'Term 1', 'Term 2', 'Term 3'];
  const termParam =
    selectedTerm === 0 ? undefined : terms[selectedTerm].toLowerCase().replace(' ', '_');

  const {
    data: grades,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['grades', termParam],
    queryFn: async () => {
      if (isDemoUser()) {
        const allGrades = await demoDataApi.student.getGrades();
        return termParam ? allGrades.filter((g: any) => g.term === termParam) : allGrades;
      }
      const response = await studentApi.getGrades({ term: termParam });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRetry = () => {
    refetch();
  };

  const renderHeader = () => (
    <>
      <ButtonGroup
        buttons={terms}
        selectedIndex={selectedTerm}
        onPress={setSelectedTerm}
        containerStyle={styles.termButtonGroup}
        selectedButtonStyle={styles.selectedTermButton}
        textStyle={styles.termButtonText}
      />
      {grades && grades.length > 0 && (
        <>
          <StatsSummary grades={grades} />
          <PerformanceChart grades={grades} />
        </>
      )}
    </>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" type="feather" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Failed to load grades</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Icon name="refresh-cw" type="feather" size={20} color={COLORS.background} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!grades || grades.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Icon name="award" type="feather" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No grades available</Text>
          <Text style={styles.emptySubtext}>Your grades will appear here once published</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={grades}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <GradeCard grade={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  listContent: {
    padding: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  termButtonGroup: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  selectedTermButton: {
    backgroundColor: COLORS.primary,
  },
  termButtonText: {
    fontSize: FONT_SIZES.sm,
  },
  statsCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  chartCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barWrapper: {
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: BORDER_RADIUS.sm,
    borderTopRightRadius: BORDER_RADIUS.sm,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 30,
  },
  barValueText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  barLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
    height: 28,
  },
  gradeCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  gradeCardHeaderLeft: {
    flex: 1,
  },
  examName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subjectName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  gradeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  gradeValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  gradeCardBody: {
    gap: SPACING.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  examDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  examDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  remarksContainer: {
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  remarksLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  remarksText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
