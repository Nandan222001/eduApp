import axios from '@/lib/axios';

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
  availability_slots: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface TutorReview {
  id: string;
  student_name: string;
  student_photo_url?: string;
  rating: number;
  comment: string;
  session_date: string;
  created_at: string;
  helpful_count: number;
}

export interface TutorProfile extends Tutor {
  reviews: TutorReview[];
  response_time: string;
  acceptance_rate: number;
  total_earnings?: number;
  preferred_teaching_style: string;
  certifications: Certification[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  credential_url?: string;
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
  whiteboard_data?: string;
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

export interface BookingRequest {
  tutor_id: string;
  subject: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_platform: 'zoom' | 'google_meet';
  special_requirements?: string;
}

export interface TutorStats {
  total_sessions: number;
  total_hours: number;
  total_earnings?: number;
  average_rating: number;
  total_reviews: number;
  upcoming_sessions: number;
  completed_this_month: number;
  earnings_this_month?: number;
  student_retention_rate: number;
  cancellation_rate: number;
}

export interface UpcomingSession {
  id: string;
  student_name: string;
  student_photo_url?: string;
  subject: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  meeting_platform: string;
}

export interface TutorPerformanceMetrics {
  sessions_by_subject: { subject: string; count: number }[];
  ratings_over_time: { date: string; rating: number }[];
  earnings_over_time?: { date: string; amount: number }[];
  peak_hours: { hour: number; sessions: number }[];
  student_satisfaction: {
    knowledge: number;
    communication: number;
    punctuality: number;
    overall: number;
  };
}

export interface LearningHistorySession {
  id: string;
  tutor_name: string;
  tutor_photo_url?: string;
  subject: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  rating?: number;
  feedback_given: boolean;
  materials_shared: string[];
  recording_url?: string;
  session_notes?: string;
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

export interface SearchFilters {
  subjects?: string[];
  min_rating?: number;
  max_hourly_rate?: number;
  availability?: string;
  languages?: string[];
}

const peerTutoringApi = {
  getTutors: async (filters?: SearchFilters): Promise<Tutor[]> => {
    const response = await axios.get('/api/peer-tutoring/tutors', { params: filters });
    return response.data;
  },

  getTutorProfile: async (tutorId: string): Promise<TutorProfile> => {
    const response = await axios.get(`/api/peer-tutoring/tutors/${tutorId}`);
    return response.data;
  },

  bookSession: async (booking: BookingRequest): Promise<TutoringSession> => {
    const response = await axios.post('/api/peer-tutoring/sessions', booking);
    return response.data;
  },

  getSession: async (sessionId: string): Promise<TutoringSession> => {
    const response = await axios.get(`/api/peer-tutoring/sessions/${sessionId}`);
    return response.data;
  },

  updateSession: async (
    sessionId: string,
    updates: Partial<TutoringSession>
  ): Promise<TutoringSession> => {
    const response = await axios.patch(`/api/peer-tutoring/sessions/${sessionId}`, updates);
    return response.data;
  },

  startSession: async (sessionId: string): Promise<TutoringSession> => {
    const response = await axios.post(`/api/peer-tutoring/sessions/${sessionId}/start`);
    return response.data;
  },

  endSession: async (sessionId: string, notes?: string): Promise<TutoringSession> => {
    const response = await axios.post(`/api/peer-tutoring/sessions/${sessionId}/end`, { notes });
    return response.data;
  },

  submitFeedback: async (
    sessionId: string,
    feedback: Omit<SessionFeedback, 'id' | 'session_id' | 'created_at'>
  ): Promise<SessionFeedback> => {
    const response = await axios.post(
      `/api/peer-tutoring/sessions/${sessionId}/feedback`,
      feedback
    );
    return response.data;
  },

  getTutorStats: async (): Promise<TutorStats> => {
    const response = await axios.get('/api/peer-tutoring/tutor/stats');
    return response.data;
  },

  getTutorUpcomingSessions: async (): Promise<UpcomingSession[]> => {
    const response = await axios.get('/api/peer-tutoring/tutor/sessions/upcoming');
    return response.data;
  },

  getTutorPerformanceMetrics: async (): Promise<TutorPerformanceMetrics> => {
    const response = await axios.get('/api/peer-tutoring/tutor/performance');
    return response.data;
  },

  getStudentSessions: async (status?: string): Promise<LearningHistorySession[]> => {
    const response = await axios.get('/api/peer-tutoring/student/sessions', { params: { status } });
    return response.data;
  },

  getStudentLearningProgress: async (): Promise<LearningProgress[]> => {
    const response = await axios.get('/api/peer-tutoring/student/progress');
    return response.data;
  },

  generateMeetingLink: async (sessionId: string, platform: string): Promise<string> => {
    const response = await axios.post(`/api/peer-tutoring/sessions/${sessionId}/meeting-link`, {
      platform,
    });
    return response.data.meeting_link;
  },

  saveWhiteboardData: async (sessionId: string, data: string): Promise<void> => {
    await axios.post(`/api/peer-tutoring/sessions/${sessionId}/whiteboard`, { data });
  },

  getWhiteboardData: async (sessionId: string): Promise<string> => {
    const response = await axios.get(`/api/peer-tutoring/sessions/${sessionId}/whiteboard`);
    return response.data.data;
  },

  updateTutorAvailability: async (slots: AvailabilitySlot[]): Promise<void> => {
    await axios.put('/api/peer-tutoring/tutor/availability', { slots });
  },

  getTutorAvailability: async (tutorId: string, date?: string): Promise<AvailabilitySlot[]> => {
    const response = await axios.get(`/api/peer-tutoring/tutors/${tutorId}/availability`, {
      params: { date },
    });
    return response.data;
  },
};

export { peerTutoringApi };
