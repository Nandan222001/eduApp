import axios from 'axios';
import { Goal, GoalFormData, GoalAnalytics } from '@/types/goals';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const goalsApi = {
  getGoals: async (): Promise<Goal[]> => {
    const response = await axios.get(`${API_URL}/api/goals`);
    return response.data;
  },

  getGoal: async (id: string): Promise<Goal> => {
    const response = await axios.get(`${API_URL}/api/goals/${id}`);
    return response.data;
  },

  createGoal: async (data: GoalFormData): Promise<Goal> => {
    const response = await axios.post(`${API_URL}/api/goals`, data);
    return response.data;
  },

  updateGoal: async (id: string, data: Partial<GoalFormData>): Promise<Goal> => {
    const response = await axios.put(`${API_URL}/api/goals/${id}`, data);
    return response.data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/goals/${id}`);
  },

  updateMilestoneProgress: async (
    goalId: string,
    milestoneId: string,
    progress: number
  ): Promise<Goal> => {
    const response = await axios.patch(`${API_URL}/api/goals/${goalId}/milestones/${milestoneId}`, {
      progress,
    });
    return response.data;
  },

  completeMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
    const response = await axios.post(
      `${API_URL}/api/goals/${goalId}/milestones/${milestoneId}/complete`
    );
    return response.data;
  },

  getAnalytics: async (): Promise<GoalAnalytics> => {
    const response = await axios.get(`${API_URL}/api/goals/analytics`);
    return response.data;
  },
};
