import { apiClient } from './client';
import {
  LoginRequest,
  OTPLoginRequest,
  OTPVerifyRequest,
  TokenResponse,
  RefreshTokenRequest,
  User,
} from '../types/auth';
import { demoStudentUser, demoParentUser } from '../data/dummyData';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    if (credentials.email === demoStudentUser.email && credentials.password === demoStudentUser.password) {
      return {
        access_token: 'demo_student_access_token_' + Date.now(),
        refresh_token: 'demo_student_refresh_token_' + Date.now(),
        token_type: 'Bearer',
      };
    }

    if (credentials.email === demoParentUser.email && credentials.password === demoParentUser.password) {
      return {
        access_token: 'demo_parent_access_token_' + Date.now(),
        refresh_token: 'demo_parent_refresh_token_' + Date.now(),
        token_type: 'Bearer',
      };
    }

    return apiClient.post<TokenResponse>('/auth/login', credentials);
  },

  logout: async (refreshToken?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/logout', { refresh_token: refreshToken });
  },

  logoutAll: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/logout-all');
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>('/auth/refresh', data);
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  requestOTP: async (data: OTPLoginRequest): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/otp/request', data);
  },

  verifyOTP: async (data: OTPVerifyRequest): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>('/auth/otp/verify', data);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};
