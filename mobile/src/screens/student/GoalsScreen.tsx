import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Text, Icon, Button as RNEButton } from '@rneui/themed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { studentApi } from '../../api/student';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { Goal, CreateGoalRequest } from '../../types/student';
import { Card } from '../../components/Card';
import { format } from 'date-fns';
import { useGoalsRealtime } from '../../hooks/useGamificationRealtime';

export const GoalsScreen: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const confettiRef = useRef<any>(null);
  const queryClient = useQueryClient();

  useGoalsRealtime(true);

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      if (isDemoUser()) {
        const response = await demoDataApi.student.getGoals();
        return response.data;
      }
      const response = await studentApi.getGoals();
      return response.data;
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (goal: CreateGoalRequest) => {
      if (isDemoUser()) {
        return demoDataApi.student.createGoal(goal);
      }
      return studentApi.createGoal(goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowCreateModal(false);
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ goalId, progress }: { goalId: number; progress: number }) => {
      if (isDemoUser()) {
        return demoDataApi.student.updateGoalProgress(goalId, progress);
      }
      return studentApi.updateGoalProgress(goalId, progress);
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (data.data.status === 'completed') {
        setShowCelebration(true);
        confettiRef.current?.start();
        setTimeout(() => setShowCelebration(false), 3000);
      }
    },
  });

  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Goals</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
            <Icon name="plus" type="feather" size={20} color={COLORS.background} />
            <Text style={styles.addButtonText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="target" type="feather" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Goals Yet</Text>
            <Text style={styles.emptyText}>
              Set SMART goals to track your progress and earn rewards!
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Goals ({activeGoals.length})</Text>
                {activeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onUpdateProgress={progress =>
                      updateProgressMutation.mutate({ goalId: goal.id, progress })
                    }
                  />
                ))}
              </View>
            )}

            {completedGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed ({completedGoals.length})</Text>
                {completedGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onUpdateProgress={() => {}} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <CreateGoalModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={goal => createGoalMutation.mutate(goal)}
        isLoading={createGoalMutation.isPending}
      />

      {showCelebration && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: -10, y: 0 }}
          fadeOut={true}
          autoStart={false}
        />
      )}
    </View>
  );
};

