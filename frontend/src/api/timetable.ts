import axios from 'axios';
import { TimetableTemplate, Timetable, TimetableEntry } from '../types/timetable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
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

export const timetableApi = {
  listTemplates: async (params?: Record<string, unknown>) => {
    const response = await api.get('/timetable/templates', { params });
    return response.data;
  },

  getTemplate: async (id: number) => {
    const response = await api.get(`/timetable/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: Partial<TimetableTemplate>) => {
    const response = await api.post('/timetable/templates', data);
    return response.data;
  },

  updateTemplate: async (id: number, data: Partial<TimetableTemplate>) => {
    const response = await api.put(`/timetable/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: number) => {
    await api.delete(`/timetable/templates/${id}`);
  },

  listTimetables: async (params?: Record<string, unknown>) => {
    const response = await api.get('/timetable/timetables', { params });
    return response.data;
  },

  getTimetable: async (id: number) => {
    const response = await api.get(`/timetable/timetables/${id}`);
    return response.data;
  },

  createTimetable: async (data: Partial<Timetable>) => {
    const response = await api.post('/timetable/timetables', data);
    return response.data;
  },

  updateTimetable: async (id: number, data: Partial<Timetable>) => {
    const response = await api.put(`/timetable/timetables/${id}`, data);
    return response.data;
  },

  deleteTimetable: async (id: number) => {
    await api.delete(`/timetable/timetables/${id}`);
  },

  getTimetableEntries: async (timetableId: number) => {
    const response = await api.get(`/timetable/timetables/${timetableId}/entries`);
    return response.data;
  },

  createEntry: async (timetableId: number, data: Partial<TimetableEntry>) => {
    const response = await api.post(`/timetable/timetables/${timetableId}/entries`, data);
    return response.data;
  },

  updateEntry: async (timetableId: number, entryId: number, data: Partial<TimetableEntry>) => {
    const response = await api.put(`/timetable/timetables/${timetableId}/entries/${entryId}`, data);
    return response.data;
  },

  deleteEntry: async (timetableId: number, entryId: number) => {
    await api.delete(`/timetable/timetables/${timetableId}/entries/${entryId}`);
  },

  checkConflicts: async (timetableId: number, entryData: Partial<TimetableEntry>) => {
    const response = await api.post(
      `/timetable/timetables/${timetableId}/check-conflicts`,
      entryData
    );
    return response.data;
  },

  getTeacherTimetable: async (teacherId: number, params?: Record<string, unknown>) => {
    const response = await api.get(`/timetable/teachers/${teacherId}`, { params });
    return response.data;
  },
};
