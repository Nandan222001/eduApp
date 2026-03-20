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
  due_date?: string;
  dueDate?: string;
  max_score: number;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  submission_date?: string;
  feedback?: string;
  attachments?: string[];
  grade_letter?: string;
}

export interface Grade {
  id: number;
  subject: string;
  assignment_title?: string;
  examName?: string;
  score?: number;
  obtainedMarks?: number;
  max_score?: number;
  totalMarks?: number;
  percentage: number;
  date?: string;
  examDate?: string;
  grade_letter?: string;
  grade?: string;
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
  subject?: string;
  predicted_grade?: number;
  predictedPercentage: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  nextMilestone?: {
    target: number;
    daysRemaining: number;
  };
}

export interface WeakArea {
  id: number;
  subject: string;
  topic: string;
  score_percentage?: number;
  score?: number;
  recommendation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  recommendedResources?: number;
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

export interface Profile {
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  email?: string;
  phone?: string;
  grade?: string;
  class?: string;
  rollNumber?: string;
}

export interface GamificationData {
  totalPoints: number;
  rank: number;
  badges: {
    id: number;
    name: string;
    icon: string;
    description: string;
    earnedAt?: string;
  }[];
  streak?: {
    currentStreak: number;
    longestStreak: number;
  };
  activeGoalsCount?: number;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  category: 'academic' | 'attendance' | 'behavior' | 'extracurricular' | 'personal' | 'project';
  targetValue: number;
  currentValue: number;
  status: 'active' | 'completed' | 'abandoned' | 'in_progress';
  targetDate?: string;
  progress?: number;
  milestones?: {
    id: number;
    title: string;
    completed: boolean;
    completedDate?: string;
  }[];
}
