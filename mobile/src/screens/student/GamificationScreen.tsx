import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { studentApi } from '../../api/student';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { BadgeDetail, LeaderboardEntry } from '../../types/student';
import { Card } from '../../components/Card';
import {
  useGamificationRealtime,
  useLeaderboardRealtime,
} from '../../hooks/useGamificationRealtime';
import { BadgeUnlockAnimation } from '../../components/student/BadgeUnlockAnimation';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'badges' | 'leaderboard';

export const GamificationScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<
    'daily' | 'weekly' | 'monthly' | 'all-time'
  >('weekly');
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeDetail | null>(null);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);

  useGamificationRealtime(true);
  useLeaderboardRealtime(leaderboardPeriod, activeTab === 'leaderboard');

  const { data: gamificationData, isLoading: isGamificationLoading } = useQuery({
    queryKey: ['gamification-details'],
    queryFn: async () => {
      if (isDemoUser()) {
        const response = await demoDataApi.student.getGamificationDetails();
        return response.data;
      }
      const response = await studentApi.getGamificationDetails();
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });

  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardPeriod],
    queryFn: async () => {
      if (isDemoUser()) {
        const response = await demoDataApi.student.getLeaderboard(leaderboardPeriod);
        return response.data;
      }
      const response = await studentApi.getLeaderboard(leaderboardPeriod);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  if (isGamificationLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BadgeUnlockAnimation
        badge={unlockedBadge}
        visible={showBadgeAnimation}
        onClose={() => setShowBadgeAnimation(false)}
      />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'badges' && styles.activeTab]}
          onPress={() => setActiveTab('badges')}
        >
          <Text style={[styles.tabText, activeTab === 'badges' && styles.activeTabText]}>
            Badges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && gamificationData && <OverviewTab data={gamificationData} />}
        {activeTab === 'badges' && gamificationData && (
          <BadgesTab badges={gamificationData.badges} />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            data={leaderboardData || []}
            isLoading={isLeaderboardLoading}
            period={leaderboardPeriod}
            onPeriodChange={setLeaderboardPeriod}
          />
        )}
      </ScrollView>
    </View>
  );
};

