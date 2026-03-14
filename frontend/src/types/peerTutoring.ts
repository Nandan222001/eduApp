export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at: string;
}

export interface Tutor {
  id: string;
  name: string;
  photo_url?: string;
  grade: string;
  subjects: string[];
  bio?: string;
  rating: number;
  total_reviews: number;
  sessions_completed: number;
  success_rate: number;
  hourly_rate?: number;
  is_available: boolean;
  is_verified: boolean;
  achievement_badges: AchievementBadge[];
  expertise_areas: string[];
  languages: string[];
  timezone: string;
}

export interface TutoringSession {
  id: string;
  tutor_id: string;
  student_id: string;
  tutor_name: string;
  student_name: string;
  subject: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meeting_link?: string;
  meeting_platform: 'zoom' | 'google_meet';
  session_notes?: string;
  materials_shared: string[];
  recording_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionFeedback {
  id: string;
  session_id: string;
  rating: number;
  comment: string;
  was_helpful: boolean;
  tutor_knowledge: number;
  communication_skills: number;
  punctuality: number;
  would_recommend: boolean;
  created_at: string;
}

export interface LearningProgress {
  subject: string;
  total_sessions: number;
  total_hours: number;
  average_rating: number;
  topics_covered: string[];
  improvement_score: number;
  last_session_date: string;
}
