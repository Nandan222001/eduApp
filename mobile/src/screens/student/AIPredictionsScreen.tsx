import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { useQuery } from '@tanstack/react-query';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { studentApi } from '../../api/student';
import { Card } from '../../components/Card';

const screenWidth = Dimensions.get('window').width;

export default function AIPredictionsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'topics' | 'blueprint' | 'focus'>('topics');

  const {
    data: predictionData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai-prediction-dashboard'],
    queryFn: async () => {
      const response = await studentApi.getAIPredictionDashboardDetails();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading AI predictions...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" type="feather" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Unable to load predictions</Text>
        <Text style={styles.errorSubtext}>{(error as Error)?.message || 'Please try again'}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Icon name="refresh-cw" type="feather" size={20} color={COLORS.background} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTopicProbabilities = () => {
    if (!predictionData?.topicProbabilities.length) return null;

    const sortedTopics = [...predictionData.topicProbabilities]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10);

    const chartData = {
      labels: sortedTopics.map(t => t.topic.substring(0, 15)),
      datasets: [
        {
          data: sortedTopics.map(t => t.probability * 100),
        },
      ],
    };

    return (
      <View>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Topic Probability Rankings</Text>
          <Text style={styles.cardSubtitle}>Likelihood of topics appearing in upcoming exams</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={chartData}
              width={Math.max(screenWidth - SPACING.md * 4, sortedTopics.length * 60)}
              height={220}
              yAxisLabel=""
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
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              style={styles.chart}
              fromZero
            />
          </ScrollView>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Detailed Rankings</Text>
          {sortedTopics.map((topic, index) => (
            <View key={index} style={styles.topicItem}>
              <View style={styles.topicRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>{topic.topic}</Text>
                <Text style={styles.topicSubject}>{topic.subject}</Text>
              </View>
              <View style={styles.topicStats}>
                <Text style={styles.probabilityText}>{(topic.probability * 100).toFixed(0)}%</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {(topic.confidence * 100).toFixed(0)}% conf.
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </View>
    );
  };

  const renderQuestionBlueprint = () => {
    if (!predictionData?.questionBlueprint.length) return null;

    const pieData = predictionData.questionBlueprint.map((item, index) => ({
      name: item.category,
      population: item.questionCount,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6],
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }));

    return (
      <View>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Predicted Question Blueprint</Text>
          <Text style={styles.cardSubtitle}>Expected distribution of questions by category</Text>
          <PieChart
            data={pieData}
            width={screenWidth - SPACING.md * 4}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Blueprint Details</Text>
          {predictionData.questionBlueprint.map((item, index) => (
            <View key={index} style={styles.blueprintItem}>
              <View style={styles.blueprintHeader}>
                <View style={[styles.categoryDot, { backgroundColor: pieData[index % 6].color }]} />
                <Text style={styles.categoryName}>{item.category}</Text>
                <View style={[styles.difficultyBadge, styles[`difficulty_${item.difficulty}`]]}>
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
              </View>
              <View style={styles.blueprintDetails}>
                <Text style={styles.questionCount}>
                  {item.questionCount} questions ({(item.weight * 100).toFixed(0)}%)
                </Text>
                <Text style={styles.topicsList}>Topics: {item.topics.join(', ')}</Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    );
  };

  const renderFocusAreas = () => {
    if (!predictionData?.focusAreas.length) return null;

    const sortedAreas = [...predictionData.focusAreas].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return (
      <View>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Priority Focus Areas</Text>
          <Text style={styles.cardSubtitle}>
            Topics requiring your attention based on AI analysis
          </Text>
          {sortedAreas.map(area => (
            <View key={area.id} style={styles.focusAreaItem}>
              <View style={styles.focusAreaHeader}>
                <View style={styles.focusAreaTitle}>
                  <View style={[styles.priorityBadge, styles[`priority_${area.priority}`]]}>
                    <Text style={styles.priorityText}>{area.priority.toUpperCase()}</Text>
                  </View>
                  <View style={styles.focusAreaInfo}>
                    <Text style={styles.focusAreaTopic}>{area.topic}</Text>
                    <Text style={styles.focusAreaSubject}>{area.subject}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.masteryContainer}>
                <Text style={styles.masteryLabel}>Current Mastery</Text>
                <View style={styles.masteryBar}>
                  <View
                    style={[
                      styles.masteryFill,
                      { width: `${area.mastery}%` },
                      area.mastery < 40
                        ? { backgroundColor: COLORS.error }
                        : area.mastery < 70
                          ? { backgroundColor: COLORS.warning }
                          : { backgroundColor: COLORS.success },
                    ]}
                  />
                </View>
                <Text style={styles.masteryValue}>{area.mastery}%</Text>
              </View>

              <Text style={styles.studyTimeText}>
                Recommended study time: {area.recommendedStudyTime} minutes
              </Text>

              {area.resources.length > 0 && (
                <View style={styles.resourcesContainer}>
                  <Text style={styles.resourcesTitle}>Recommended Resources:</Text>
                  {area.resources.map(resource => (
                    <View key={resource.id} style={styles.resourceItem}>
                      <Icon
                        name={
                          resource.type === 'video'
                            ? 'play-circle'
                            : resource.type === 'article'
                              ? 'file-text'
                              : resource.type === 'quiz'
                                ? 'help-circle'
                                : 'edit'
                        }
                        type="feather"
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={styles.resourceTitle}>{resource.title}</Text>
                      <View style={styles.resourceTypeBadge}>
                        <Text style={styles.resourceTypeText}>{resource.type}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.readinessContainer}>
            <Text style={styles.readinessLabel}>Overall Readiness</Text>
            <Text style={styles.readinessValue}>
              {predictionData?.overallReadiness.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.lastAnalyzed}>
            <Icon name="clock" type="feather" size={14} color={COLORS.textSecondary} />
            <Text style={styles.lastAnalyzedText}>
              Last analyzed: {new Date(predictionData?.lastAnalyzed || '').toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'topics' && styles.activeTab]}
          onPress={() => setSelectedTab('topics')}
        >
          <Text style={[styles.tabText, selectedTab === 'topics' && styles.activeTabText]}>
            Topics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'blueprint' && styles.activeTab]}
          onPress={() => setSelectedTab('blueprint')}
        >
          <Text style={[styles.tabText, selectedTab === 'blueprint' && styles.activeTabText]}>
            Blueprint
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'focus' && styles.activeTab]}
          onPress={() => setSelectedTab('focus')}
        >
          <Text style={[styles.tabText, selectedTab === 'focus' && styles.activeTabText]}>
            Focus Areas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {selectedTab === 'topics' && renderTopicProbabilities()}
        {selectedTab === 'blueprint' && renderQuestionBlueprint()}
        {selectedTab === 'focus' && renderFocusAreas()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  headerCard: {
    margin: SPACING.md,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessContainer: {
    alignItems: 'center',
  },
  readinessLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  readinessValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  lastAnalyzed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  lastAnalyzedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topicRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  topicSubject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  topicStats: {
    alignItems: 'flex-end',
  },
  probabilityText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  confidenceBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  confidenceText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  blueprintItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  blueprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  categoryName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  difficulty_easy: {
    backgroundColor: '#D1FAE5',
  },
  difficulty_medium: {
    backgroundColor: '#FEF3C7',
  },
  difficulty_hard: {
    backgroundColor: '#FEE2E2',
  },
  difficultyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  blueprintDetails: {
    marginLeft: SPACING.lg + 4,
  },
  questionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  topicsList: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  focusAreaItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  focusAreaHeader: {
    marginBottom: SPACING.md,
  },
  focusAreaTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  priority_high: {
    backgroundColor: '#FEE2E2',
  },
  priority_medium: {
    backgroundColor: '#FEF3C7',
  },
  priority_low: {
    backgroundColor: '#DBEAFE',
  },
  priorityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  focusAreaInfo: {
    flex: 1,
  },
  focusAreaTopic: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  focusAreaSubject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  masteryContainer: {
    marginBottom: SPACING.md,
  },
  masteryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  masteryBar: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  masteryFill: {
    height: '100%',
  },
  masteryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  studyTimeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  resourcesContainer: {
    marginTop: SPACING.sm,
  },
  resourcesTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  resourceTitle: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  resourceTypeBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  resourceTypeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
});
