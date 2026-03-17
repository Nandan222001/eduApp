export interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  subjects?: string[];
  specialization?: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  admission_number?: string;
  grade_name?: string;
  section_name?: string;
  photo_url?: string;
}

export interface ChildBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  admission_number?: string;
  grade_name?: string;
  section_name?: string;
  photo_url?: string;
}

export interface ConferenceSlot {
  id: string;
  teacher_id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
  is_booked?: boolean;
  booking_id?: number;
}

export interface ConferenceTopic {
  id: string;
  label: string;
  value: string;
}

export interface ConferenceBooking {
  id: number;
  parent_id: number;
  student_id: number;
  teacher_id: number;
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  topics: string[];
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  meeting_url?: string;
  notes?: string;
  parent_feedback?: string;
  parent_rating?: number;
  created_at: string;
  updated_at: string;
  student?: Student;
  teacher?: Teacher;
}

export interface ConferenceAvailability {
  teacher_id: number;
  date: string;
  slots: ConferenceSlot[];
}

export interface ConferenceRequest {
  student_id: number;
  teacher_id: number;
  slot_id: string;
  topics: string[];
  special_requests?: string;
}

export interface UpcomingConference extends ConferenceBooking {
  time_until_start_minutes?: number;
  can_join_meeting?: boolean;
}

export interface PastConference extends ConferenceBooking {
  teacher_notes?: string;
  has_feedback?: boolean;
}

export interface ConferenceDashboardData {
  upcoming_conferences: UpcomingConference[];
  past_conferences: PastConference[];
  pending_requests: ConferenceBooking[];
}

export interface TeacherConferenceData {
  availability: ConferenceAvailability[];
  pending_requests: ConferenceBooking[];
  upcoming_conferences: ConferenceBooking[];
  past_conferences: PastConference[];
  statistics: {
    total_conferences: number;
    this_month: number;
    average_rating: number;
    pending_requests: number;
  };
}

export const CONFERENCE_TOPICS: ConferenceTopic[] = [
  { id: 'academic', label: 'Academic Performance', value: 'academic_performance' },
  { id: 'behavior', label: 'Behavior', value: 'behavior' },
  { id: 'social', label: 'Social Development', value: 'social_development' },
  { id: 'homework', label: 'Homework Concerns', value: 'homework_concerns' },
  { id: 'college', label: 'College Planning', value: 'college_planning' },
];
