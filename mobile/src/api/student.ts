import { apiClient } from './client';
import { isDemoUser, demoDataApi } from './demoDataApi';
import {
  Profile,
  AttendanceSummary,
  Assignment,
  Grade,
  AIPrediction,
  WeakArea,
  GamificationData,
  AIPredictionDashboardData,
  HomeworkScanResult,
  ChatMessage,
  StudyPlan,
  DailyBriefing,
  GamificationDetails,
  LeaderboardEntry,
  Goal,
  CreateGoalRequest,
} from '../types/student';

export interface DashboardData {
  attendance: AttendanceSummary;
  upcomingAssignments: Assignment[];
  recentGrades: Grade[];
  aiPredictions: AIPrediction;
  weakAreas: WeakArea[];
  gamification: GamificationData;
}

export interface GradesParams {
  term?: string;
  subject?: string;
  page?: number;
  limit?: number;
}

export interface TimetableEntry {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam';
}

export interface TimetableData {
  currentDay: string;
  entries: TimetableEntry[];
}

export const studentApi = {
  getProfile: async () => {
    if (await isDemoUser()) {
      const profile = await demoDataApi.student.getProfile();
      return { data: profile };
    }
    return apiClient.get<Profile>('/api/v1/profile');
  },

  getDashboard: async () => {
    if (await isDemoUser()) {
      const dashboard = await demoDataApi.student.getDashboard();
      return { data: dashboard };
    }
    return apiClient.get<DashboardData>('/api/v1/students/dashboard');
  },

  getAttendanceSummary: async () => {
    return apiClient.get<AttendanceSummary>('/api/v1/attendance/summary');
  },

  getAssignments: async () => {
    return apiClient.get<Assignment[]>('/api/v1/assignments');
  },

  getGrades: async (params?: GradesParams) => {
    const queryParams = new URLSearchParams();
    if (params?.term) queryParams.append('term', params.term);
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/v1/grades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Grade[]>(url);
  },

  getAIPredictionDashboard: async () => {
    return apiClient.get<AIPrediction>('/api/v1/ai-prediction-dashboard');
  },

  getWeakAreas: async () => {
    return apiClient.get<WeakArea[]>('/api/v1/weakness-detection');
  },

  getGamification: async () => {
    return apiClient.get<GamificationData>('/api/v1/gamification');
  },

  getTimetable: async () => {
    return apiClient.get<TimetableData>('/api/v1/timetable');
  },

  getAIPredictionDashboardDetails: async () => {
    return apiClient.get<AIPredictionDashboardData>('/api/v1/ai-prediction-dashboard');
  },

  scanHomework: async (imageUri: string, subject?: string) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'homework.jpg',
    } as any);
    if (subject) {
      formData.append('subject', subject);
    }

    return apiClient.post<HomeworkScanResult>('/api/v1/homework-scanner', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  sendStudyBuddyMessage: async (message: string, isVoice?: boolean) => {
    return apiClient.post<{ reply: ChatMessage }>('/api/v1/study-buddy', {
      message,
      isVoice,
    });
  },

  getStudyBuddyHistory: async () => {
    return apiClient.get<ChatMessage[]>('/api/v1/study-buddy/history');
  },

  getPersonalizedStudyPlan: async () => {
    return apiClient.get<StudyPlan>('/api/v1/study-buddy/study-plan');
  },

  getDailyBriefing: async () => {
    return apiClient.get<DailyBriefing>('/api/v1/study-buddy/daily-briefing');
  },

  getGamificationDetails: async () => {
    return apiClient.get<GamificationDetails>('/api/v1/gamification');
  },

  getLeaderboard: async (period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly') => {
    return apiClient.get<LeaderboardEntry[]>(`/api/v1/gamification/leaderboard?period=${period}`);
  },

  getGoals: async () => {
    if (await isDemoUser()) {
      const goals = await demoDataApi.student.getGoals();
      return { data: goals.data };
    }
    return apiClient.get<Goal[]>('/api/v1/goals');
  },

  createGoal: async (goal: CreateGoalRequest) => {
    return apiClient.post<Goal>('/api/v1/goals', goal);
  },

  updateGoal: async (goalId: number, updates: Partial<CreateGoalRequest>) => {
    return apiClient.put<Goal>(`/api/v1/goals/${goalId}`, updates);
  },

  deleteGoal: async (goalId: number) => {
    return apiClient.delete(`/api/v1/goals/${goalId}`);
  },

  updateGoalProgress: async (goalId: number, progress: number) => {
    return apiClient.patch<Goal>(`/api/v1/goals/${goalId}/progress`, { progress });
  },
};
