import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { Card } from '@components/shared/Card';
import { Button } from '@components/shared/Button';
import { gamificationApi } from '@api/gamification';
import { useAuthStore } from '@store/authStore';
import type {
  UserRole,
  Points,
  Badge,
  Leaderboard,
  Achievement,
  GamificationStats,
  LeaderboardEntry,
  Streak,
} from '@types';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  studentId?: number;
}

export const GamificationScreen: React.FC<Props> = ({ studentId }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [points, setPoints] = useState<Points | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('weekly');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [achievementNotificationVisible, setAchievementNotificationVisible] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [streakCalendarData, setStreakCalendarData] = useState<any[]>([]);

  const isParentView = user?.role === UserRole.PARENT;
  const effectiveStudentId = isParentView ? studentId : undefined;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, pointsRes, badgesRes, leaderboardRes, achievementsRes] = await Promise.all([
        gamificationApi.getStats(effectiveStudentId),
        gamificationApi.getPoints(effectiveStudentId),
        gamificationApi.getBadges(effectiveStudentId),
        gamificationApi.getLeaderboard(selectedTimeframe),
        gamificationApi.getAchievements(effectiveStudentId),
      ]);

      setStats(statsRes);
      setPoints(pointsRes);
      setBadges(badgesRes);
      setLeaderboard(leaderboardRes);
      setAchievements(achievementsRes);

      const newAchievement = achievementsRes.find((a: Achievement) => a.isNew);
      if (newAchievement) {
        setCurrentAchievement(newAchievement);
        setAchievementNotificationVisible(true);
      }

      generateStreakCalendar(statsRes.streaks);
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveStudentId, selectedTimeframe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateStreakCalendar = (streaks: Streak[]) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const loginStreak = streaks.find(s => s.streakType === 'daily_login');
    const calendarData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isActive = loginStreak && new Date(loginStreak.lastActivityDate) >= day;
      return {
        date: day,
        isActive: isActive || false,
        isToday: isToday(day),
      };
    });

    setStreakCalendarData(calendarData);
  };

  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    setBadgeModalVisible(true);
  };

  const handleClaimReward = async (rewardId: number) => {
    try {
      await gamificationApi.claimReward(rewardId);
      await fetchData();
      setRewardModalVisible(false);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const renderPointsCard = () => {
    if (!points) return null;

    const progressPercentage = (points.pointsInCurrentLevel / points.pointsRequiredForNextLevel) * 100;

    return (
      <Card style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <View>
            <Text style={styles.pointsLabel}>Total Points</Text>
            <Text style={styles.pointsValue}>{points.totalPoints.toLocaleString()}</Text>
          </View>
          <View style={styles.levelBadge}>
            <MaterialCommunityIcons name="trophy" size={24} color={COLORS.warning} />
            <Text style={styles.levelText}>Level {points.currentLevel}</Text>
          </View>
        </View>

        <View style={styles.levelSection}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelName}>{points.levelName}</Text>
            <Text style={styles.levelProgress}>
              {points.pointsInCurrentLevel} / {points.pointsRequiredForNextLevel} points
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.nextLevelText}>
            {points.pointsToNextLevel} points to Level {points.currentLevel + 1}
          </Text>
        </View>

        {points.recentActivities && points.recentActivities.length > 0 && (
          <View style={styles.recentActivities}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {points.recentActivities.slice(0, 3).map(activity => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityTime}>
                    {format(parseISO(activity.timestamp), 'MMM dd, h:mm a')}
                  </Text>
                </View>
                <View style={styles.activityPoints}>
                  <Text style={styles.activityPointsText}>+{activity.pointsEarned}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  const renderBadgesGrid = () => {
    const earnedBadges = badges.filter(b => b.isEarned);
    const unearnedBadges = badges.filter(b => !b.isEarned);

    return (
      <Card style={styles.badgesCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Badges</Text>
          <Text style={styles.badgeCount}>
            {earnedBadges.length} / {badges.length}
          </Text>
        </View>

        <View style={styles.badgesGrid}>
          {earnedBadges.map((badge, index) => (
            <Animated.View
              key={badge.id}
              entering={FadeInUp.delay(index * 100).springify()}
            >
              <BadgeItem badge={badge} onPress={() => handleBadgePress(badge)} />
            </Animated.View>
          ))}
          {unearnedBadges.map((badge, index) => (
            <Animated.View
              key={badge.id}
              entering={FadeInUp.delay((earnedBadges.length + index) * 100).springify()}
            >
              <BadgeItem badge={badge} onPress={() => handleBadgePress(badge)} />
            </Animated.View>
          ))}
        </View>
      </Card>
    );
  };

  const renderLeaderboard = () => {
    if (!leaderboard) return null;

    return (
      <Card style={styles.leaderboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Leaderboard</Text>
          <View style={styles.timeframeSelector}>
            {(['daily', 'weekly', 'monthly', 'all_time'] as const).map(tf => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === tf && styles.timeframeButtonActive,
                ]}
                onPress={() => setSelectedTimeframe(tf)}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    selectedTimeframe === tf && styles.timeframeButtonTextActive,
                  ]}
                >
                  {tf === 'all_time' ? 'All' : tf.charAt(0).toUpperCase() + tf.slice(1, 1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.myRankCard}>
          <View style={styles.rankInfo}>
            <Text style={styles.rankLabel}>Your Rank</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>#{leaderboard.myRank}</Text>
            </View>
          </View>
          <View style={styles.rankStats}>
            <Text style={styles.rankPoints}>{leaderboard.myPoints.toLocaleString()} pts</Text>
            <Text style={styles.rankTotal}>of {leaderboard.totalParticipants} students</Text>
          </View>
        </View>

        <View style={styles.leaderboardList}>
          {leaderboard.topRankers.map((entry, index) => (
            <LeaderboardRow key={entry.studentId} entry={entry} index={index} />
          ))}
        </View>
      </Card>
    );
  };

  const renderStreakCalendar = () => {
    if (!stats || !stats.streaks.length) return null;

    const loginStreak = stats.streaks.find(s => s.streakType === 'daily_login');
    if (!loginStreak) return null;

    return (
      <Card style={styles.streakCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Streak</Text>
          <View style={styles.streakBadge}>
            <MaterialCommunityIcons name="fire" size={20} color={COLORS.warning} />
            <Text style={styles.streakCount}>{loginStreak.currentStreak} days</Text>
          </View>
        </View>

        <View style={styles.streakStats}>
          <View style={styles.streakStat}>
            <Text style={styles.streakStatLabel}>Current</Text>
            <Text style={styles.streakStatValue}>{loginStreak.currentStreak}</Text>
          </View>
          <View style={styles.streakStat}>
            <Text style={styles.streakStatLabel}>Longest</Text>
            <Text style={styles.streakStatValue}>{loginStreak.longestStreak}</Text>
          </View>
          {loginStreak.nextMilestone && (
            <View style={styles.streakStat}>
              <Text style={styles.streakStatLabel}>Next Goal</Text>
              <Text style={styles.streakStatValue}>{loginStreak.nextMilestone}</Text>
            </View>
          )}
        </View>

        <View style={styles.calendarHeatmap}>
          <View style={styles.weekdayLabels}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={styles.weekdayLabel}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {streakCalendarData.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.calendarDay,
                  day.isActive && styles.calendarDayActive,
                  day.isToday && styles.calendarDayToday,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    day.isActive && styles.calendarDayTextActive,
                  ]}
                >
                  {format(day.date, 'd')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    );
  };

  const renderRewardsSection = () => {
    return (
      <Card style={styles.rewardsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Rewards</Text>
          <TouchableOpacity onPress={() => setRewardModalVisible(true)}>
            <MaterialCommunityIcons name="gift" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.rewardsDescription}>
          Redeem your points for exciting rewards!
        </Text>
        <Button
          title="View Rewards"
          variant="primary"
          onPress={() => setRewardModalVisible(true)}
        />
      </Card>
    );
  };

  const renderBadgeModal = () => {
    if (!selectedBadge) return null;

    return (
      <Modal
        visible={badgeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBadgeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.badgeModalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBadgeModalVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.badgeIcon, { borderColor: getBadgeColor(selectedBadge.rarity) }]}>
              {selectedBadge.iconUrl ? (
                <Text style={styles.badgeEmoji}>{selectedBadge.icon}</Text>
              ) : (
                <MaterialCommunityIcons
                  name={selectedBadge.icon as any}
                  size={60}
                  color={getBadgeColor(selectedBadge.rarity)}
                />
              )}
            </View>

            <Text style={styles.badgeModalTitle}>{selectedBadge.name}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: getBadgeColor(selectedBadge.rarity) }]}>
              <Text style={styles.rarityText}>{selectedBadge.rarity.toUpperCase()}</Text>
            </View>

            <Text style={styles.badgeModalDescription}>{selectedBadge.description}</Text>

            {!selectedBadge.isEarned && selectedBadge.progress && (
              <View style={styles.badgeProgressSection}>
                <Text style={styles.badgeProgressLabel}>Progress</Text>
                <View style={styles.badgeProgressBar}>
                  <View
                    style={[
                      styles.badgeProgressFill,
                      { width: `${selectedBadge.progress.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.badgeProgressText}>
                  {selectedBadge.progress.current} / {selectedBadge.progress.target}
                </Text>
              </View>
            )}

            {selectedBadge.isEarned && selectedBadge.earnedAt && (
              <Text style={styles.earnedDate}>
                Earned on {format(parseISO(selectedBadge.earnedAt), 'MMM dd, yyyy')}
              </Text>
            )}

            {selectedBadge.criteria && (
              <View style={styles.criteriaSection}>
                <Text style={styles.criteriaLabel}>How to Earn:</Text>
                <Text style={styles.criteriaText}>{selectedBadge.criteria}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderAchievementNotification = () => {
    if (!currentAchievement) return null;

    return (
      <Modal
        visible={achievementNotificationVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAchievementNotificationVisible(false)}
      >
        <View style={styles.achievementOverlay}>
          <Animated.View entering={FadeIn.springify()} style={styles.achievementNotification}>
            <MaterialCommunityIcons name="trophy-award" size={60} color={COLORS.warning} />
            <Text style={styles.achievementTitle}>New Achievement!</Text>
            <Text style={styles.achievementName}>{currentAchievement.title}</Text>
            <Text style={styles.achievementDescription}>{currentAchievement.description}</Text>
            <View style={styles.achievementPoints}>
              <MaterialCommunityIcons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.achievementPointsText}>
                +{currentAchievement.pointsEarned} points
              </Text>
            </View>
            <Button
              title="Awesome!"
              variant="primary"
              onPress={() => setAchievementNotificationVisible(false)}
            />
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading gamification...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {renderPointsCard()}
        {renderBadgesGrid()}
        {renderLeaderboard()}
        {renderStreakCalendar()}
        {renderRewardsSection()}
      </ScrollView>

      {renderBadgeModal()}
      {renderAchievementNotification()}
    </View>
  );
};

interface BadgeItemProps {
  badge: Badge;
  onPress: () => void;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ badge, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.badgeItemContainer}>
      <Animated.View style={[styles.badgeItem, animatedStyle]}>
        <View
          style={[
            styles.badgeIconContainer,
            !badge.isEarned && styles.badgeIconLocked,
            { borderColor: getBadgeColor(badge.rarity) },
          ]}
        >
          {badge.isEarned ? (
            badge.iconUrl ? (
              <Text style={styles.badgeItemEmoji}>{badge.icon}</Text>
            ) : (
              <MaterialCommunityIcons
                name={badge.icon as any}
                size={32}
                color={getBadgeColor(badge.rarity)}
              />
            )
          ) : (
            <MaterialCommunityIcons name="lock" size={32} color={COLORS.disabled} />
          )}
        </View>
        <Text style={styles.badgeName} numberOfLines={2}>
          {badge.name}
        </Text>
        {badge.progress && !badge.isEarned && (
          <View style={styles.badgeItemProgress}>
            <View style={[styles.badgeItemProgressBar, { width: `${badge.progress.percentage}%` }]} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, index }) => {
  const translateX = useSharedValue(-50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const getMedalIcon = () => {
    if (index === 0) return 'trophy';
    if (index === 1) return 'medal';
    if (index === 2) return 'medal-outline';
    return null;
  };

  const getMedalColor = () => {
    if (index === 0) return '#FFD700';
    if (index === 1) return '#C0C0C0';
    if (index === 2) return '#CD7F32';
    return COLORS.textSecondary;
  };

  return (
    <Animated.View style={[styles.leaderboardRow, animatedStyle]}>
      <View style={styles.rankColumn}>
        {getMedalIcon() ? (
          <MaterialCommunityIcons name={getMedalIcon()!} size={24} color={getMedalColor()} />
        ) : (
          <Text style={styles.leaderboardRank}>#{entry.rank}</Text>
        )}
      </View>
      <View style={styles.leaderboardInfo}>
        <Text style={styles.leaderboardName} numberOfLines={1}>
          {entry.studentName}
        </Text>
        <View style={styles.leaderboardMeta}>
          <Text style={styles.leaderboardLevel}>Level {entry.level}</Text>
          <Text style={styles.leaderboardBadges}>{entry.badgeCount} badges</Text>
        </View>
      </View>
      <View style={styles.pointsColumn}>
        <Text style={styles.leaderboardPoints}>{entry.points.toLocaleString()}</Text>
        {entry.trend && (
          <MaterialCommunityIcons
            name={
              entry.trend === 'up'
                ? 'arrow-up'
                : entry.trend === 'down'
                  ? 'arrow-down'
                  : 'minus'
            }
            size={16}
            color={
              entry.trend === 'up'
                ? COLORS.success
                : entry.trend === 'down'
                  ? COLORS.error
                  : COLORS.textSecondary
            }
          />
        )}
      </View>
    </Animated.View>
  );
};

const getBadgeColor = (rarity: string): string => {
  switch (rarity) {
    case 'common':
      return COLORS.textSecondary;
    case 'rare':
      return COLORS.info;
    case 'epic':
      return COLORS.secondary;
    case 'legendary':
      return COLORS.warning;
    default:
      return COLORS.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  pointsCard: {
    marginBottom: SPACING.md,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pointsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pointsValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  levelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  levelSection: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  levelInfo: {
    marginBottom: SPACING.sm,
  },
  levelName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  levelProgress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  nextLevelText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  recentActivities: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  activityPoints: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  activityPointsText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
  badgesCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  badgeCount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  badgeItemContainer: {
    width: (SCREEN_WIDTH - SPACING.md * 5) / 4,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginBottom: SPACING.xs,
  },
  badgeIconLocked: {
    opacity: 0.5,
    borderColor: COLORS.disabled,
  },
  badgeItemEmoji: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  badgeItemProgress: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  badgeItemProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  leaderboardCard: {
    marginBottom: SPACING.md,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  timeframeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  timeframeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeframeButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  timeframeButtonTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  myRankCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  rankBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  rankNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  rankStats: {
    alignItems: 'flex-end',
  },
  rankPoints: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rankTotal: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  leaderboardList: {
    gap: SPACING.sm,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  rankColumn: {
    width: 40,
    alignItems: 'center',
  },
  leaderboardRank: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  leaderboardName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  leaderboardMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  leaderboardLevel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  leaderboardBadges: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  pointsColumn: {
    alignItems: 'flex-end',
  },
  leaderboardPoints: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  streakCard: {
    marginBottom: SPACING.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  streakCount: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  streakStat: {
    alignItems: 'center',
  },
  streakStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  streakStatValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  calendarHeatmap: {
    marginTop: SPACING.md,
  },
  weekdayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  weekdayLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayActive: {
    backgroundColor: COLORS.success,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  calendarDayText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  calendarDayTextActive: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  rewardsCard: {
    marginBottom: SPACING.md,
  },
  rewardsDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  badgeModalContent: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 1,
  },
  badgeIcon: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  badgeEmoji: {
    fontSize: 60,
  },
  badgeModalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  rarityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  rarityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  badgeModalDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  badgeProgressSection: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  badgeProgressLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  badgeProgressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  badgeProgressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  earnedDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  criteriaSection: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  criteriaLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  criteriaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  achievementNotification: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  achievementTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  achievementName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  achievementPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  achievementPointsText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
});
