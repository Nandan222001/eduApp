export interface StudyGroup {
  id: number;
  institution_id: number;
  name: string;
  description?: string;
  subject_id?: number;
  chapter_id?: number;
  avatar_url?: string;
  cover_image_url?: string;
  is_public: boolean;
  max_members?: number;
  created_by: number;
  member_count: number;
  resource_count: number;
  created_at: string;
  updated_at: string;
  subject_name?: string;
  chapter_name?: string;
  creator_name?: string;
  is_member?: boolean;
  role?: GroupMemberRole;
}

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface GroupMember {
  id: number;
  institution_id: number;
  group_id: number;
  user_id: number;
  role: GroupMemberRole;
  joined_at: string;
  last_active_at?: string;
  user_name?: string;
  user_avatar?: string;
  user_email?: string;
}

export interface GroupMessage {
  id: number;
  institution_id: number;
  group_id: number;
  user_id: number;
  content: string;
  message_type: MessageType;
  attachments?: string[];
  is_pinned: boolean;
  reply_to_id?: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  reply_to_message?: GroupMessage;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  LINK = 'link',
  ANNOUNCEMENT = 'announcement',
}

export interface GroupResource {
  id: number;
  institution_id: number;
  group_id: number;
  uploaded_by: number;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  download_count: number;
  created_at: string;
  updated_at: string;
  uploader_name?: string;
}

export interface GroupActivity {
  id: number;
  institution_id: number;
  group_id: number;
  user_id: number;
  activity_type: ActivityType;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export enum ActivityType {
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_PROMOTED = 'member_promoted',
  MESSAGE_SENT = 'message_sent',
  RESOURCE_UPLOADED = 'resource_uploaded',
  GROUP_UPDATED = 'group_updated',
}

export interface GroupInvite {
  id: number;
  institution_id: number;
  group_id: number;
  invited_by: number;
  invited_user_id?: number;
  invite_token: string;
  expires_at?: string;
  status: InviteStatus;
  created_at: string;
  group_name?: string;
  inviter_name?: string;
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export interface GroupSearchFilters {
  query?: string;
  subject_id?: number;
  is_public?: boolean;
  my_groups?: boolean;
  page?: number;
  page_size?: number;
}

export interface GroupStats {
  total_groups: number;
  my_groups: number;
  total_members: number;
  total_messages: number;
  active_today: number;
}
