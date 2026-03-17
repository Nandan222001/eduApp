import { apiClient } from './client';

export interface BiometricSetupRequest {
  enabled: boolean;
  biometric_type: string;
  device_id?: number;
  device_fingerprint?: string;
}

export interface BiometricSetupResponse {
  success: boolean;
  enabled: boolean;
  biometric_type?: string;
  message: string;
}

export interface DeviceRegistrationRequest {
  device_name: string;
  device_type: string;
  device_fingerprint: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
}

export interface DeviceRegistrationResponse {
  device_id: number;
  is_new: boolean;
  is_trusted: boolean;
  message: string;
}

export interface PinSetupRequest {
  pin: string;
  enabled: boolean;
  device_id?: number;
  device_fingerprint?: string;
}

export interface PinVerifyRequest {
  pin: string;
  device_id?: number;
}

export interface SecuritySettingsRequest {
  session_timeout_minutes?: number;
  auto_lock_minutes?: number;
  require_biometric_for_sensitive?: boolean;
}

export interface SecuritySettingsResponse {
  biometric_enabled: boolean;
  pin_enabled: boolean;
  session_timeout_minutes: number;
  auto_lock_minutes: number;
  require_biometric_for_sensitive: boolean;
}

export interface SensitiveOperationRequest {
  operation_type: string;
  operation_details?: string;
  auth_method: string;
  auth_success: boolean;
  device_id?: number;
  metadata?: Record<string, any>;
}

export interface UserDevice {
  id: number;
  device_name: string;
  device_type: string;
  device_model?: string;
  os_version?: string;
  last_active: string;
  is_current: boolean;
  is_trusted: boolean;
  biometric_enabled: boolean;
  biometric_type?: string;
  created_at: string;
}

export interface AuthEvent {
  id: number;
  event_type: string;
  auth_method: string;
  success: boolean;
  failure_reason?: string;
  device_fingerprint?: string;
  ip_address?: string;
  location?: string;
  created_at: string;
}

export const mobileAuthApi = {
  setupBiometric: async (data: BiometricSetupRequest) => {
    return apiClient.post<BiometricSetupResponse>('/mobile-auth/biometric/setup', data);
  },

  registerDevice: async (data: DeviceRegistrationRequest) => {
    return apiClient.post<DeviceRegistrationResponse>('/mobile-auth/device/register', data);
  },

  setupPin: async (data: PinSetupRequest) => {
    return apiClient.post('/mobile-auth/pin/setup', data);
  },

  verifyPin: async (data: PinVerifyRequest) => {
    return apiClient.post('/mobile-auth/pin/verify', data);
  },

  updateSecuritySettings: async (data: SecuritySettingsRequest) => {
    return apiClient.put<SecuritySettingsResponse>('/mobile-auth/security-settings', data);
  },

  getSecuritySettings: async () => {
    return apiClient.get<SecuritySettingsResponse>('/mobile-auth/security-settings');
  },

  logSensitiveOperation: async (data: SensitiveOperationRequest) => {
    return apiClient.post('/mobile-auth/sensitive-operation/verify', data);
  },

  getUserDevices: async () => {
    return apiClient.get<UserDevice[]>('/mobile-auth/devices');
  },

  removeDevice: async (deviceId: number) => {
    return apiClient.delete(`/mobile-auth/devices/${deviceId}`);
  },

  trustDevice: async (deviceId: number) => {
    return apiClient.post(`/mobile-auth/devices/${deviceId}/trust`);
  },

  getAuthEvents: async (limit: number = 50) => {
    return apiClient.get<AuthEvent[]>(`/mobile-auth/auth-events?limit=${limit}`);
  },
};
