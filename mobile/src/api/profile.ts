import { apiClient } from './client';
import { Profile } from '../types/student';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfilePhotoResponse {
  profilePhoto: string;
}

export const profileApi = {
  getProfile: async () => {
    return apiClient.get<Profile>('/api/v1/profile');
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    return apiClient.put<Profile>('/api/v1/profile', data);
  },

  uploadProfilePhoto: async (photoUri: string) => {
    const formData = new FormData();
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type,
    } as any);

    return apiClient.post<ProfilePhotoResponse>('/api/v1/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  changePassword: async (data: ChangePasswordRequest) => {
    return apiClient.post('/api/v1/auth/change-password', {
      current_password: data.currentPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    });
  },
};
