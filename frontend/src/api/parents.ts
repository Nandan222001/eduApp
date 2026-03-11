import axios from '@/lib/axios';
import type {
  ParentDashboard,
  ChildOverview,
  TodayAttendance,
  RecentGrade,
  PendingAssignment,
  WeeklyProgress,
  PerformanceComparison,
  GoalProgress,
} from '@/types/parent';

export const parentsApi = {
  getDashboard: async (childId?: number): Promise<ParentDashboard> => {
    const params = childId ? `?child_id=${childId}` : '';
    const response = await axios.get<ParentDashboard>(`/api/v1/parents/dashboard${params}`);
    return response.data;
  },

  getChildren: async (): Promise<ChildOverview[]> => {
    const response = await axios.get<ChildOverview[]>('/api/v1/parents/children');
    return response.data;
  },

  getChildOverview: async (childId: number): Promise<ChildOverview> => {
    const response = await axios.get<ChildOverview>(`/api/v1/parents/children/${childId}/overview`);
    return response.data;
  },

  getTodayAttendance: async (childId: number): Promise<TodayAttendance> => {
    const response = await axios.get<TodayAttendance>(
      `/api/v1/parents/children/${childId}/attendance/today`
    );
    return response.data;
  },

  getRecentGrades: async (childId: number, limit = 10): Promise<RecentGrade[]> => {
    const response = await axios.get<RecentGrade[]>(
      `/api/v1/parents/children/${childId}/grades/recent?limit=${limit}`
    );
    return response.data;
  },

  getPendingAssignments: async (childId: number): Promise<PendingAssignment[]> => {
    const response = await axios.get<PendingAssignment[]>(
      `/api/v1/parents/children/${childId}/assignments/pending`
    );
    return response.data;
  },

  getWeeklyProgress: async (childId: number): Promise<WeeklyProgress> => {
    const response = await axios.get<WeeklyProgress>(
      `/api/v1/parents/children/${childId}/progress/weekly`
    );
    return response.data;
  },

  getPerformanceComparison: async (childId: number): Promise<PerformanceComparison> => {
    const response = await axios.get<PerformanceComparison>(
      `/api/v1/parents/children/${childId}/performance/comparison`
    );
    return response.data;
  },

  getChildGoals: async (
    childId: number
  ): Promise<{ goals: GoalProgress[]; total: number; active: number; completed: number }> => {
    const response = await axios.get(`/api/v1/parents/children/${childId}/goals`);
    return response.data;
  },
};
