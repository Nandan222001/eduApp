export interface StudentStats {
  attendance_percentage: number;
  total_courses: number;
  pending_assignments: number;
  average_grade: number;
  streak_days: number;
  points: number;
  level: number;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  subject: string;
  subject_id: number;
  due_date: string;
  max_score: number;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  submission_date?: string;
  feedback?: string;
  attachments?: string[];
  grade_letter?: string;
}

export interface Grade {
  id: number;
  subject: string;
  assignment_title: string;
  score: number;
  max_score: number;
  percentage: number;
  date: string;
  grade_letter?: string;
}

export interface AttendanceStatus {
  today_status: 'present' | 'absent' | 'late' | 'pending';
  current_week_percentage: number;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
}

export interface AIPrediction {
  subject: string;
  predicted_grade: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface WeakArea {
  subject: string;
  topic: string;
  score_percentage: number;
  recommendation: string;
}

export interface StudyMaterial {
  id: number;
  title: string;
  subject: string;
  subject_id: number;
  type: 'pdf' | 'video' | 'document' | 'link' | 'image';
  file_url?: string;
  description?: string;
  uploaded_date: string;
  size?: number;
  is_downloaded?: boolean;
  local_path?: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  teacher_name?: string;
  material_count: number;
}

export interface SubmissionFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface AssignmentSubmission {
  assignment_id: number;
  files: SubmissionFile[];
  comments?: string;
  submitted_at: string;
}

export interface GamificationBadge {
  id: number;
  name: string;
  icon: string;
  description: string;
  earned_date?: string;
  is_earned: boolean;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  points: number;
  date: string;
}
