export interface SubjectPerformanceTrend {
  subject: string;
  data: Array<{
    date: string;
    score: number;
    average?: number;
  }>;
}

export interface AttendanceCalendarDay {
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday' | 'weekend';
  percentage?: number;
}

export interface AssignmentSubmissionStats {
  submitted: number;
  pending: number;
  late: number;
  total: number;
  submissionRate: number;
}

export interface ExamPerformanceComparison {
  subject: string;
  currentScore: number;
  previousScore: number;
  classAverage: number;
  maxScore: number;
}

export interface ChapterMastery {
  subject: string;
  chapter: string;
  masteryPercentage: number;
  questionsAttempted: number;
  questionsCorrect: number;
  lastPracticed?: string;
}

export interface StudentPerformanceAnalytics {
  student_id: number;
  student_name: string;
  grade: string;
  section: string;
  period_start: string;
  period_end: string;
  subject_trends: SubjectPerformanceTrend[];
  attendance_calendar: AttendanceCalendarDay[];
  assignment_stats: AssignmentSubmissionStats;
  exam_comparisons: ExamPerformanceComparison[];
  chapter_mastery: ChapterMastery[];
  overall_performance: {
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
    rank?: number;
    totalStudents?: number;
  };
}

export interface ClassScoreTrend {
  date: string;
  average: number;
  median: number;
  highest: number;
  lowest: number;
}

export interface StudentDistributionBin {
  range: string;
  count: number;
  percentage: number;
}

export interface SubjectDifficultyAnalysis {
  subject: string;
  averageScore: number;
  passRate: number;
  difficultyLevel: 'easy' | 'moderate' | 'difficult';
  studentsStruggling: number;
  commonMistakes: string[];
}

export interface TopPerformer {
  student_id: number;
  student_name: string;
  roll_number?: string;
  average_score: number;
  attendance_percentage: number;
  assignments_submitted: number;
  rank: number;
}

export interface BottomPerformer {
  student_id: number;
  student_name: string;
  roll_number?: string;
  average_score: number;
  attendance_percentage: number;
  weak_subjects: string[];
  rank: number;
}

export interface ClassPerformanceAnalytics {
  class_id: number;
  grade: string;
  section: string;
  teacher_id: number;
  teacher_name: string;
  period_start: string;
  period_end: string;
  total_students: number;
  score_trends: ClassScoreTrend[];
  student_distribution: StudentDistributionBin[];
  subject_difficulty: SubjectDifficultyAnalysis[];
  top_performers: TopPerformer[];
  bottom_performers: BottomPerformer[];
  class_statistics: {
    averageScore: number;
    medianScore: number;
    attendanceRate: number;
    assignmentCompletionRate: number;
  };
}

export interface GradeComparison {
  grade: string;
  totalStudents: number;
  averageScore: number;
  attendanceRate: number;
  passRate: number;
}

export interface TeacherEffectiveness {
  teacher_id: number;
  teacher_name: string;
  subjects: string[];
  totalStudents: number;
  averageClassScore: number;
  studentSatisfaction?: number;
  assignmentsGraded: number;
  responseTime?: number;
}

export interface EngagementStatistic {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface InstitutionAnalytics {
  institution_id: number;
  institution_name: string;
  period_start: string;
  period_end: string;
  grade_comparisons: GradeComparison[];
  teacher_effectiveness: TeacherEffectiveness[];
  engagement_stats: EngagementStatistic[];
  overall_metrics: {
    totalStudents: number;
    totalTeachers: number;
    averageAttendance: number;
    overallPassRate: number;
    studentRetention: number;
  };
}

export interface CustomReportFilter {
  startDate?: string;
  endDate?: string;
  gradeIds?: number[];
  sectionIds?: number[];
  subjectIds?: number[];
  metricTypes?: string[];
  groupBy?: 'grade' | 'section' | 'subject' | 'month' | 'week';
}

export interface CustomReportData {
  title: string;
  filters: CustomReportFilter;
  generatedAt: string;
  data: unknown;
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'radar' | 'scatter';
    title: string;
    data: unknown;
  }>;
}

export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
  preset?: '7days' | '30days' | '3months' | '6months' | '1year' | 'custom';
}
