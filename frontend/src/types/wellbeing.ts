export interface MoodEntry {
  id?: number;
  student_id: number;
  institution_id: number;
  mood_rating: number;
  mood_emoji: string;
  journal_entry?: string;
  date: string;
  created_at?: string;
}

export interface WeeklySurveyResponse {
  id?: number;
  student_id: number;
  institution_id: number;
  survey_type: 'PHQ-9' | 'GAD-7' | 'general';
  responses: Record<string, number>;
  total_score: number;
  severity_level: string;
  week_start_date: string;
  completed_at?: string;
}

export interface PHQ9Response {
  little_interest: number;
  feeling_down: number;
  sleep_problems: number;
  feeling_tired: number;
  appetite_changes: number;
  feeling_bad: number;
  concentration_problems: number;
  moving_slowly: number;
  self_harm_thoughts: number;
}

export interface GAD7Response {
  feeling_nervous: number;
  cant_stop_worrying: number;
  worrying_too_much: number;
  trouble_relaxing: number;
  restless: number;
  irritable: number;
  feeling_afraid: number;
}

export interface AnonymousReport {
  id?: number;
  institution_id: number;
  report_type: 'bullying' | 'safety' | 'harassment' | 'other';
  description: string;
  location?: string;
  date_of_incident?: string;
  witnesses?: string;
  status: 'pending' | 'investigating' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
  updated_at?: string;
}

export interface WellbeingAlert {
  id: number;
  institution_id: number;
  student_id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  title: string;
  description: string;
  risk_score: number;
  detected_indicators: Record<string, unknown>;
  recommended_actions: string[];
  metadata?: Record<string, unknown>;
  assigned_counselor_id?: number;
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved_by?: number;
  resolved_at?: string;
  resolution_notes?: string;
  parent_notified: boolean;
  parent_notified_at?: string;
  auto_detected: boolean;
  detected_at: string;
  created_at: string;
  updated_at: string;
  student?: StudentBasicInfo;
}

export interface StudentBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  photo_url?: string;
  email?: string;
}

export interface CommunicationRecord {
  id?: number;
  alert_id?: number;
  student_id: number;
  counselor_id: number;
  communication_type: 'note' | 'meeting' | 'call' | 'email' | 'message';
  subject?: string;
  content: string;
  is_confidential: boolean;
  created_at?: string;
  created_by?: number;
}

export interface Intervention {
  id?: number;
  alert_id: number;
  institution_id: number;
  student_id: number;
  counselor_id: number;
  intervention_type: string;
  description: string;
  action_taken: string;
  scheduled_at?: string;
  completed_at?: string;
  outcome?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParentNotification {
  id?: number;
  alert_id: number;
  student_id: number;
  parent_id?: number;
  notification_type: 'email' | 'sms' | 'call' | 'meeting';
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  message: string;
  sent_at?: string;
  acknowledged: boolean;
  acknowledged_at?: string;
}

export interface MentalHealthResource {
  id?: number;
  institution_id?: number;
  name: string;
  type: 'counselor' | 'clinic' | 'hotline' | 'online' | 'support_group' | 'emergency';
  description: string;
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  specializations?: string[];
  availability?: string;
  age_group?: string;
  cost?: string;
  is_emergency: boolean;
  is_active: boolean;
}

export interface Referral {
  id?: number;
  alert_id?: number;
  student_id: number;
  institution_id: number;
  resource_id: number;
  counselor_id: number;
  referral_reason: string;
  referral_notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status:
    | 'pending'
    | 'contacted'
    | 'appointment_scheduled'
    | 'in_progress'
    | 'completed'
    | 'cancelled';
  referred_at: string;
  appointment_date?: string;
  outcome?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  resource?: MentalHealthResource;
}

export interface StudentWellbeingProfile {
  id: number;
  institution_id: number;
  student_id: number;
  current_risk_level: 'low' | 'medium' | 'high' | 'critical';
  overall_risk_score: number;
  sentiment_trend: number;
  attendance_trend: number;
  grade_trend: number;
  participation_trend: number;
  social_trend: number;
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  last_intervention_date?: string;
  last_assessment_date?: string;
  next_review_date?: string;
  additional_info?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CounselorDashboardStats {
  total_students_monitored: number;
  active_alerts_count: number;
  critical_alerts_count: number;
  high_risk_students: number;
  medium_risk_students: number;
  pending_interventions: number;
  overdue_reviews: number;
}

export interface AlertNote {
  id: number;
  alert_id: number;
  created_by: number;
  content: string;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
}