const OverviewTab: React.FC<{ data: any }> = ({ data }) => {
  const levelProgress = (data.totalPoints % data.nextLevelPoints) / data.nextLevelPoints;

  return (
    <View style={styles.overviewContainer}>
      <Card style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <View>
            <Text style={styles.pointsLabel}>Total Points</Text>
            <Text style={styles.pointsValue}>{data.totalPoints.toLocaleString()}</Text>
          </View>
          <Icon name="trophy" type="feather" size={48} color={COLORS.accent} />
        </View>
      </Card>

      <Card style={styles.levelCard}>
        <Text style={styles.cardTitle}>Level Progress</Text>
        <View style={styles.levelInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL</Text>
            <Text style={styles.levelNumber}>{data.currentLevel}</Text>
          </View>
          <View style={styles.levelProgressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${levelProgress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {data.pointsToNextLevel} points to Level {data.currentLevel + 1}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.rankCard}>
        <View style={styles.rankContent}>
          <View style={styles.rankLeft}>
            <Icon name="trending-up" type="feather" size={32} color={COLORS.success} />
            <View>
              <Text style={styles.rankLabel}>Your Rank</Text>
              <Text style={styles.rankValue}>#{data.rank}</Text>
            </View>
          </View>
          <Text style={styles.rankTotal}>of {data.totalStudents}</Text>
        </View>
      </Card>

      <StreakCalendar streakData={data.streak} calendar={data.streakCalendar} />

      {data.pointsHistory && data.pointsHistory.length > 0 && (
        <Card style={styles.historyCard}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {data.pointsHistory.slice(0, 5).map((entry: any, index: number) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Icon
                  name={entry.type === 'earned' ? 'arrow-up' : 'arrow-down'}
                  type="feather"
                  size={16}
                  color={entry.type === 'earned' ? COLORS.success : COLORS.error}
                />
                <Text style={styles.historyReason}>{entry.reason}</Text>
              </View>
              <Text
                style={[
                  styles.historyPoints,
                  { color: entry.type === 'earned' ? COLORS.success : COLORS.error },
                ]}
              >
                {entry.type === 'earned' ? '+' : '-'}
                {entry.points}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
};

const StreakCalendar: React.FC<{ streakData: any; calendar: any[] }> = ({
  streakData,
  calendar,
}) => {
  const getHeatmapColor = (count: number) => {
    if (count === 0) return COLORS.border;
    if (count === 1) return '#C7E9C0';
    if (count === 2) return '#74C476';
    if (count === 3) return '#31A354';
    return '#006D2C';
  };

  return (
    <Card style={styles.streakCard}>
      <Text style={styles.cardTitle}>Activity Streak</Text>
      <View style={styles.streakStats}>
        <View style={styles.streakStat}>
          <Icon name="zap" type="feather" size={24} color={COLORS.accent} />
          <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
          <Text style={styles.streakLabel}>Current</Text>
        </View>
        <View style={styles.streakStat}>
          <Icon name="award" type="feather" size={24} color={COLORS.primary} />
          <Text style={styles.streakNumber}>{streakData.longestStreak}</Text>
          <Text style={styles.streakLabel}>Best</Text>
        </View>
      </View>

      <View style={styles.heatmapContainer}>
        <Text style={styles.heatmapTitle}>Last 4 Weeks</Text>
        <View style={styles.heatmap}>
          {calendar.slice(-28).map((day: any, index: number) => (
            <View
              key={index}
              style={[styles.heatmapCell, { backgroundColor: getHeatmapColor(day.count) }]}
            />
          ))}
        </View>
        <View style={styles.heatmapLegend}>
          <Text style={styles.legendText}>Less</Text>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.legendCell, { backgroundColor: getHeatmapColor(i) }]} />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>
    </Card>
  );
};

const BadgesTab: React.FC<{ badges: BadgeDetail[] }> = ({ badges }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9B59B6';
      case 'rare':
        return '#3498DB';
      default:
        return '#95A5A6';
    }
  };

  const categories = [...new Set(badges.map(b => b.category))];

  return (
    <View style={styles.badgesContainer}>
      {categories.map(category => (
        <View key={category} style={styles.badgeCategory}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.badgeGrid}>
            {badges
              .filter(b => b.category === category)
              .map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const BadgeCard: React.FC<{ badge: BadgeDetail }> = ({ badge }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (badge.unlocked) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withSpring(1, { damping: 10 })
      );
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = 1;
      opacity.value = 0.4;
    }
  }, [badge.unlocked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9B59B6';
      case 'rare':
        return '#3498DB';
      default:
        return '#95A5A6';
    }
  };

  return (
    <Animated.View style={[styles.badgeCard, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.badgeButton,
          { borderColor: getRarityColor(badge.rarity) },
          !badge.unlocked && styles.lockedBadge,
        ]}
      >
        <View style={[styles.badgeIcon, { backgroundColor: getRarityColor(badge.rarity) }]}>
          <Icon
            name={badge.unlocked ? 'award' : 'lock'}
            type="feather"
            size={24}
            color={COLORS.background}
          />
        </View>
        <Text style={styles.badgeName} numberOfLines={2}>
          {badge.name}
        </Text>
        {badge.progress !== undefined && badge.total !== undefined && !badge.unlocked && (
          <View style={styles.badgeProgressContainer}>
            <View style={styles.badgeProgressBar}>
              <View
                style={[
                  styles.badgeProgressFill,
                  { width: `${(badge.progress / badge.total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.badgeProgressText}>
              {badge.progress}/{badge.total}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const LeaderboardTab: React.FC<{
  data: LeaderboardEntry[];
  isLoading: boolean;
  period: string;
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | 'all-time') => void;
}> = ({ data, isLoading, period, onPeriodChange }) => {
  return (
    <View style={styles.leaderboardContainer}>
      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly', 'all-time'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.activePeriod]}
            onPress={() => onPeriodChange(p)}
          >
            <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
              {p === 'all-time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <View style={styles.leaderboardList}>
          {data.map((entry, index) => (
            <LeaderboardRow key={entry.studentId} entry={entry} index={index} />
          ))}
        </View>
      )}
    </View>
  );
};

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; index: number }> = ({ entry, index }) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return COLORS.textSecondary;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTrendIcon = () => {
    if (entry.trend === 'up') return { name: 'trending-up', color: COLORS.success };
    if (entry.trend === 'down') return { name: 'trending-down', color: COLORS.error };
    return { name: 'minus', color: COLORS.textSecondary };
  };

  const trend = getTrendIcon();

  return (
    <View style={[styles.leaderboardRow, entry.isCurrentUser && styles.currentUserRow]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
          {getRankIcon(entry.rank)}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {entry.avatar ? (
            <Text>👤</Text>
          ) : (
            <Icon name="user" type="feather" size={20} color={COLORS.textSecondary} />
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {entry.studentName}
            {entry.isCurrentUser && ' (You)'}
          </Text>
          <View style={styles.userStats}>
            <Text style={styles.userStat}>Lvl {entry.level}</Text>
            <Text style={styles.userStat}>• {entry.badges} badges</Text>
          </View>
        </View>
      </View>
      <View style={styles.pointsContainer}>
        <Text style={styles.leaderboardPoints}>{entry.points.toLocaleString()}</Text>
        <Icon name={trend.name} type="feather" size={16} color={trend.color} />
      </View>
    </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  overviewContainer: {
    gap: SPACING.md,
  },
  pointsCard: {
    padding: SPACING.lg,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  pointsValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: SPACING.xs,
  },
  levelCard: {
    padding: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  levelBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: '600',
  },
  levelNumber: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  levelProgressContainer: {
    flex: 1,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  rankCard: {
    padding: SPACING.lg,
  },
  rankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rankLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  rankValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  rankTotal: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  streakCard: {
    padding: SPACING.lg,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  streakStat: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  streakLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  heatmapContainer: {
    marginTop: SPACING.md,
  },
  heatmapTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatmapCell: {
    width: (width - SPACING.md * 2 - SPACING.lg * 2 - 4 * 7) / 7,
    height: (width - SPACING.md * 2 - SPACING.lg * 2 - 4 * 7) / 7,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    gap: 4,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  historyCard: {
    padding: SPACING.lg,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  historyReason: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  historyPoints: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  badgesContainer: {
    gap: SPACING.lg,
  },
  badgeCategory: {
    marginBottom: SPACING.md,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textTransform: 'capitalize',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  badgeCard: {
    width: (width - SPACING.md * 2 - SPACING.md * 2) / 3,
  },
  badgeButton: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  lockedBadge: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  badgeProgressContainer: {
    width: '100%',
    marginTop: SPACING.xs,
  },
  badgeProgressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  badgeProgressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  leaderboardContainer: {
    gap: SPACING.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  activePeriod: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  activePeriodText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  loader: {
    marginTop: SPACING.xl,
  },
  leaderboardList: {
    gap: SPACING.sm,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    gap: SPACING.md,
  },
  currentUserRow: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  userStats: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: 2,
  },
  userStat: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  leaderboardPoints: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
