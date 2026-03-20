import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { Goal } from '../../types/student';

interface ActiveGoalsWidgetProps {
  goals?: Goal[];
  isLoading?: boolean;
}

export const ActiveGoalsWidget: React.FC<ActiveGoalsWidgetProps> = ({ goals, isLoading }) => {
  const navigation = useNavigation();

  const activeGoals = goals?.filter(g => g.status === 'active' || g.status === 'in_progress') || [];

  if (isLoading) {
    return (
      <Card>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar} />
          <View style={styles.loadingBar} />
        </View>
      </Card>
    );
  }

  if (activeGoals.length === 0) {
    return (
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>Active Goals</Text>
        </View>
        <TouchableOpacity
          style={styles.emptyState}
          onPress={() => navigation.navigate('Goals' as never)}
        >
          <Icon name="target" type="feather" size={32} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Set your first goal</Text>
          <Icon name="plus-circle" type="feather" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Active Goals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Goals' as never)}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goalsContainer}>
        {activeGoals.slice(0, 3).map(goal => (
          <GoalMiniCard key={goal.id} goal={goal} />
        ))}
      </View>

      {activeGoals.length > 3 && (
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => navigation.navigate('Goals' as never)}
        >
          <Text style={styles.moreText}>+{activeGoals.length - 3} more goals</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const GoalMiniCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const progress = goal.progress !== undefined 
    ? goal.progress 
    : (goal.currentValue / goal.targetValue) * 100;

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
    <View style={styles.goalMiniCard}>
      <View style={styles.goalHeader}>
        <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(goal.category) }]} />
        <Text style={styles.goalTitle} numberOfLines={1}>
          {goal.title}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: getCategoryColor(goal.category),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  goalsContainer: {
    gap: SPACING.sm,
  },
  goalMiniCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalTitle: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 35,
    textAlign: 'right',
  },
  moreButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  moreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    gap: SPACING.md,
  },
  loadingBar: {
    height: 60,
    backgroundColor: COLORS.disabled,
    borderRadius: 8,
  },
});
