import axios from '@/lib/axios';
import type {
  LoginCredentials,
  LoginWithOTPCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
  OTPResponse,
  RefreshTokenResponse,
  AuthUser,
} from '@/types/auth';
import {
  DEMO_CREDENTIALS,
  demoAuthResponse,
  TEACHER_CREDENTIALS,
  teacherAuthResponse,
  PARENT_CREDENTIALS,
  parentAuthResponse,
  ADMIN_CREDENTIALS,
  adminAuthResponse,
  SUPERADMIN_CREDENTIALS,
  superadminAuthResponse,
} from '@/data/dummyData';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (
      credentials.email === DEMO_CREDENTIALS.email &&
      credentials.password === DEMO_CREDENTIALS.password
    ) {
      return demoAuthResponse;
    }
    if (
      credentials.email === TEACHER_CREDENTIALS.email &&
      credentials.password === TEACHER_CREDENTIALS.password
    ) {
      return teacherAuthResponse;
    }
    if (
      credentials.email === PARENT_CREDENTIALS.email &&
      credentials.password === PARENT_CREDENTIALS.password
    ) {
      return parentAuthResponse;
    }
    if (
      credentials.email === ADMIN_CREDENTIALS.email &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      return adminAuthResponse;
    }
    if (
      credentials.email === SUPERADMIN_CREDENTIALS.email &&
      credentials.password === SUPERADMIN_CREDENTIALS.password
    ) {
      return superadminAuthResponse;
    }
    const response = await axios.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  loginWithOTP: async (credentials: LoginWithOTPCredentials): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>('/api/auth/login/otp', credentials);
    return response.data;
  },

  requestOTP: async (email: string): Promise<OTPResponse> => {
    const response = await axios.post<OTPResponse>('/api/auth/otp/request', { email });
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axios.post('/api/auth/logout');
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/auth/reset-password', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await axios.post<RefreshTokenResponse>('/api/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await axios.get<AuthUser>('/api/auth/me');
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/auth/verify-email', { token });
    return response.data;
  },

  resendVerificationEmail: async (): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/api/auth/resend-verification');
    return response.data;
  },
};
