/**
 * Example implementations for Gamification and Goals features
 * This file demonstrates how to integrate the new screens into your app
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { Card } from '@components/shared/Card';
import { useAuthStore } from '@store/authStore';
import { UserRole } from '@types';

/**
 * Example 1: Adding Gamification and Goals cards to Student Dashboard
 */
export const StudentDashboardWithGamification: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Gamification Quick Access Card */}
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Gamification')}
          style={styles.cardContent}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="trophy" size={32} color={COLORS.warning} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Gamification</Text>
            <Text style={styles.cardDescription}>
              View your points, badges, and leaderboard rank
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Goals Quick Access Card */}
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Goals')}
          style={styles.cardContent}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="target" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>My Goals</Text>
            <Text style={styles.cardDescription}>
              Track and manage your personal goals
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>
    </View>
  );
};

/**
 * Example 2: Adding Gamification and Goals to Parent Dashboard (for child view)
 */
export const ParentDashboardWithChildGamification: React.FC<{ childId: number }> = ({
  childId,
}) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Gamification', { studentId: childId })}
          style={styles.cardContent}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="trophy" size={32} color={COLORS.warning} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Child's Achievements</Text>
            <Text style={styles.cardDescription}>
              View their points, badges, and progress
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Goals', { studentId: childId })}
          style={styles.cardContent}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="target" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Child's Goals</Text>
            <Text style={styles.cardDescription}>Monitor their goal progress</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>
    </View>
  );
};

/**
 * Example 3: Gamification Widget for Dashboard
 * Shows quick stats without navigating to full screen
 */
import { useState, useEffect } from 'react';
import { gamificationApi } from '@api/gamification';
import { GamificationStats } from '@types';

export const GamificationWidget: React.FC = () => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await gamificationApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch gamification stats:', error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <Card style={styles.widgetCard}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetTitle}>Your Progress</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Gamification')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={24} color={COLORS.warning} />
          <Text style={styles.statValue}>{stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="shield-star" size={24} color={COLORS.info} />
          <Text style={styles.statValue}>{stats.totalBadges}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="trophy" size={24} color={COLORS.success} />
          <Text style={styles.statValue}>#{stats.rank}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="chart-line" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats.currentLevel}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>
    </Card>
  );
};

/**
 * Example 4: Goals Widget for Dashboard
 * Shows active goals summary
 */
import { goalsApi, Goal } from '@api/goals';

export const GoalsWidget: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await goalsApi.getGoals('active');
        setGoals(response.data.slice(0, 3)); // Show only 3 goals
      } catch (error) {
        console.error('Failed to fetch goals:', error);
      }
    };

    fetchGoals();
  }, []);

  return (
    <Card style={styles.widgetCard}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetTitle}>Active Goals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {goals.length > 0 ? (
        goals.map(goal => (
          <View key={goal.id} style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle} numberOfLines={1}>
                {goal.title}
              </Text>
              <View style={styles.goalProgress}>
                <View style={styles.progressBarSmall}>
                  <View style={[styles.progressFillSmall, { width: `${goal.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{goal.progress}%</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Goals')}
              style={styles.goalAction}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyGoals}>
          <MaterialCommunityIcons name="target" size={32} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No active goals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.createGoalText}>Create your first goal</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

/**
 * Example 5: Navigation Menu Items
 * Add to side drawer or bottom navigation
 */
export const NavigationMenuWithGamification: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const isStudent = user?.role === UserRole.STUDENT;

  return (
    <View>
      {isStudent && (
        <>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Gamification')}
          >
            <MaterialCommunityIcons name="trophy" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Gamification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Goals')}
          >
            <MaterialCommunityIcons name="target" size={24} color={COLORS.primary} />
            <Text style={styles.menuItemText}>My Goals</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

/**
 * Example 6: Notification Handler
 * Handle goal notification taps
 */
import * as Notifications from 'expo-notifications';

export const useGoalNotificationHandler = () => {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      if (data.type === 'goal_digest') {
        navigation.navigate('Goals');
      } else if (data.type === 'goal_reminder' || data.type === 'goal_deadline') {
        navigation.navigate('Goals');
      } else if (data.type === 'milestone_completion' || data.type === 'goal_completion') {
        navigation.navigate('Goals');
      }
    });

    return () => subscription.remove();
  }, []);
};

/**
 * Example 7: Tab Navigator with Gamification
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export const StudentTabsWithGamification = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={StudentDashboard}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="target" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Gamification"
        component={GamificationScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="trophy" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Example 8: Role-based Conditional Rendering
 */
export const RoleBasedGamificationAccess: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleNavigate = () => {
    if (user?.role === UserRole.STUDENT) {
      navigation.navigate('Gamification');
    } else if (user?.role === UserRole.PARENT) {
      // Need to select child first
      navigation.navigate('Children');
    }
  };

  return (
    <TouchableOpacity onPress={handleNavigate} style={styles.button}>
      <Text style={styles.buttonText}>
        {user?.role === UserRole.STUDENT
          ? 'View My Achievements'
          : "View Child's Achievements"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  widgetCard: {
    marginBottom: SPACING.md,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  widgetTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
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
    marginTop: SPACING.xs,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBarSmall: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  goalAction: {
    padding: SPACING.xs,
  },
  emptyGoals: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  createGoalText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});
