import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Card, Button, CheckBox } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { StudentTabScreenProps } from '@types';
import {
  predictionsApi,
  AIPredictionDashboard,
  BoardExamPrediction,
  TopicProbability,
  QuestionBlueprint,
  FocusArea,
  DailyTask,
} from '@api/predictions';
import { format } from 'date-fns';

type Props = StudentTabScreenProps<'Home'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export const AIPredictionsScreen: React.FC<Props> = () => {
  const [dashboard, setDashboard] = useState<AIPredictionDashboard | null>(null);
  const [boardExam, setBoardExam] = useState<BoardExamPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, boardExamRes] = await Promise.all([
        predictionsApi.getAIPredictionDashboard(),
        predictionsApi.getBoardExamPredictions(),
      ]);

      setDashboard(dashboardRes.data);
      setBoardExam(boardExamRes.data);
    } catch (error) {
      console.error('Failed to fetch AI predictions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleTaskComplete = async (taskId: number) => {
    try {
      await predictionsApi.markTaskComplete(taskId);
      await fetchData();
    } catch (error) {
      console.error('Failed to mark task complete:', error);
    }
  };

  const handleRegenerateStudyPlan = async () => {
    try {
      await predictionsApi.regenerateStudyPlan();
      await fetchData();
    } catch (error) {
      console.error('Failed to regenerate study plan:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      case 'low':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      case 'easy':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderPredictionOverview = () => {
    if (!dashboard) return null;

    return (
      <Card containerStyle={styles.overviewCard}>
        <Text style={styles.cardTitle}>AI Performance Prediction</Text>
        <View style={styles.predictionContent}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{dashboard.predictedScore}%</Text>
            <Text style={styles.scoreLabel}>Predicted Score</Text>
          </View>
          <View style={styles.predictionStats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Confidence:</Text>
              <Text style={styles.statValue}>{dashboard.confidence}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Trend:</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      dashboard.trend === 'improving'
                        ? COLORS.success
                        : dashboard.trend === 'declining'
                          ? COLORS.error
                          : COLORS.textSecondary,
                  },
                ]}
              >
                {dashboard.trend === 'improving'
                  ? '📈 Improving'
                  : dashboard.trend === 'declining'
                    ? '📉 Declining'
                    : '➡️ Stable'}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Last Updated:</Text>
              <Text style={styles.statValue}>
                {format(new Date(dashboard.lastUpdated), 'MMM dd, yyyy')}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderTopicProbabilities = () => {
    if (!dashboard || !dashboard.topicProbabilities.length) return null;

    const sortedTopics = [...dashboard.topicProbabilities].sort(
      (a, b) => b.probability - a.probability
    );

    return (
      <Card containerStyle={styles.card}>
        <Text style={styles.cardTitle}>Topic Probability Rankings</Text>
        <Text style={styles.cardSubtitle}>Topics most likely to appear in upcoming exams</Text>
        {sortedTopics.map(topic => (
          <View key={topic.id} style={styles.topicItem}>
            <View style={styles.topicHeader}>
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>{topic.topic}</Text>
                <Text style={styles.topicSubject}>{topic.subject}</Text>
              </View>
              {renderStars(topic.starRating)}
            </View>
            <View style={styles.topicStats}>
              <View style={styles.topicStat}>
                <Text style={styles.topicStatLabel}>Probability</Text>
                <Text style={styles.topicStatValue}>{topic.probability}%</Text>
              </View>
              <View style={styles.topicStat}>
                <Text style={styles.topicStatLabel}>Expected Qs</Text>
                <Text style={styles.topicStatValue}>{topic.expectedQuestions}</Text>
              </View>
              <View style={styles.topicStat}>
                <Text style={styles.topicStatLabel}>Last Year</Text>
                <Text style={styles.topicStatValue}>{topic.lastYearFrequency}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${topic.probability}%` }]} />
            </View>
          </View>
        ))}
      </Card>
    );
  };

  const renderQuestionBlueprint = () => {
    if (!boardExam || !boardExam.questionBlueprint.length) return null;

    const groupedBySection: Record<string, QuestionBlueprint[]> = {};
    boardExam.questionBlueprint.forEach(blueprint => {
      if (!groupedBySection[blueprint.section]) {
        groupedBySection[blueprint.section] = [];
      }
      groupedBySection[blueprint.section].push(blueprint);
    });

    return (
      <Card containerStyle={styles.card}>
        <Text style={styles.cardTitle}>Predicted Question Blueprint</Text>
        <Text style={styles.cardSubtitle}>
          {boardExam.examName} - {format(new Date(boardExam.examDate), 'MMM dd, yyyy')}
        </Text>
        {Object.entries(groupedBySection).map(([section, blueprints]) => (
          <View key={section} style={styles.blueprintSection}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section)}>
              <Text style={styles.sectionTitle}>{section}</Text>
              <Text style={styles.sectionIcon}>{expandedSections[section] ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            {expandedSections[section] && (
              <View style={styles.sectionContent}>
                {blueprints.map(blueprint => (
                  <View key={blueprint.id} style={styles.blueprintItem}>
                    <View style={styles.blueprintHeader}>
                      <Text style={styles.blueprintTopic}>{blueprint.topic}</Text>
                      <View
                        style={[
                          styles.difficultyBadge,
                          {
                            backgroundColor: getDifficultyColor(blueprint.difficulty),
                          },
                        ]}
                      >
                        <Text style={styles.difficultyText}>
                          {blueprint.difficulty.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.blueprintDetails}>
                      <Text style={styles.blueprintDetail}>Type: {blueprint.questionType}</Text>
                      <Text style={styles.blueprintDetail}>Marks: {blueprint.marks}</Text>
                      <Text style={styles.blueprintDetail}>Count: {blueprint.expectedCount}</Text>
                    </View>
                    {blueprint.subtopics && blueprint.subtopics.length > 0 && (
                      <View style={styles.subtopicsContainer}>
                        <Text style={styles.subtopicsLabel}>Subtopics:</Text>
                        {blueprint.subtopics.map((subtopic, idx) => (
                          <Text key={idx} style={styles.subtopic}>
                            • {subtopic}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </Card>
    );
  };

  const renderFocusAreas = () => {
    if (!dashboard || !dashboard.focusAreas.length) return null;

    const sortedAreas = [...dashboard.focusAreas].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return (
      <Card containerStyle={styles.card}>
        <Text style={styles.cardTitle}>Focus Area Recommendations</Text>
        <Text style={styles.cardSubtitle}>Prioritized areas to improve your performance</Text>
        {sortedAreas.map(area => (
          <View key={area.id} style={styles.focusAreaItem}>
            <View style={styles.focusAreaHeader}>
              <View style={styles.focusAreaInfo}>
                <Text style={styles.focusAreaTopic}>{area.topic}</Text>
                <Text style={styles.focusAreaSubject}>{area.subject}</Text>
              </View>
              <View
                style={[styles.priorityBadge, { backgroundColor: getPriorityColor(area.priority) }]}
              >
                <Text style={styles.priorityText}>{area.priority.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.masteryContainer}>
              <View style={styles.masteryRow}>
                <Text style={styles.masteryLabel}>Current Mastery:</Text>
                <Text style={styles.masteryValue}>{area.currentMastery}%</Text>
              </View>
              <View style={styles.masteryBar}>
                <View style={[styles.masteryFill, { width: `${area.currentMastery}%` }]} />
                <View style={[styles.masteryTarget, { left: `${area.targetMastery}%` }]} />
              </View>
              <View style={styles.masteryRow}>
                <Text style={styles.masteryLabel}>Target Mastery:</Text>
                <Text style={styles.masteryValue}>{area.targetMastery}%</Text>
              </View>
            </View>
            <View style={styles.studyHoursContainer}>
              <Text style={styles.studyHoursLabel}>⏱️ Estimated Study Time:</Text>
              <Text style={styles.studyHoursValue}>{area.estimatedStudyHours} hours</Text>
            </View>
            {area.resources.length > 0 && (
              <View style={styles.resourcesContainer}>
                <Text style={styles.resourcesLabel}>Resources:</Text>
                {area.resources.map((resource, idx) => (
                  <Text key={idx} style={styles.resource}>
                    📚 {resource}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </Card>
    );
  };

  const renderStudyPlan = () => {
    if (!dashboard || !dashboard.studyPlan) return null;

    const { studyPlan } = dashboard;
    const progressPercentage = (studyPlan.completedHours / studyPlan.totalHours) * 100;

    const todayTasks = studyPlan.dailyTasks.filter(
      task => format(new Date(task.scheduledFor), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    );

    const upcomingTasks = studyPlan.dailyTasks.filter(
      task =>
        new Date(task.scheduledFor) > new Date() &&
        format(new Date(task.scheduledFor), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
    );

    return (
      <Card containerStyle={styles.card}>
        <View style={styles.studyPlanHeader}>
          <Text style={styles.cardTitle}>Personalized Study Plan</Text>
          <Button
            title="Regenerate"
            type="outline"
            buttonStyle={styles.regenerateButton}
            titleStyle={styles.regenerateButtonText}
            onPress={handleRegenerateStudyPlan}
          />
        </View>
        <View style={styles.studyPlanProgress}>
          <View style={styles.studyPlanStats}>
            <Text style={styles.studyPlanStat}>
              {studyPlan.completedHours}h / {studyPlan.totalHours}h
            </Text>
            <Text style={styles.studyPlanStatLabel}>{progressPercentage.toFixed(0)}% Complete</Text>
          </View>
          <View style={styles.studyPlanProgressBar}>
            <View style={[styles.studyPlanProgressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {todayTasks.length > 0 && (
          <>
            <Text style={styles.tasksTitle}>Today's Tasks</Text>
            {todayTasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <CheckBox
                  checked={task.completed}
                  onPress={() => handleTaskComplete(task.id)}
                  containerStyle={styles.checkbox}
                  checkedColor={COLORS.success}
                />
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskSubject}>{task.subject}</Text>
                    <Text style={styles.taskDuration}>⏱️ {task.duration} min</Text>
                    <View
                      style={[
                        styles.taskTypeBadge,
                        {
                          backgroundColor:
                            task.taskType === 'mock_test'
                              ? COLORS.error
                              : task.taskType === 'practice'
                                ? COLORS.info
                                : task.taskType === 'revision'
                                  ? COLORS.warning
                                  : COLORS.success,
                        },
                      ]}
                    >
                      <Text style={styles.taskTypeText}>
                        {task.taskType.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {upcomingTasks.length > 0 && (
          <>
            <Text style={styles.tasksTitle}>Upcoming Tasks</Text>
            {upcomingTasks.slice(0, 5).map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskSubject}>{task.subject}</Text>
                    <Text style={styles.taskDuration}>⏱️ {task.duration} min</Text>
                    <Text style={styles.taskSchedule}>
                      📅 {format(new Date(task.scheduledFor), 'MMM dd')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {studyPlan.weeklyGoals.length > 0 && (
          <>
            <Text style={styles.tasksTitle}>Weekly Goals</Text>
            {studyPlan.weeklyGoals.map((goal, idx) => (
              <View key={idx} style={styles.weeklyGoalItem}>
                <Text style={styles.weeklyGoalText}>🎯 {goal}</Text>
              </View>
            ))}
          </>
        )}
      </Card>
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
            <Text style={styles.loadingText}>Loading AI predictions...</Text>
          </View>
        ) : (
          <>
            {renderPredictionOverview()}
            {renderTopicProbabilities()}
            {renderQuestionBlueprint()}
            {renderFocusAreas()}
            {renderStudyPlan()}
          </>
        )}
      </ScrollView>
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
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
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
  predictionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    marginTop: SPACING.xs,
  },
  predictionStats: {
    flex: 1,
    gap: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  topicItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  topicSubject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: FONT_SIZES.md,
    marginLeft: 2,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  topicStat: {
    alignItems: 'center',
  },
  topicStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  topicStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  blueprintSection: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionIcon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  sectionContent: {
    marginTop: SPACING.sm,
  },
  blueprintItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blueprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  blueprintTopic: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  difficultyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  blueprintDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  blueprintDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  subtopicsContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subtopicsLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtopic: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  focusAreaItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  focusAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  focusAreaInfo: {
    flex: 1,
  },
  focusAreaTopic: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  focusAreaSubject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  priorityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  masteryContainer: {
    marginBottom: SPACING.md,
  },
  masteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  masteryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  masteryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  masteryBar: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: SPACING.xs,
  },
  masteryFill: {
    height: '100%',
    backgroundColor: COLORS.info,
  },
  masteryTarget: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: COLORS.success,
  },
  studyHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  studyHoursLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  studyHoursValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  resourcesContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resourcesLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  resource: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  studyPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  regenerateButton: {
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  regenerateButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  studyPlanProgress: {
    marginBottom: SPACING.md,
  },
  studyPlanStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  studyPlanStat: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  studyPlanStatLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  studyPlanProgressBar: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  studyPlanProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  tasksTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkbox: {
    margin: 0,
    padding: 0,
    marginRight: SPACING.sm,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  taskDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  taskSubject: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  taskDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  taskSchedule: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  taskTypeBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  taskTypeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  weeklyGoalItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weeklyGoalText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
});
