import axios from 'axios';
import { Event, EventRSVP, EventPhoto } from '../types/event';

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

export const eventsApi = {
  listEvents: async (params?: Record<string, unknown>) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getEvent: async (id: number) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: Partial<Event>) => {
    const response = await api.post('/events', data);
    return response.data;
  },

  updateEvent: async (id: number, data: Partial<Event>) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: number) => {
    await api.delete(`/events/${id}`);
  },

  getEventCalendar: async (startDate: string, endDate: string) => {
    const response = await api.get('/events/calendar', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  listRSVPs: async (eventId: number) => {
    const response = await api.get(`/events/${eventId}/rsvps`);
    return response.data;
  },

  createRSVP: async (eventId: number, data: Partial<EventRSVP>) => {
    const response = await api.post(`/events/${eventId}/rsvps`, data);
    return response.data;
  },

  updateRSVP: async (eventId: number, rsvpId: number, data: Partial<EventRSVP>) => {
    const response = await api.put(`/events/${eventId}/rsvps/${rsvpId}`, data);
    return response.data;
  },

  listPhotos: async (eventId: number) => {
    const response = await api.get(`/events/${eventId}/photos`);
    return response.data;
  },

  uploadPhoto: async (eventId: number, formData: FormData) => {
    const response = await api.post(`/events/${eventId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updatePhoto: async (eventId: number, photoId: number, data: Partial<EventPhoto>) => {
    const response = await api.put(`/events/${eventId}/photos/${photoId}`, data);
    return response.data;
  },

  deletePhoto: async (eventId: number, photoId: number) => {
    await api.delete(`/events/${eventId}/photos/${photoId}`);
  },
};
