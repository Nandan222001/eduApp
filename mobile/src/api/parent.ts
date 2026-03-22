import { apiClient } from './client';
import { isDemoUser, demoDataApi } from './demoDataApi';
import {
  ParentDashboardData,
  ChildAttendanceSummary,
  ChildGradesSummary,
  MessageThread,
  SendMessageData,
  TeacherMessage,
} from '../types/parent';

export interface AttendanceParams {
  month?: string;
  year?: number;
}

export interface GradesParams {
  term?: string;
  subject?: string;
}

export const parentApi = {
  getDashboard: async () => {
    if (await isDemoUser()) {
      return { data: null, success: true };
    }
    return apiClient.get<ParentDashboardData>('/api/v1/parents/dashboard');
  },

  getChildren: async () => {
    if (await isDemoUser()) {
      const children = await demoDataApi.parent.getChildren();
      return { data: children, success: true };
    }
    const response = await apiClient.get<ParentDashboardData>('/api/v1/parents/dashboard');
    return { data: response.data.children, success: response.success };
  },

  getChildAttendance: async (childId: number, params?: AttendanceParams) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month);
    if (params?.year) queryParams.append('year', params.year.toString());

    const url = `/api/v1/parents/children/${childId}/attendance${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    return apiClient.get<ChildAttendanceSummary>(url);
  },

  getChildGrades: async (childId: number, params?: GradesParams) => {
    const queryParams = new URLSearchParams();
    if (params?.term) queryParams.append('term', params.term);
    if (params?.subject) queryParams.append('subject', params.subject);

    const url = `/api/v1/parents/children/${childId}/grades${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    return apiClient.get<ChildGradesSummary>(url);
  },

  getMessageThreads: async () => {
    return apiClient.get<MessageThread[]>('/api/v1/parents/messages');
  },

  getThreadMessages: async (threadId: number) => {
    return apiClient.get<MessageThread>(`/api/v1/parents/messages/threads/${threadId}`);
  },

  sendMessage: async (data: SendMessageData) => {
    return apiClient.post<TeacherMessage>('/api/v1/parents/messages', data);
  },

  markMessageAsRead: async (messageId: number) => {
    return apiClient.patch<TeacherMessage>(`/api/v1/parents/messages/${messageId}/read`, {});
  },
};
