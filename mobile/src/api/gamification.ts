import { apiClient } from './client';
import { Points, Badge, Leaderboard, Achievement, GamificationStats, Reward, Streak } from '@types';

export const gamificationApi = {
  getPoints: async (studentId?: number): Promise<Points> => {
    const endpoint = studentId
      ? `/api/v1/gamification/points?studentId=${studentId}`
      : '/api/v1/gamification/points';
    const response = await apiClient.get<Points>(endpoint);
    return response.data;
  },

  getBadges: async (studentId?: number): Promise<Badge[]> => {
    const endpoint = studentId
      ? `/api/v1/gamification/badges?studentId=${studentId}`
      : '/api/v1/gamification/badges';
    const response = await apiClient.get<Badge[]>(endpoint);
    return response.data;
  },

  getBadgeById: async (badgeId: number): Promise<Badge> => {
    const response = await apiClient.get<Badge>(`/api/v1/gamification/badges/${badgeId}`);
    return response.data;
  },

  getAvailableBadges: async (): Promise<Badge[]> => {
    const response = await apiClient.get<Badge[]>('/api/v1/gamification/badges/available');
    return response.data;
  },

  getLeaderboard: async (
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time',
    classId?: number
  ): Promise<Leaderboard> => {
    const params: any = {};
    if (timeframe) params.timeframe = timeframe;
    if (classId) params.classId = classId;

    const response = await apiClient.get<Leaderboard>('/api/v1/gamification/leaderboard', {
      params,
    });
    return response.data;
  },

  getAchievements: async (studentId?: number): Promise<Achievement[]> => {
    const endpoint = studentId
      ? `/api/v1/gamification/achievements?studentId=${studentId}`
      : '/api/v1/gamification/achievements';
    const response = await apiClient.get<Achievement[]>(endpoint);
    return response.data;
  },

  getStats: async (studentId?: number): Promise<GamificationStats> => {
    const endpoint = studentId
      ? `/api/v1/gamification/stats?studentId=${studentId}`
      : '/api/v1/gamification/stats';
    const response = await apiClient.get<GamificationStats>(endpoint);
    return response.data;
  },

  getRewards: async (): Promise<Reward[]> => {
    const response = await apiClient.get<Reward[]>('/api/v1/gamification/rewards');
    return response.data;
  },

  claimReward: async (rewardId: number): Promise<void> => {
    await apiClient.post(`/api/v1/gamification/rewards/${rewardId}/claim`, {});
  },

  getStreaks: async (studentId?: number): Promise<Streak[]> => {
    const endpoint = studentId
      ? `/api/v1/gamification/streaks?studentId=${studentId}`
      : '/api/v1/gamification/streaks';
    const response = await apiClient.get<Streak[]>(endpoint);
    return response.data;
  },

  markAchievementAsViewed: async (achievementId: number): Promise<void> => {
    await apiClient.post(`/api/v1/gamification/achievements/${achievementId}/viewed`, {});
  },
};
