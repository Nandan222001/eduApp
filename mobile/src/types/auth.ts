export interface LoginRequest {
  email: string;
  password: string;
  institution_id?: number;
}

export interface OTPLoginRequest {
  email: string;
  institution_id?: number;
}

export interface OTPVerifyRequest {
  email: string;
  otp: string;
  institution_id?: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RoleInfo {
  id: number;
  name: string;
  slug: string;
}

export interface InstitutionInfo {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  institution_id: number;
  role_id: number;
  is_active: boolean;
  is_superuser: boolean;
  email_verified: boolean;
  last_login?: string;
  permissions: string[];
  role?: RoleInfo;
  institution?: InstitutionInfo;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  activeRole: string | null;
  availableRoles: string[];
}

export interface BiometricConfig {
  enabled: boolean;
  type?: 'fingerprint' | 'facial' | 'iris';
}
