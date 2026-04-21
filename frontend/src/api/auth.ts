import axios from '@/lib/axios';
import type {
  UserRole,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUser(u: any): AuthUser {
  return {
    id: String(u.id ?? ''),
    email: u.email ?? '',
    firstName: u.first_name ?? '',
    lastName: u.last_name ?? '',
    fullName: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
    role: (u.role_slug ?? u.role?.slug ?? 'student') as UserRole,
    isActive: u.is_active ?? true,
    isSuperuser: u.is_superuser ?? false,
    emailVerified: u.email_verified ?? false,
    institution_id: u.institution_id,
    createdAt: u.created_at ?? '',
    updatedAt: u.updated_at ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAuthResponse(data: any): AuthResponse {
  return {
    user: normalizeUser(data.user ?? {}),
    tokens: {
      accessToken: data.access_token ?? '',
      refreshToken: data.refresh_token ?? '',
      tokenType: data.token_type ?? 'bearer',
      expiresIn: data.expires_in ?? 3600,
    },
  };
}
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
    const response = await axios.post('/api/auth/login', credentials);
    return normalizeAuthResponse(response.data);
  },

  loginWithOTP: async (credentials: LoginWithOTPCredentials): Promise<AuthResponse> => {
    const response = await axios.post('/api/auth/login/otp', credentials);
    return normalizeAuthResponse(response.data);
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
      refresh_token: refreshToken,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await axios.get('/api/auth/me');
    return normalizeUser(response.data);
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
