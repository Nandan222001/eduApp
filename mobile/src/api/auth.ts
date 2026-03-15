import { apiClient } from './client';
import { User } from '@types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const authApi = {
  login: async (credentials: LoginRequest) => {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  register: async (data: RegisterRequest) => {
    return apiClient.post<User>('/auth/register', data);
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  refreshToken: async () => {
    return apiClient.post<LoginResponse>('/auth/refresh');
  },

  getCurrentUser: async () => {
    return apiClient.get<User>('/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string) => {
    return apiClient.post('/auth/reset-password', { token, password });
  },
};
