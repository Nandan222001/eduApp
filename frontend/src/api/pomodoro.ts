import axios from 'axios';
import { PomodoroSession, PomodoroSettings, PomodoroAnalytics, Subject } from '@/types/pomodoro';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const pomodoroApi = {
  getSettings: async (studentId: number): Promise<PomodoroSettings> => {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/pomodoro/settings`);
    return response.data;
  },

  updateSettings: async (
    studentId: number,
    settings: Partial<PomodoroSettings>
  ): Promise<PomodoroSettings> => {
    const response = await axios.put(
      `${API_BASE_URL}/students/${studentId}/pomodoro/settings`,
      settings
    );
    return response.data;
  },

  startSession: async (
    studentId: number,
    data: {
      session_type: 'work' | 'short_break' | 'long_break';
      duration_minutes: number;
      subject_id?: number;
    }
  ): Promise<PomodoroSession> => {
    const response = await axios.post(
      `${API_BASE_URL}/students/${studentId}/pomodoro/sessions/start`,
      data
    );
    return response.data;
  },

  completeSession: async (studentId: number, sessionId: number): Promise<PomodoroSession> => {
    const response = await axios.post(
      `${API_BASE_URL}/students/${studentId}/pomodoro/sessions/${sessionId}/complete`
    );
    return response.data;
  },

  interruptSession: async (studentId: number, sessionId: number): Promise<PomodoroSession> => {
    const response = await axios.post(
      `${API_BASE_URL}/students/${studentId}/pomodoro/sessions/${sessionId}/interrupt`
    );
    return response.data;
  },

  getSessions: async (
    studentId: number,
    params?: {
      start_date?: string;
      end_date?: string;
      subject_id?: number;
      limit?: number;
    }
  ): Promise<PomodoroSession[]> => {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/pomodoro/sessions`, {
      params,
    });
    return response.data;
  },

  getAnalytics: async (
    studentId: number,
    params?: {
      start_date?: string;
      end_date?: string;
    }
  ): Promise<PomodoroAnalytics> => {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/pomodoro/analytics`, {
      params,
    });
    return response.data;
  },

  getSubjects: async (studentId: number): Promise<Subject[]> => {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/subjects`);
    return response.data;
  },
};

export default pomodoroApi;
