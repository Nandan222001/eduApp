export interface College {
  id: number;
  name: string;
  location: string;
  city: string;
  state: string;
  country: string;
  website?: string;
  type: 'public' | 'private' | 'community';
  size: 'small' | 'medium' | 'large';
  acceptance_rate: number;
  application_fee: number;
  tuition_in_state?: number;
  tuition_out_state?: number;
  tuition_international?: number;
  room_board?: number;
  ranking_national?: number;
  ranking_world?: number;
  sat_avg?: number;
  act_avg?: number;
  gpa_avg?: number;
  founded_year?: number;
  student_faculty_ratio?: number;
  graduation_rate?: number;
  employment_rate?: number;
  endowment?: number;
  application_deadline?: string;
  decision_notification?: string;
  majors: string[];
  notable_programs: string[];
  campus_setting: 'urban' | 'suburban' | 'rural';
  housing_guaranteed?: boolean;
  religious_affiliation?: string;
  sports_division?: string;
  logo_url?: string;
  image_url?: string;
}

export interface CollegeVisit {
  id: number;
  student_id: number;
  college_id: number;
  visit_date: string;
  visit_type: 'in-person' | 'virtual' | 'self-guided';
  duration_hours?: number;
  rating: number;
  campus_rating?: number;
  facilities_rating?: number;
  academics_rating?: number;
  atmosphere_rating?: number;
  notes: string;
  highlights: string[];
  concerns: string[];
  photos: VisitPhoto[];
  tour_guide_name?: string;
  attended_info_session: boolean;
  met_with_department?: string;
  college?: College;
  created_at: string;
  updated_at: string;
}

export interface VisitPhoto {
  id: number;
  visit_id: number;
  url: string;
  caption?: string;
  uploaded_at: string;
}

export interface CollegeApplication {
  id: number;
  student_id: number;
  college_id: number;
  application_type: 'early-decision' | 'early-action' | 'regular' | 'rolling';
  status:
    | 'planning'
    | 'in-progress'
    | 'submitted'
    | 'under-review'
    | 'interview-scheduled'
    | 'accepted'
    | 'waitlisted'
    | 'deferred'
    | 'rejected';
  priority: 'reach' | 'target' | 'safety';
  application_deadline: string;
  submission_date?: string;
  decision_date?: string;
  decision_result?: 'accepted' | 'waitlisted' | 'deferred' | 'rejected';
  financial_aid_offered?: number;
  scholarship_offered?: number;
  net_cost?: number;
  major_applied?: string;
  essay_prompts?: string[];
  test_scores_required: boolean;
  sat_score_sent?: number;
  act_score_sent?: number;
  transcripts_sent: boolean;
  recommendations_required: number;
  recommendations_submitted: number;
  college?: College;
  checklist_items: ApplicationChecklistItem[];
  essays: ApplicationEssay[];
  recommendations: RecommendationRequest[];
  created_at: string;
  updated_at: string;
}

export interface ApplicationChecklistItem {
  id: number;
  application_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  due_date?: string;
  completed_date?: string;
  category: 'application' | 'testing' | 'essays' | 'recommendations' | 'financial' | 'other';
  order: number;
}

export interface ApplicationEssay {
  id: number;
  application_id: number;
  prompt: string;
  word_limit?: number;
  current_word_count: number;
  draft_count: number;
  current_draft: string;
  status: 'not-started' | 'draft' | 'revision' | 'final';
  revisions: EssayRevision[];
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface EssayRevision {
  id: number;
  essay_id: number;
  version: number;
  content: string;
  word_count: number;
  notes?: string;
  created_at: string;
}

export interface RecommendationRequest {
  id: number;
  application_id: number;
  teacher_id?: number;
  teacher_name: string;
  teacher_email: string;
  subject?: string;
  relationship: string;
  request_date: string;
  due_date: string;
  submitted_date?: string;
  status: 'pending' | 'accepted' | 'in-progress' | 'submitted' | 'declined';
  reminder_sent_count: number;
  last_reminder_date?: string;
  notes?: string;
}

export interface CollegeComparison {
  colleges: College[];
  applications: CollegeApplication[];
  personalFitScores: { [collegeId: number]: number };
}

export interface CollegeSearchFilters {
  query?: string;
  majors?: string[];
  location?: {
    states?: string[];
    cities?: string[];
    setting?: ('urban' | 'suburban' | 'rural')[];
  };
  size?: ('small' | 'medium' | 'large')[];
  type?: ('public' | 'private' | 'community')[];
  acceptance_rate?: {
    min?: number;
    max?: number;
  };
  tuition?: {
    min?: number;
    max?: number;
  };
  sat_score?: {
    min?: number;
    max?: number;
  };
  act_score?: {
    min?: number;
    max?: number;
  };
  ranking?: {
    max?: number;
  };
  specialFeatures?: string[];
}

export interface FinancialAidEstimate {
  college_id: number;
  college?: College;
  total_cost: number;
  tuition: number;
  room_board: number;
  books_supplies: number;
  personal_expenses: number;
  transportation: number;
  grants_scholarships: number;
  work_study: number;
  loans: number;
  family_contribution: number;
  net_cost: number;
  created_at: string;
}

export interface CounselorFeedback {
  id: number;
  student_id: number;
  counselor_id: number;
  college_id?: number;
  application_id?: number;
  feedback_type: 'college-list' | 'essay' | 'strategy' | 'general';
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  counselor_name: string;
  created_at: string;
  updated_at: string;
}

export interface StudentCollegeList {
  id: number;
  student_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  applications: CollegeApplication[];
  shared_with_counselor: boolean;
  counselor_approved?: boolean;
  counselor_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CollegeVisitSchedule {
  id: number;
  student_id: number;
  college_id: number;
  scheduled_date: string;
  scheduled_time: string;
  visit_type: 'campus-tour' | 'info-session' | 'interview' | 'class-visit' | 'meeting';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  reminder_sent: boolean;
  college?: College;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatistics {
  total_applications: number;
  by_status: {
    planning: number;
    in_progress: number;
    submitted: number;
    under_review: number;
    accepted: number;
    waitlisted: number;
    deferred: number;
    rejected: number;
  };
  by_priority: {
    reach: number;
    target: number;
    safety: number;
  };
  acceptance_rate: number;
  average_net_cost: number;
  upcoming_deadlines: number;
  essays_pending: number;
  recommendations_pending: number;
}

export interface DeadlineUrgency {
  application_id: number;
  college_name: string;
  deadline: string;
  days_remaining: number;
  urgency: 'critical' | 'warning' | 'normal';
  color: string;
}
