export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: string;
  institution_id?: number;
  timezone?: string;
  language?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationChannel {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface NotificationPreference {
  type: string;
  label: string;
  channels: NotificationChannel;
}

export interface NotificationPreferences {
  assignment_created: NotificationChannel;
  assignment_graded: NotificationChannel;
  exam_scheduled: NotificationChannel;
  exam_result_published: NotificationChannel;
  announcement_posted: NotificationChannel;
  message_received: NotificationChannel;
  goal_achieved: NotificationChannel;
  badge_earned: NotificationChannel;
  attendance_marked: NotificationChannel;
  fee_due: NotificationChannel;
  material_shared: NotificationChannel;
  doubt_answered: NotificationChannel;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeSettings {
  mode: ThemeMode;
  primaryColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  compactMode?: boolean;
}

export interface PrivacySettings {
  profilePublic: boolean;
  showInLeaderboard: boolean;
  showEmail: boolean;
  showPhone: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
}

export interface ConnectedDevice {
  id: string;
  deviceName: string;
  deviceType: 'web' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  ipAddress: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserSettings {
  notifications: NotificationPreferences;
  theme: ThemeSettings;
  privacy: PrivacySettings;
  language: string;
  timezone: string;
}

export interface AccountDeletionRequest {
  reason: string;
  feedback?: string;
  password: string;
}

export interface PhotoCropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
  rotate?: number;
}
