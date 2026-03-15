export interface Event {
  id: number;
  institution_id: number;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location?: string;
  venue?: string;
  organizer?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  max_participants?: number;
  registration_required: boolean;
  registration_deadline?: string;
  is_public: boolean;
  allow_guests: boolean;
  status: string;
  banner_image_url?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface EventWithDetails extends Event {
  rsvp_count: number;
  accepted_count: number;
  declined_count: number;
  photo_count: number;
}

export interface EventRSVP {
  id: number;
  event_id: number;
  user_id: number;
  status: string;
  response_date?: string;
  number_of_guests: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRSVPWithUser extends EventRSVP {
  user_name: string;
  user_email?: string;
}

export interface EventPhoto {
  id: number;
  event_id: number;
  title?: string;
  description?: string;
  photo_url: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: number;
  uploaded_at: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCalendarItem {
  id: number;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: string;
}

export interface LiveEvent extends Event {
  is_live: boolean;
  stream_url?: string;
  hls_url?: string;
  rtmp_url?: string;
  viewer_count?: number;
  stream_health?: StreamHealth;
  camera_angles?: CameraAngle[];
  recording_url?: string;
  is_ticketed?: boolean;
  ticket_price?: number;
  requires_purchase?: boolean;
  related_documents?: EventDocument[];
}

export interface StreamHealth {
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  bitrate: number;
  dropped_frames: number;
  fps: number;
  latency: number;
  last_updated: string;
}

export interface CameraAngle {
  id: string;
  name: string;
  stream_url: string;
  thumbnail_url?: string;
  is_active: boolean;
}

export interface EventDocument {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface ChatMessage {
  id: string;
  event_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  message: string;
  message_type: 'text' | 'emoji' | 'system';
  timestamp: string;
  is_moderated?: boolean;
}

export interface EmojiReaction {
  emoji: string;
  count: number;
  users: number[];
}

export interface EventTicket {
  id: number;
  event_id: number;
  user_id: number;
  purchase_date: string;
  amount_paid: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  ticket_number: string;
}

export interface EventReminder {
  id: number;
  event_id: number;
  user_id: number;
  reminder_type: 'email' | 'sms' | 'push' | 'all';
  reminder_time: string;
  is_sent: boolean;
  created_at: string;
}

export interface ParentNotificationPreferences {
  id: number;
  user_id: number;
  event_reminders_enabled: boolean;
  reminder_methods: ('email' | 'sms' | 'push')[];
  reminder_hours_before: number[];
  notify_live_start: boolean;
  notify_recordings_available: boolean;
  notify_event_updates: boolean;
  updated_at: string;
}

export interface ViewerAnalytics {
  total_viewers: number;
  peak_viewers: number;
  average_watch_time: number;
  unique_viewers: number;
  viewer_locations: Record<string, number>;
  device_breakdown: Record<string, number>;
  engagement_rate: number;
}
