import { apiClient } from './client';
import { User } from '@types';

export interface LoginRequest {
  email: string;
  password: string;
  otp?: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface RequestOTPRequest {
  email: string;
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

  refreshToken: async (refreshToken: string) => {
    return apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  },

  getCurrentUser: async () => {
    return apiClient.get<User>('/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    return apiClient.post('/auth/reset-password', data);
  },

  requestOTP: async (email: string) => {
    return apiClient.post('/auth/request-otp', { email });
  },

  verifyOTP: async (data: VerifyOTPRequest) => {
    return apiClient.post('/auth/verify-otp', data);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};
