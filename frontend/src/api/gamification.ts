import axios from 'axios';
import { isDemoUser, demoDataApi } from './demoDataApi';
import {
  Badge,
  UserBadge,
  UserPoints,
  PointHistory,
  Achievement,
  UserAchievement,
  Leaderboard,
  LeaderboardEntry,
  LeaderboardWithEntries,
  StreakTracker,
  UserGamificationStats,
  UserShowcase,
  Reward,
  UserRedemption,
  LeaderboardFilter,
} from '../types/gamification';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const gamificationAPI = {
  // User Points
  getUserPoints: async (userId: number, institutionId: number): Promise<UserPoints> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getUserPoints(userId, institutionId);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/points`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  getPointHistory: async (
    userId: number,
    institutionId: number,
    limit = 50
  ): Promise<PointHistory[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getPointHistory(userId, institutionId, limit);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/point-history`, {
      params: { institution_id: institutionId, limit },
    });
    return response.data;
  },

  // Badges
  getUserBadges: async (userId: number, institutionId: number): Promise<UserBadge[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getUserBadges(userId, institutionId);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/badges`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  getBadges: async (institutionId: number): Promise<Badge[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getBadges(institutionId);
    }
    const response = await api.get('/api/v1/gamification/badges', {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  // Achievements
  getUserAchievements: async (
    userId: number,
    institutionId: number
  ): Promise<UserAchievement[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getUserAchievements(userId, institutionId);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/achievements`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  getAchievements: async (institutionId: number): Promise<Achievement[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getAchievements(institutionId);
    }
    const response = await api.get('/api/v1/gamification/achievements', {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  // Leaderboards
  getLeaderboards: async (institutionId: number): Promise<Leaderboard[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getLeaderboards(institutionId);
    }
    const response = await api.get('/api/v1/gamification/leaderboards', {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  getLeaderboardWithEntries: async (leaderboardId: number): Promise<LeaderboardWithEntries> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getLeaderboardWithEntries(leaderboardId);
    }
    const response = await api.get(`/api/v1/gamification/leaderboards/${leaderboardId}`);
    return response.data;
  },

  getDynamicLeaderboard: async (
    institutionId: number,
    filter: LeaderboardFilter,
    currentUserId?: number,
    limit = 50
  ): Promise<LeaderboardEntry[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getDynamicLeaderboard(
        institutionId,
        filter,
        currentUserId,
        limit
      );
    }
    const response = await api.get('/api/v1/gamification/leaderboard', {
      params: {
        institution_id: institutionId,
        limit,
        current_user_id: currentUserId,
        ...filter,
      },
    });
    return response.data;
  },

  // Streaks
  getUserStreaks: async (userId: number, institutionId: number): Promise<StreakTracker[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getUserStreaks(userId, institutionId);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/streaks`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  recordDailyLogin: async (
    userId: number,
    institutionId: number
  ): Promise<{ message: string; streak: number; points_earned: number }> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.recordDailyLogin(userId, institutionId);
    }
    const response = await api.post(
      `/api/v1/gamification/users/${userId}/daily-login`,
      {},
      {
        params: { institution_id: institutionId },
      }
    );
    return response.data;
  },

  // User Stats
  getUserStats: async (userId: number, institutionId: number): Promise<UserGamificationStats> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getUserStats(userId, institutionId);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/stats`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  getUserShowcase: async (userId: number, institutionId: number): Promise<UserShowcase> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getUserShowcase(userId, institutionId);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/showcase`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  // Rewards
  getRewards: async (institutionId: number): Promise<Reward[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getRewards(institutionId);
    }
    const response = await api.get('/api/v1/gamification/rewards', {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  getUserRedemptions: async (userId: number, institutionId: number): Promise<UserRedemption[]> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.getUserRedemptions(userId, institutionId);
    }
    const response = await api.get(`/api/v1/gamification/users/${userId}/redemptions`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  redeemReward: async (
    userId: number,
    rewardId: number,
    institutionId: number
  ): Promise<UserRedemption> => {
    if (isDemoUser()) {
      return demoDataApi.gamification.redeemReward(userId, rewardId, institutionId);
    }
    const response = await api.post(
      '/api/v1/gamification/rewards/redeem',
      {
        user_id: userId,
        reward_id: rewardId,
      },
      {
        params: { institution_id: institutionId },
      }
    );
    return response.data;
  },
};
