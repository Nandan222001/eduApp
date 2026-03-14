import axios from 'axios';
import { Goal, GoalFormData, GoalAnalytics } from '@/types/goals';
import { isDemoUser, demoDataApi } from './demoDataApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const goalsApi = {
  getGoals: async (): Promise<Goal[]> => {
    if (isDemoUser()) {
      return demoDataApi.goals.getGoals();
    }
    const response = await axios.get(`${API_URL}/api/goals`);
    return response.data;
  },

  getGoal: async (id: string): Promise<Goal> => {
    if (isDemoUser()) {
      return demoDataApi.goals.getGoal(id);
    }
    const response = await axios.get(`${API_URL}/api/goals/${id}`);
    return response.data;
  },

  createGoal: async (data: GoalFormData): Promise<Goal> => {
    if (isDemoUser()) {
      return demoDataApi.goals.createGoal(data);
    }
    const response = await axios.post(`${API_URL}/api/goals`, data);
    return response.data;
  },

  updateGoal: async (id: string, data: Partial<GoalFormData>): Promise<Goal> => {
    if (isDemoUser()) {
      return demoDataApi.goals.updateGoal(id, data);
    }
    const response = await axios.put(`${API_URL}/api/goals/${id}`, data);
    return response.data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    if (isDemoUser()) {
      return demoDataApi.goals.deleteGoal(id);
    }
    await axios.delete(`${API_URL}/api/goals/${id}`);
  },

  updateMilestoneProgress: async (
    goalId: string,
    milestoneId: string,
    progress: number
  ): Promise<Goal> => {
    if (isDemoUser()) {
      return demoDataApi.goals.updateMilestoneProgress(goalId, milestoneId, progress);
    }
    const response = await axios.patch(`${API_URL}/api/goals/${goalId}/milestones/${milestoneId}`, {
      progress,
    });
    return response.data;
  },

  completeMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
    if (isDemoUser()) {
      return demoDataApi.goals.completeMilestone(goalId, milestoneId);
    }
    const response = await axios.post(
      `${API_URL}/api/goals/${goalId}/milestones/${milestoneId}/complete`
    );
    return response.data;
  },

  getAnalytics: async (): Promise<GoalAnalytics> => {
    if (isDemoUser()) {
      return demoDataApi.goals.getAnalytics();
    }
    const response = await axios.get(`${API_URL}/api/goals/analytics`);
    return response.data;
  },
};
