import axios from '@/lib/axios';
import type {
  Announcement,
  AnnouncementCreate,
  AnnouncementUpdate,
  Message,
  MessageCreate,
  Notification,
  NotificationPreference,
  NotificationPreferenceUpdate,
  NotificationStats,
} from '@/types/communications';

export const communicationsApi = {
  // Announcements
  createAnnouncement: async (data: AnnouncementCreate): Promise<Announcement> => {
    const response = await axios.post<Announcement>('/api/v1/announcements/', data);
    return response.data;
  },

  getAnnouncements: async (
    isPublished?: boolean,
    skip = 0,
    limit = 50
  ): Promise<Announcement[]> => {
    const params = new URLSearchParams();
    if (isPublished !== undefined) params.append('is_published', String(isPublished));
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    const response = await axios.get<Announcement[]>(`/api/v1/announcements/?${params}`);
    return response.data;
  },

  getMyAnnouncements: async (skip = 0, limit = 50): Promise<Announcement[]> => {
    const response = await axios.get<Announcement[]>(
      `/api/v1/announcements/my-announcements?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  getAnnouncement: async (id: number): Promise<Announcement> => {
    const response = await axios.get<Announcement>(`/api/v1/announcements/${id}`);
    return response.data;
  },

  updateAnnouncement: async (id: number, data: AnnouncementUpdate): Promise<Announcement> => {
    const response = await axios.put<Announcement>(`/api/v1/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/announcements/${id}`);
  },

  publishAnnouncement: async (id: number): Promise<Announcement> => {
    const response = await axios.post<Announcement>(`/api/v1/announcements/${id}/publish`);
    return response.data;
  },

  // Messages
  sendMessage: async (data: MessageCreate): Promise<Message> => {
    const response = await axios.post<Message>('/api/v1/messages/', data);
    return response.data;
  },

  getInbox: async (skip = 0, limit = 50, unreadOnly = false): Promise<Message[]> => {
    const response = await axios.get<Message[]>(
      `/api/v1/messages/inbox?skip=${skip}&limit=${limit}&unread_only=${unreadOnly}`
    );
    return response.data;
  },

  getSentMessages: async (skip = 0, limit = 50): Promise<Message[]> => {
    const response = await axios.get<Message[]>(
      `/api/v1/messages/sent?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await axios.get<{ unread_count: number }>('/api/v1/messages/unread-count');
    return response.data.unread_count;
  },

  getConversation: async (otherUserId: number, skip = 0, limit = 50): Promise<Message[]> => {
    const response = await axios.get<Message[]>(
      `/api/v1/messages/conversation/${otherUserId}?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  getMessage: async (id: number): Promise<Message> => {
    const response = await axios.get<Message>(`/api/v1/messages/${id}`);
    return response.data;
  },

  getMessageThread: async (id: number): Promise<Message[]> => {
    const response = await axios.get<Message[]>(`/api/v1/messages/${id}/thread`);
    return response.data;
  },

  markMessageRead: async (id: number): Promise<Message> => {
    const response = await axios.patch<Message>(`/api/v1/messages/${id}/read`);
    return response.data;
  },

  markAllMessagesRead: async (): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/v1/messages/mark-all-read');
    return response.data;
  },

  deleteMessage: async (id: number, permanent = false): Promise<void> => {
    await axios.delete(`/api/v1/messages/${id}?permanent=${permanent}`);
  },

  searchMessages: async (query: string, skip = 0, limit = 50): Promise<Message[]> => {
    const response = await axios.get<Message[]>(
      `/api/v1/messages/search/?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  // Notifications
  getNotifications: async (
    status?: string,
    channel?: string,
    skip = 0,
    limit = 50
  ): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (channel) params.append('channel', channel);
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    const response = await axios.get<Notification[]>(`/api/v1/notifications/?${params}`);
    return response.data;
  },

  getNotificationStats: async (): Promise<NotificationStats> => {
    const response = await axios.get<NotificationStats>('/api/v1/notifications/stats');
    return response.data;
  },

  getNotification: async (id: number): Promise<Notification> => {
    const response = await axios.get<Notification>(`/api/v1/notifications/${id}`);
    return response.data;
  },

  markNotificationRead: async (id: number): Promise<Notification> => {
    const response = await axios.patch<Notification>(`/api/v1/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/v1/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/notifications/${id}`);
  },

  // Notification Preferences
  getNotificationPreferences: async (): Promise<NotificationPreference> => {
    const response = await axios.get<NotificationPreference>(
      '/api/v1/notifications/preferences/me'
    );
    return response.data;
  },

  updateNotificationPreferences: async (
    data: NotificationPreferenceUpdate
  ): Promise<NotificationPreference> => {
    const response = await axios.put<NotificationPreference>(
      '/api/v1/notifications/preferences/me',
      data
    );
    return response.data;
  },
};
