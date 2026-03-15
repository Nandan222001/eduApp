import axios from 'axios';
import {
  OnboardingFlow,
  OnboardingProgress,
  OnboardingAnalytics,
  UserRole,
} from '@/types/onboarding';

const API_BASE = '/api/v1';

export const onboardingApi = {
  getFlowsByRole: async (role: UserRole): Promise<OnboardingFlow[]> => {
    const response = await axios.get(`${API_BASE}/onboarding/flows`, {
      params: { role },
    });
    return response.data;
  },

  getFlowById: async (flowId: string): Promise<OnboardingFlow> => {
    const response = await axios.get(`${API_BASE}/onboarding/flows/${flowId}`);
    return response.data;
  },

  createFlow: async (flow: Partial<OnboardingFlow>): Promise<OnboardingFlow> => {
    const response = await axios.post(`${API_BASE}/onboarding/flows`, flow);
    return response.data;
  },

  updateFlow: async (flowId: string, flow: Partial<OnboardingFlow>): Promise<OnboardingFlow> => {
    const response = await axios.put(`${API_BASE}/onboarding/flows/${flowId}`, flow);
    return response.data;
  },

  deleteFlow: async (flowId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/onboarding/flows/${flowId}`);
  },

  getUserProgress: async (userId: string, flowId?: string): Promise<OnboardingProgress> => {
    const response = await axios.get(`${API_BASE}/onboarding/progress/${userId}`, {
      params: { flowId },
    });
    return response.data;
  },

  updateProgress: async (
    progressId: string,
    update: Partial<OnboardingProgress>
  ): Promise<OnboardingProgress> => {
    const response = await axios.put(`${API_BASE}/onboarding/progress/${progressId}`, update);
    return response.data;
  },

  completeStep: async (
    progressId: string,
    stepId: string,
    data?: Record<string, unknown>
  ): Promise<OnboardingProgress> => {
    const response = await axios.post(
      `${API_BASE}/onboarding/progress/${progressId}/steps/${stepId}/complete`,
      { data }
    );
    return response.data;
  },

  skipStep: async (progressId: string, stepId: string): Promise<OnboardingProgress> => {
    const response = await axios.post(
      `${API_BASE}/onboarding/progress/${progressId}/steps/${stepId}/skip`
    );
    return response.data;
  },

  getAnalytics: async (flowId: string): Promise<OnboardingAnalytics> => {
    const response = await axios.get(`${API_BASE}/onboarding/analytics/${flowId}`);
    return response.data;
  },

  trackStepView: async (progressId: string, stepId: string): Promise<void> => {
    await axios.post(`${API_BASE}/onboarding/track/step-view`, {
      progressId,
      stepId,
      timestamp: new Date().toISOString(),
    });
  },

  trackStepTime: async (progressId: string, stepId: string, timeSpent: number): Promise<void> => {
    await axios.post(`${API_BASE}/onboarding/track/step-time`, {
      progressId,
      stepId,
      timeSpent,
    });
  },
};

export default onboardingApi;
