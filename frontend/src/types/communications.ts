export type AudienceType = 'all' | 'grade' | 'section' | 'class' | 'individual' | 'role';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';
export type NotificationType =
  | 'assignment'
  | 'attendance'
  | 'message'
  | 'announcement'
  | 'exam'
  | 'grade'
  | 'system';

export interface Announcement {
  id: number;
  institution_id: number;
  created_by: number;
  title: string;
  content: string;
  audience_type: AudienceType;
  audience_filter?: {
    grade_ids?: number[];
    section_ids?: number[];
    user_ids?: number[];
    role_ids?: number[];
  };
  priority: NotificationPriority;
  channels: NotificationChannel[];
  scheduled_at?: string;
  expires_at?: string;
  is_published: boolean;
  published_at?: string;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  audience_type: AudienceType;
  audience_filter?: {
    grade_ids?: number[];
    section_ids?: number[];
    user_ids?: number[];
    role_ids?: number[];
  };
  priority?: NotificationPriority;
  channels: NotificationChannel[];
  scheduled_at?: string;
  expires_at?: string;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

export interface AnnouncementUpdate {
  title?: string;
  content?: string;
  audience_type?: AudienceType;
  audience_filter?: {
    grade_ids?: number[];
    section_ids?: number[];
    user_ids?: number[];
    role_ids?: number[];
  };
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduled_at?: string;
  expires_at?: string;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

export interface AnnouncementReadStatus {
  announcement_id: number;
  is_read: boolean;
  read_at?: string;
}

export interface Message {
  id: number;
  institution_id: number;
  sender_id: number;
  recipient_id: number;
  parent_id?: number;
  subject?: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  is_deleted_by_sender: boolean;
  is_deleted_by_recipient: boolean;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  recipient?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface MessageCreate {
  recipient_id: number;
  subject?: string;
  content: string;
  parent_id?: number;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

export interface Conversation {
  other_user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  last_message: Message;
  unread_count: number;
}

export interface Notification {
  id: number;
  institution_id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  status: NotificationStatus;
  data?: Record<string, unknown>;
  read_at?: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  notification_types?: Record<NotificationType, boolean>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  notification_types?: Record<NotificationType, boolean>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_channel: Record<NotificationChannel, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface NotificationGroup {
  type: NotificationType;
  count: number;
  notifications: Notification[];
  unread_count: number;
}
