import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING } from '@constants';
import { studentApi } from '../../api/student';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { WelcomeCard } from '../../components/student/WelcomeCard';
import { AttendanceStatusCard } from '../../components/student/AttendanceStatusCard';
import { UpcomingAssignmentsCard } from '../../components/student/UpcomingAssignmentsCard';
import { RecentGradesCard } from '../../components/student/RecentGradesCard';
import { AIPredictionWidget } from '../../components/student/AIPredictionWidget';
import { WeakAreasPanel } from '../../components/student/WeakAreasPanel';
import { StreakTracker } from '../../components/student/StreakTracker';
import { GamificationWidget } from '../../components/student/GamificationWidget';
import { AIFeaturesQuickAccess } from '../../components/student/AIFeaturesQuickAccess';
import { QuickGamificationWidget } from '../../components/student/QuickGamificationWidget';
import { ActiveGoalsWidget } from '../../components/student/ActiveGoalsWidget';

export const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getDashboard();
      }
      const response = await studentApi.getDashboard();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getProfile();
      }
      const response = await studentApi.getProfile();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: goalsData } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      if (isDemoUser()) {
        const response = await demoDataApi.student.getGoals();
        return response.data;
      }
      const response = await studentApi.getGoals();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleRetry = () => {
    refetch();
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (isError && !dashboardData) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" type="feather" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Unable to load dashboard</Text>
        <Text style={styles.errorSubtext}>
          {(error as any)?.message || 'Please check your connection and try again'}
        </Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Icon name="refresh-cw" type="feather" size={20} color={COLORS.background} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
      <WelcomeCard profile={profile} isLoading={!profile} />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <AttendanceStatusCard attendance={dashboardData?.attendance} isLoading={!dashboardData} />
        </View>
        <View style={styles.halfWidth}>
          <StreakTracker streak={dashboardData?.gamification?.streak} isLoading={!dashboardData} />
        </View>
      </View>

      <AIPredictionWidget prediction={dashboardData?.aiPredictions} isLoading={!dashboardData} />

      <QuickGamificationWidget
        points={dashboardData?.gamification?.totalPoints}
        rank={dashboardData?.gamification?.rank}
        activeGoals={dashboardData?.gamification?.activeGoalsCount}
        streak={dashboardData?.gamification?.streak?.currentStreak}
        isLoading={!dashboardData}
      />

      <AIFeaturesQuickAccess />

      <ActiveGoalsWidget goals={goalsData} isLoading={!goalsData} />

      <UpcomingAssignmentsCard
        assignments={dashboardData?.upcomingAssignments}
        isLoading={!dashboardData}
        onViewAll={() => {}}
      />

      <RecentGradesCard
        grades={dashboardData?.recentGrades}
        isLoading={!dashboardData}
        onViewAll={() => {}}
      />

      <WeakAreasPanel weakAreas={dashboardData?.weakAreas} isLoading={!dashboardData} />

      <GamificationWidget gamification={dashboardData?.gamification} isLoading={!dashboardData} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