const GoalCard: React.FC<{
  goal: Goal;
  onUpdateProgress: (progress: number) => void;
}> = ({ goal, onUpdateProgress }) => {
  const progress = (goal.currentValue / goal.targetValue) * 100;
  const daysLeft = Math.ceil(
    (new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return 'book-open';
      case 'attendance':
        return 'calendar';
      case 'behavior':
        return 'smile';
      case 'extracurricular':
        return 'activity';
      case 'personal':
        return 'user';
      default:
        return 'target';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic':
        return COLORS.primary;
      case 'attendance':
        return COLORS.success;
      case 'behavior':
        return COLORS.accent;
      case 'extracurricular':
        return '#9B59B6';
      case 'personal':
        return '#E91E63';
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <Card style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleContainer}>
          <View
            style={[styles.categoryBadge, { backgroundColor: getCategoryColor(goal.category) }]}
          >
            <Icon
              name={getCategoryIcon(goal.category)}
              type="feather"
              size={16}
              color={COLORS.background}
            />
          </View>
          <View style={styles.goalTitleText}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
          </View>
        </View>
        {goal.status === 'completed' && (
          <Icon name="check-circle" type="feather" size={24} color={COLORS.success} />
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <Text style={styles.progressPercentage}>{Math.round(progress)}% Complete</Text>
      </View>

      {goal.milestones && goal.milestones.length > 0 && (
        <View style={styles.milestonesSection}>
          <Text style={styles.milestonesTitle}>Milestones</Text>
          <View style={styles.timeline}>
            {goal.milestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <View style={styles.timelineIndicator}>
                  <View
                    style={[styles.timelineDot, milestone.achieved && styles.timelineDotAchieved]}
                  >
                    {milestone.achieved && (
                      <Icon name="check" type="feather" size={12} color={COLORS.background} />
                    )}
                  </View>
                  {index < goal.milestones.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        milestone.achieved && styles.timelineLineAchieved,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.milestoneContent}>
                  <Text
                    style={[
                      styles.milestoneTitle,
                      milestone.achieved && styles.milestoneTitleAchieved,
                    ]}
                  >
                    {milestone.title}
                  </Text>
                  <Text style={styles.milestoneTarget}>
                    Target: {milestone.targetValue} {goal.unit}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.goalFooter}>
        <View style={styles.goalMeta}>
          <Icon name="calendar" type="feather" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>
            {goal.status === 'completed'
              ? `Completed ${format(new Date(goal.completedAt!), 'MMM dd, yyyy')}`
              : daysLeft > 0
                ? `${daysLeft} days left`
                : 'Overdue'}
          </Text>
        </View>
        {goal.reward && (
          <View style={styles.rewardBadge}>
            <Icon name="gift" type="feather" size={14} color={COLORS.accent} />
            <Text style={styles.rewardText}>+{goal.reward.points} pts</Text>
          </View>
        )}
      </View>

      {goal.status === 'active' && (
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => {
            const newValue = Math.min(goal.currentValue + 1, goal.targetValue);
            onUpdateProgress(newValue);
          }}
        >
          <Icon name="plus-circle" type="feather" size={16} color={COLORS.background} />
          <Text style={styles.updateButtonText}>Update Progress</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const CreateGoalModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onCreate: (goal: CreateGoalRequest) => void;
  isLoading: boolean;
}> = ({ visible, onClose, onCreate, isLoading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CreateGoalRequest['category']>('academic');
  const [type, setType] = useState<CreateGoalRequest['type']>('specific');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const categories = [
    { value: 'academic', label: 'Academic', icon: 'book-open' },
    { value: 'attendance', label: 'Attendance', icon: 'calendar' },
    { value: 'behavior', label: 'Behavior', icon: 'smile' },
    { value: 'extracurricular', label: 'Extracurricular', icon: 'activity' },
    { value: 'personal', label: 'Personal', icon: 'user' },
  ] as const;

  const smartTypes = [
    { value: 'specific', label: 'Specific', description: 'Clear and well-defined' },
    { value: 'measurable', label: 'Measurable', description: 'Can be tracked' },
    { value: 'achievable', label: 'Achievable', description: 'Realistic and attainable' },
    { value: 'relevant', label: 'Relevant', description: 'Matters to you' },
    { value: 'time-bound', label: 'Time-bound', description: 'Has a deadline' },
  ] as const;

  const handleCreate = () => {
    const goal: CreateGoalRequest = {
      title,
      description,
      category,
      type,
      targetValue: parseFloat(targetValue),
      unit,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    onCreate(goal);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('academic');
    setType('specific');
    setTargetValue('');
    setUnit('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setCurrentStep(0);
  };

  const isValid = title && description && targetValue && unit;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" type="feather" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>SMART Type</Text>
              <View style={styles.smartGrid}>
                {smartTypes.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.smartCard, type === t.value && styles.smartCardActive]}
                    onPress={() => setType(t.value)}
                  >
                    <Text style={[styles.smartLabel, type === t.value && styles.smartLabelActive]}>
                      {t.label}
                    </Text>
                    <Text
                      style={[
                        styles.smartDescription,
                        type === t.value && styles.smartDescriptionActive,
                      ]}
                    >
                      {t.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      category === cat.value && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Icon
                      name={cat.icon}
                      type="feather"
                      size={16}
                      color={category === cat.value ? COLORS.background : COLORS.text}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.value && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Goal Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Improve Math Grade to A"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your goal..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Target Value *</Text>
                <TextInput
                  style={styles.input}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  placeholder="100"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Unit *</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="points"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateText}>{format(startDate, 'MMM dd, yyyy')}</Text>
                  <Icon name="calendar" type="feather" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                  <Text style={styles.dateText}>{format(endDate, 'MMM dd, yyyy')}</Text>
                  <Icon name="calendar" type="feather" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, (!isValid || isLoading) && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.createButtonText}>Create Goal</Text>
              )}
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) setStartDate(date);
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  createFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  createFirstButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  goalCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  goalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitleText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  goalDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    fontWeight: '600',
    color: COLORS.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressPercentage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  milestonesSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  milestonesTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  timeline: {
    gap: SPACING.sm,
  },
  milestoneItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotAchieved: {
    backgroundColor: COLORS.success,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  timelineLineAchieved: {
    backgroundColor: COLORS.success,
  },
  milestoneContent: {
    flex: 1,
    paddingBottom: SPACING.sm,
  },
  milestoneTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  milestoneTitleAchieved: {
    color: COLORS.text,
    fontWeight: '600',
  },
  milestoneTarget: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.accent,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  updateButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  formHalf: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  smartGrid: {
    gap: SPACING.sm,
  },
  smartCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  smartCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  smartLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  smartLabelActive: {
    color: COLORS.primary,
  },
  smartDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  smartDescriptionActive: {
    color: COLORS.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  categoryLabelActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: '600',
  },
});
