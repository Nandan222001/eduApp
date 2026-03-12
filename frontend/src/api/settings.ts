import axios from '@/lib/axios';
import type {
  UserProfile,
  UserProfileUpdate,
  PasswordChangeData,
  NotificationPreferences,
  ThemeSettings,
  PrivacySettings,
  UserSettings,
  ConnectedDevice,
  AccountDeletionRequest,
} from '@/types/settings';

export const settingsApi = {
  // Profile endpoints
  getProfile: async (): Promise<UserProfile> => {
    const response = await axios.get<UserProfile>('/api/profile/me');
    return response.data;
  },

  updateProfile: async (data: UserProfileUpdate): Promise<UserProfile> => {
    const response = await axios.put<UserProfile>('/api/profile/me', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<{ avatarUrl: string }>('/api/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await axios.delete('/api/profile/avatar');
  },

  // Password endpoints
  changePassword: async (data: PasswordChangeData): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/profile/change-password', data);
    return response.data;
  },

  // Notification preferences endpoints
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await axios.get<NotificationPreferences>('/api/settings/notifications');
    return response.data;
  },

  updateNotificationPreferences: async (
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> => {
    const response = await axios.put<NotificationPreferences>(
      '/api/settings/notifications',
      preferences
    );
    return response.data;
  },

  // Theme settings endpoints
  getThemeSettings: async (): Promise<ThemeSettings> => {
    const response = await axios.get<ThemeSettings>('/api/settings/theme');
    return response.data;
  },

  updateThemeSettings: async (settings: ThemeSettings): Promise<ThemeSettings> => {
    const response = await axios.put<ThemeSettings>('/api/settings/theme', settings);
    return response.data;
  },

  // Privacy settings endpoints
  getPrivacySettings: async (): Promise<PrivacySettings> => {
    const response = await axios.get<PrivacySettings>('/api/settings/privacy');
    return response.data;
  },

  updatePrivacySettings: async (settings: PrivacySettings): Promise<PrivacySettings> => {
    const response = await axios.put<PrivacySettings>('/api/settings/privacy', settings);
    return response.data;
  },

  // General settings endpoints
  getAllSettings: async (): Promise<UserSettings> => {
    const response = await axios.get<UserSettings>('/api/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await axios.put<UserSettings>('/api/settings', settings);
    return response.data;
  },

  // Connected devices endpoints
  getConnectedDevices: async (): Promise<ConnectedDevice[]> => {
    const response = await axios.get<ConnectedDevice[]>('/api/settings/devices');
    return response.data;
  },

  logoutDevice: async (deviceId: string): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(
      `/api/settings/devices/${deviceId}/logout`
    );
    return response.data;
  },

  logoutAllDevices: async (): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/settings/devices/logout-all');
    return response.data;
  },

  // Account deletion endpoints
  requestAccountDeletion: async (
    data: AccountDeletionRequest
  ): Promise<{ message: string; requestId: string }> => {
    const response = await axios.post<{ message: string; requestId: string }>(
      '/api/settings/delete-account',
      data
    );
    return response.data;
  },

  cancelAccountDeletion: async (): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/settings/cancel-deletion');
    return response.data;
  },
};
