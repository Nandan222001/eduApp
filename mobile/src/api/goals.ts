import { apiClient } from './client';

export interface Milestone {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
  order: number;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: 'academic' | 'skill' | 'personal' | 'career';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  priority: 'high' | 'medium' | 'low';
  startDate: string;
  targetDate: string;
  completedDate?: string;
  progress: number;
  milestones: Milestone[];
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalCreateRequest {
  title: string;
  description: string;
  category: 'academic' | 'skill' | 'personal' | 'career';
  priority: 'high' | 'medium' | 'low';
  targetDate: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  milestones: {
    title: string;
    description: string;
    targetDate: string;
    order: number;
  }[];
}

export interface GoalUpdateRequest {
  title?: string;
  description?: string;
  category?: 'academic' | 'skill' | 'personal' | 'career';
  priority?: 'high' | 'medium' | 'low';
  status?: 'active' | 'completed' | 'paused' | 'abandoned';
  targetDate?: string;
  progress?: number;
}

export interface Achievement {
  id: number;
  goalId: number;
  goalTitle: string;
  completedAt: string;
  category: string;
  points: number;
  badge?: string;
}

export const goalsApi = {
  getGoals: async (status?: string) => {
    const params = status ? { status } : undefined;
    return apiClient.get<Goal[]>('/api/v1/goals', { params });
  },

  getGoalById: async (goalId: number) => {
    return apiClient.get<Goal>(`/api/v1/goals/${goalId}`);
  },

  createGoal: async (data: GoalCreateRequest) => {
    return apiClient.post<Goal>('/api/v1/goals', data);
  },

  updateGoal: async (goalId: number, data: GoalUpdateRequest) => {
    return apiClient.patch<Goal>(`/api/v1/goals/${goalId}`, data);
  },

  deleteGoal: async (goalId: number) => {
    return apiClient.delete<void>(`/api/v1/goals/${goalId}`);
  },

  completeMilestone: async (goalId: number, milestoneId: number) => {
    return apiClient.post<Milestone>(`/api/v1/goals/${goalId}/milestones/${milestoneId}/complete`);
  },

  updateMilestone: async (goalId: number, milestoneId: number, data: { completed: boolean }) => {
    return apiClient.patch<Milestone>(`/api/v1/goals/${goalId}/milestones/${milestoneId}`, data);
  },

  getAchievements: async () => {
    return apiClient.get<Achievement[]>('/api/v1/goals/achievements');
  },

  shareGoal: async (goalId: number, shareWith: string[]) => {
    return apiClient.post<void>(`/api/v1/goals/${goalId}/share`, { shareWith });
  },

  getSharedGoals: async () => {
    return apiClient.get<Goal[]>('/api/v1/goals/shared');
  },

  getChildGoals: async (childId: number, status?: string) => {
    const params = status ? { status } : undefined;
    return apiClient.get<Goal[]>(`/api/v1/goals/child/${childId}`, { params });
  },
};
