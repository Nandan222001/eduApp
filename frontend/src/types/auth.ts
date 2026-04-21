export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginWithOTPCredentials {
  email: string;
  otp: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  isSuperuser: boolean;
  institution_id?: number;
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | 'admin'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'institution_admin'
  | 'superadmin'
  | 'super_admin'
  | 'tutor';

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface OTPResponse {
  message: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}
