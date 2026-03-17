import { apiClient } from './client';
import {
  Profile,
  AttendanceSummary,
  Assignment,
  Grade,
  AIPrediction,
  WeakArea,
  GamificationData,
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
    return apiClient.get<Profile>('/api/v1/profile');
  },

  getDashboard: async () => {
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
};
