import axios from 'axios';
import {
  Event,
  EventRSVP,
  EventPhoto,
  LiveEvent,
  ChatMessage,
  EventTicket,
  EventReminder,
  ParentNotificationPreferences,
  ViewerAnalytics,
} from '../types/event';

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

  getLiveEvent: async (id: number): Promise<LiveEvent> => {
    const response = await api.get(`/events/${id}/live`);
    return response.data;
  },

  getLiveEvents: async (): Promise<LiveEvent[]> => {
    const response = await api.get('/events/live');
    return response.data;
  },

  getUpcomingLiveEvents: async (): Promise<LiveEvent[]> => {
    const response = await api.get('/events/upcoming-live');
    return response.data;
  },

  getRecordedEvents: async (): Promise<LiveEvent[]> => {
    const response = await api.get('/events/recordings');
    return response.data;
  },

  getChatMessages: async (eventId: number, limit = 100): Promise<ChatMessage[]> => {
    const response = await api.get(`/events/${eventId}/chat`, { params: { limit } });
    return response.data;
  },

  sendChatMessage: async (eventId: number, message: string): Promise<ChatMessage> => {
    const response = await api.post(`/events/${eventId}/chat`, { message });
    return response.data;
  },

  moderateMessage: async (eventId: number, messageId: string, action: 'delete' | 'flag') => {
    await api.post(`/events/${eventId}/chat/${messageId}/moderate`, { action });
  },

  getStreamHealth: async (eventId: number) => {
    const response = await api.get(`/events/${eventId}/stream-health`);
    return response.data;
  },

  getViewerAnalytics: async (eventId: number): Promise<ViewerAnalytics> => {
    const response = await api.get(`/events/${eventId}/analytics`);
    return response.data;
  },

  purchaseTicket: async (
    eventId: number,
    paymentData: {
      ticketTypeId: number;
      quantity: number;
      paymentMethod: string;
      paymentDetails: Record<string, unknown>;
    }
  ): Promise<EventTicket> => {
    const response = await api.post(`/events/${eventId}/tickets/purchase`, paymentData);
    return response.data;
  },

  getMyTickets: async (): Promise<EventTicket[]> => {
    const response = await api.get('/events/my-tickets');
    return response.data;
  },

  verifyTicket: async (eventId: number, ticketNumber: string) => {
    const response = await api.post(`/events/${eventId}/tickets/verify`, {
      ticket_number: ticketNumber,
    });
    return response.data;
  },

  setReminder: async (
    eventId: number,
    reminderData: Partial<EventReminder>
  ): Promise<EventReminder> => {
    const response = await api.post(`/events/${eventId}/reminders`, reminderData);
    return response.data;
  },

  getReminders: async (): Promise<EventReminder[]> => {
    const response = await api.get('/events/reminders');
    return response.data;
  },

  deleteReminder: async (eventId: number, reminderId: number) => {
    await api.delete(`/events/${eventId}/reminders/${reminderId}`);
  },

  getNotificationPreferences: async (): Promise<ParentNotificationPreferences> => {
    const response = await api.get('/events/notification-preferences');
    return response.data;
  },

  updateNotificationPreferences: async (
    preferences: Partial<ParentNotificationPreferences>
  ): Promise<ParentNotificationPreferences> => {
    const response = await api.put('/events/notification-preferences', preferences);
    return response.data;
  },

  startRecording: async (eventId: number) => {
    const response = await api.post(`/events/${eventId}/recording/start`);
    return response.data;
  },

  stopRecording: async (eventId: number) => {
    const response = await api.post(`/events/${eventId}/recording/stop`);
    return response.data;
  },

  shareEvent: async (eventId: number, platform: string) => {
    const response = await api.post(`/events/${eventId}/share`, { platform });
    return response.data;
  },
};
