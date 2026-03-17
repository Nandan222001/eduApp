import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Text, Card, Button } from '@rneui/themed';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { StudentTabScreenProps } from '@types';
import { goalsApi, Goal, GoalCreateRequest, Milestone } from '@api/goals';
import { format, differenceInDays } from 'date-fns';

type Props = StudentTabScreenProps<'Home'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export const GoalsScreen: React.FC<Props> = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [achievedGoal, setAchievedGoal] = useState<Goal | null>(null);
  const confettiRef = useRef<any>(null);

  const [formData, setFormData] = useState<GoalCreateRequest>({
    title: '',
    description: '',
    category: 'academic',
    priority: 'medium',
    targetDate: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    milestones: [],
  });

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await goalsApi.getGoals(filterStatus);
      setGoals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  }, [fetchGoals]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async () => {
    try {
      await goalsApi.createGoal(formData);
      setCreateModalVisible(false);
      resetForm();
      await fetchGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleUpdateGoal = async (goalId: number, progress: number) => {
    try {
      const response = await goalsApi.updateGoal(goalId, { progress });
      if (response.data.status === 'completed') {
        setAchievedGoal(response.data);
        setAchievementModalVisible(true);
        confettiRef.current?.start();
      }
      await fetchGoals();
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleCompleteMilestone = async (goalId: number, milestoneId: number) => {
    try {
      await goalsApi.completeMilestone(goalId, milestoneId);
      if (selectedGoal) {
        const updatedGoal = await goalsApi.getGoalById(goalId);
        setSelectedGoal(updatedGoal.data);
      }
      await fetchGoals();
    } catch (error) {
      console.error('Failed to complete milestone:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'academic',
      priority: 'medium',
      targetDate: '',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timeBound: '',
      milestones: [],
    });
  };

  const openGoalDetail = (goal: Goal) => {
    setSelectedGoal(goal);
    setDetailModalVisible(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic':
        return COLORS.primary;
      case 'skill':
        return COLORS.success;
      case 'personal':
        return COLORS.warning;
      case 'career':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
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

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {['active', 'completed', 'paused', 'all'].map(status => (
        <TouchableOpacity
          key={status}
          style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
          onPress={() => setFilterStatus(status)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterStatus === status && styles.filterButtonTextActive,
            ]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGoalCard = (goal: Goal) => {
    const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    const totalMilestones = goal.milestones.length;

    return (
      <TouchableOpacity key={goal.id} onPress={() => openGoalDetail(goal)}>
        <Card containerStyle={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={styles.goalBadges}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(goal.category) },
                  ]}
                >
                  <Text style={styles.badgeText}>{goal.category.toUpperCase()}</Text>
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(goal.priority) },
                  ]}
                >
                  <Text style={styles.badgeText}>{goal.priority.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.goalDescription} numberOfLines={2}>
            {goal.description}
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{goal.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
            </View>
          </View>

          <View style={styles.goalFooter}>
            <View style={styles.milestonesInfo}>
              <Text style={styles.milestonesText}>
                🎯 {completedMilestones}/{totalMilestones} Milestones
              </Text>
            </View>
            <View style={styles.daysRemainingContainer}>
              <Text
                style={[
                  styles.daysRemainingText,
                  {
                    color:
                      daysRemaining < 7
                        ? COLORS.error
                        : daysRemaining < 30
                          ? COLORS.warning
                          : COLORS.success,
                  },
                ]}
              >
                {daysRemaining > 0
                  ? `${daysRemaining} days left`
                  : daysRemaining === 0
                    ? 'Due today'
                    : 'Overdue'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={createModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setCreateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Goal Title"
              value={formData.title}
              onChangeText={text => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={text => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.pickerRow}>
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerButtons}>
                  {['academic', 'skill', 'personal', 'career'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.pickerButton,
                        formData.category === cat && styles.pickerButtonActive,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          category: cat as any,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.pickerButtonText,
                          formData.category === cat && styles.pickerButtonTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.pickerButtons}>
                  {['high', 'medium', 'low'].map(pri => (
                    <TouchableOpacity
                      key={pri}
                      style={[
                        styles.pickerButton,
                        formData.priority === pri && styles.pickerButtonActive,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          priority: pri as any,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.pickerButtonText,
                          formData.priority === pri && styles.pickerButtonTextActive,
                        ]}
                      >
                        {pri}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Target Date (YYYY-MM-DD)"
              value={formData.targetDate}
              onChangeText={text => setFormData({ ...formData, targetDate: text })}
            />

            <Text style={styles.sectionTitle}>SMART Goals Framework</Text>

            <Text style={styles.label}>Specific</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What exactly do you want to achieve?"
              value={formData.specific}
              onChangeText={text => setFormData({ ...formData, specific: text })}
              multiline
            />

            <Text style={styles.label}>Measurable</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="How will you measure success?"
              value={formData.measurable}
              onChangeText={text => setFormData({ ...formData, measurable: text })}
              multiline
            />

            <Text style={styles.label}>Achievable</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Is this goal realistic?"
              value={formData.achievable}
              onChangeText={text => setFormData({ ...formData, achievable: text })}
              multiline
            />

            <Text style={styles.label}>Relevant</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Why is this goal important?"
              value={formData.relevant}
              onChangeText={text => setFormData({ ...formData, relevant: text })}
              multiline
            />

            <Text style={styles.label}>Time-Bound</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is your timeline?"
              value={formData.timeBound}
              onChangeText={text => setFormData({ ...formData, timeBound: text })}
              multiline
            />
          </ScrollView>

          <Button
            title="Create Goal"
            onPress={handleCreateGoal}
            buttonStyle={styles.createButton}
          />
        </View>
      </View>
    </Modal>
  );

  const renderDetailModal = () => {
    if (!selectedGoal) return null;

    const completedMilestones = selectedGoal.milestones.filter(m => m.completed).length;

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Goal Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.detailTitle}>{selectedGoal.title}</Text>
              <View style={styles.detailBadges}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(selectedGoal.category) },
                  ]}
                >
                  <Text style={styles.badgeText}>{selectedGoal.category.toUpperCase()}</Text>
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(selectedGoal.priority) },
                  ]}
                >
                  <Text style={styles.badgeText}>{selectedGoal.priority.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.detailDescription}>{selectedGoal.description}</Text>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Overall Progress</Text>
                  <Text style={styles.progressValue}>{selectedGoal.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${selectedGoal.progress}%` }]} />
                </View>
              </View>

              <View style={styles.smartSection}>
                <Text style={styles.sectionTitle}>SMART Framework</Text>
                <View style={styles.smartItem}>
                  <Text style={styles.smartLabel}>Specific:</Text>
                  <Text style={styles.smartValue}>{selectedGoal.specific}</Text>
                </View>
                <View style={styles.smartItem}>
                  <Text style={styles.smartLabel}>Measurable:</Text>
                  <Text style={styles.smartValue}>{selectedGoal.measurable}</Text>
                </View>
                <View style={styles.smartItem}>
                  <Text style={styles.smartLabel}>Achievable:</Text>
                  <Text style={styles.smartValue}>{selectedGoal.achievable}</Text>
                </View>
                <View style={styles.smartItem}>
                  <Text style={styles.smartLabel}>Relevant:</Text>
                  <Text style={styles.smartValue}>{selectedGoal.relevant}</Text>
                </View>
                <View style={styles.smartItem}>
                  <Text style={styles.smartLabel}>Time-Bound:</Text>
                  <Text style={styles.smartValue}>{selectedGoal.timeBound}</Text>
                </View>
              </View>

              <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>
                  Milestone Timeline ({completedMilestones}/{selectedGoal.milestones.length})
                </Text>
                {selectedGoal.milestones
                  .sort((a, b) => a.order - b.order)
                  .map((milestone, index) => (
                    <View key={milestone.id} style={styles.timelineItem}>
                      <View style={styles.timelineMarker}>
                        <View
                          style={[
                            styles.timelineDot,
                            milestone.completed && styles.timelineDotCompleted,
                          ]}
                        />
                        {index < selectedGoal.milestones.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.milestoneCard,
                          milestone.completed && styles.milestoneCardCompleted,
                        ]}
                        onPress={() =>
                          !milestone.completed &&
                          handleCompleteMilestone(selectedGoal.id, milestone.id)
                        }
                      >
                        <View style={styles.milestoneHeader}>
                          <Text
                            style={[
                              styles.milestoneTitle,
                              milestone.completed && styles.milestoneTitleCompleted,
                            ]}
                          >
                            {milestone.title}
                          </Text>
                          {milestone.completed && <Text style={styles.completedCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                        <Text style={styles.milestoneDate}>
                          📅 {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
                        </Text>
                        {milestone.completed && milestone.completedAt && (
                          <Text style={styles.completedDate}>
                            Completed: {format(new Date(milestone.completedAt), 'MMM dd, yyyy')}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>

              <View style={styles.datesSection}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Start Date:</Text>
                  <Text style={styles.dateValue}>
                    {format(new Date(selectedGoal.startDate), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Target Date:</Text>
                  <Text style={styles.dateValue}>
                    {format(new Date(selectedGoal.targetDate), 'MMM dd, yyyy')}
                  </Text>
                </View>
                {selectedGoal.completedDate && (
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Completed:</Text>
                    <Text style={styles.dateValue}>
                      {format(new Date(selectedGoal.completedDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <Button
              title="Close"
              onPress={() => setDetailModalVisible(false)}
              buttonStyle={styles.closeModalButton}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderAchievementModal = () => {
    if (!achievedGoal) return null;

    return (
      <Modal
        visible={achievementModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAchievementModalVisible(false)}
      >
        <View style={styles.achievementOverlay}>
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
            autoStart={false}
            fadeOut
          />
          <View style={styles.achievementCard}>
            <Text style={styles.achievementEmoji}>🎉</Text>
            <Text style={styles.achievementTitle}>Goal Achieved!</Text>
            <Text style={styles.achievementGoalTitle}>{achievedGoal.title}</Text>
            <Text style={styles.achievementMessage}>Congratulations on completing your goal!</Text>
            <Button
              title="Awesome!"
              onPress={() => {
                setAchievementModalVisible(false);
                setAchievedGoal(null);
              }}
              buttonStyle={styles.achievementButton}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="+ Create Goal"
          onPress={() => setCreateModalVisible(true)}
          buttonStyle={styles.createGoalButton}
        />
      </View>

      {renderFilterButtons()}

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
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        ) : goals.length > 0 ? (
          goals.map(goal => renderGoalCard(goal))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>Create your first goal to get started</Text>
          </View>
        )}
      </ScrollView>

      {renderCreateModal()}
      {renderDetailModal()}
      {renderAchievementModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  createGoalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: COLORS.background,
    fontWeight: '600',
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
  goalCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  goalHeader: {
    marginBottom: SPACING.sm,
  },
  goalTitleContainer: {
    gap: SPACING.sm,
  },
  goalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  goalBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  goalDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestonesInfo: {
    flexDirection: 'row',
  },
  milestonesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  daysRemainingContainer: {},
  daysRemainingText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerRow: {
    marginBottom: SPACING.md,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  pickerButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  pickerButtonTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  detailTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  smartSection: {
    marginTop: SPACING.md,
  },
  smartItem: {
    marginBottom: SPACING.md,
  },
  smartLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  smartValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  timelineSection: {
    marginTop: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  timelineMarker: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  timelineDotCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  milestoneCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  milestoneCardCompleted: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.success,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  milestoneTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  completedCheckmark: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.success,
  },
  milestoneDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  milestoneDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  completedDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
  },
  datesSection: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  dateValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeModalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: SCREEN_WIDTH - SPACING.xxl,
  },
  achievementEmoji: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  achievementTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  achievementGoalTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  achievementMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  achievementButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xxl,
  },
});
