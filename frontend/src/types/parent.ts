export interface ChildBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  admission_number?: string;
  photo_url?: string;
  section_name?: string;
  grade_name?: string;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  attendance_percentage: number;
}

export interface ChildOverview {
  id: number;
  first_name: string;
  last_name: string;
  admission_number?: string;
  photo_url?: string;
  section_name?: string;
  grade_name?: string;
  attendance_percentage: number;
  current_rank?: number;
  average_score?: number;
  total_students?: number;
  attendance_status?: string;
}

export interface TodayAttendance {
  date: string;
  status?: string;
  is_absent: boolean;
  is_present: boolean;
  is_late: boolean;
  is_half_day: boolean;
  alert_sent: boolean;
  remarks?: string;
}

export interface RecentGrade {
  subject_name: string;
  exam_name: string;
  exam_type: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade?: string;
  exam_date: string;
  rank?: number;
}

export interface PendingAssignment {
  id: number;
  title: string;
  subject_name: string;
  due_date: string;
  days_remaining: number;
  description?: string;
  max_marks: number;
  is_overdue: boolean;
}

export interface SubjectPerformance {
  subject_name: string;
  average_score: number;
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  attendance_percentage: number;
}

export interface WeeklyProgress {
  week_start: string;
  week_end: string;
  attendance_days: number;
  present_days: number;
  assignments_completed: number;
  assignments_pending: number;
  average_score?: number;
  subject_performance: SubjectPerformance[];
}

export interface TermPerformance {
  term_name: string;
  subject_name: string;
  average_marks: number;
  total_marks: number;
  percentage: number;
  grade?: string;
}

export interface PerformanceComparison {
  current_term: string;
  previous_term: string;
  current_term_data: TermPerformance[];
  previous_term_data: TermPerformance[];
  improvement_subjects: string[];
  declined_subjects: string[];
  overall_improvement: number;
}

export interface GoalProgress {
  id: number;
  title: string;
  description?: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  status: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
}

export interface TeacherMessage {
  id: number;
  teacher_name: string;
  subject?: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface ParentDashboard {
  parent_info: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    photo_url?: string;
  };
  children: ChildBasicInfo[];
  selected_child?: ChildOverview;
  today_attendance?: TodayAttendance;
  attendance_stats?: AttendanceStats;
  recent_grades: RecentGrade[];
  pending_assignments: PendingAssignment[];
  weekly_progress?: WeeklyProgress;
  goals: GoalProgress[];
  teacher_messages: TeacherMessage[];
  performance_comparison?: PerformanceComparison;
}
