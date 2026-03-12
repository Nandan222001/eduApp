import axios from 'axios';
import { TransportRoute, RouteStop, StudentTransport } from '../types/transport';

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

export const transportApi = {
  listRoutes: async (params?: Record<string, unknown>) => {
    const response = await api.get('/transport/routes', { params });
    return response.data;
  },

  getRoute: async (id: number) => {
    const response = await api.get(`/transport/routes/${id}`);
    return response.data;
  },

  createRoute: async (data: Partial<TransportRoute>) => {
    const response = await api.post('/transport/routes', data);
    return response.data;
  },

  updateRoute: async (id: number, data: Partial<TransportRoute>) => {
    const response = await api.put(`/transport/routes/${id}`, data);
    return response.data;
  },

  deleteRoute: async (id: number) => {
    await api.delete(`/transport/routes/${id}`);
  },

  getRouteStops: async (routeId: number) => {
    const response = await api.get(`/transport/routes/${routeId}/stops`);
    return response.data;
  },

  createStop: async (routeId: number, data: Partial<RouteStop>) => {
    const response = await api.post(`/transport/routes/${routeId}/stops`, data);
    return response.data;
  },

  updateStop: async (routeId: number, stopId: number, data: Partial<RouteStop>) => {
    const response = await api.put(`/transport/routes/${routeId}/stops/${stopId}`, data);
    return response.data;
  },

  deleteStop: async (routeId: number, stopId: number) => {
    await api.delete(`/transport/routes/${routeId}/stops/${stopId}`);
  },

  listStudentTransport: async (params?: Record<string, unknown>) => {
    const response = await api.get('/transport/student-assignments', { params });
    return response.data;
  },

  assignStudent: async (data: Partial<StudentTransport>) => {
    const response = await api.post('/transport/student-assignments', data);
    return response.data;
  },

  updateStudentTransport: async (id: number, data: Partial<StudentTransport>) => {
    const response = await api.put(`/transport/student-assignments/${id}`, data);
    return response.data;
  },

  deleteStudentTransport: async (id: number) => {
    await api.delete(`/transport/student-assignments/${id}`);
  },
};
