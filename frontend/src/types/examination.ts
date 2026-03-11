export enum ExamType {
  UNIT = 'unit',
  MID_TERM = 'mid_term',
  FINAL = 'final',
  MOCK = 'mock',
}

export enum ExamStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Exam {
  id: number;
  institution_id: number;
  academic_year_id: number;
  grade_id: number;
  name: string;
  exam_type: ExamType;
  start_date: string;
  end_date: string;
  status: ExamStatus;
  description?: string;
  total_marks?: number;
  passing_marks?: number;
  result_published: boolean;
  result_published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamSubject {
  id: number;
  institution_id: number;
  exam_id: number;
  subject_id: number;
  subject_name?: string;
  theory_max_marks: number;
  practical_max_marks: number;
  theory_passing_marks: number;
  practical_passing_marks: number;
  question_paper_path?: string;
  question_paper_uploaded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamSchedule {
  id: number;
  institution_id: number;
  exam_id: number;
  subject_id: number;
  section_id: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number?: string;
  invigilator_id?: number;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamMarks {
  id: number;
  institution_id: number;
  exam_subject_id: number;
  student_id: number;
  student_name?: string;
  student_roll_number?: string;
  theory_marks_obtained?: number;
  practical_marks_obtained?: number;
  total_marks_obtained: number;
  is_absent: boolean;
  remarks?: string;
  entered_by_id?: number;
  entered_at?: string;
  updated_at?: string;
  created_at: string;
}

export interface ExamResult {
  id: number;
  institution_id: number;
  exam_id: number;
  student_id: number;
  student_name?: string;
  student_roll_number?: string;
  section_id: number;
  total_marks_obtained: number;
  total_max_marks: number;
  percentage: number;
  grade?: string;
  grade_point?: number;
  section_rank?: number;
  grade_rank?: number;
  is_pass: boolean;
  subjects_passed: number;
  subjects_failed: number;
  created_at: string;
  updated_at: string;
  subject_results?: SubjectResult[];
}

export interface SubjectResult {
  subject_id: number;
  subject_name: string;
  theory_marks: number;
  practical_marks: number;
  total_marks: number;
  max_marks: number;
  percentage: number;
  grade?: string;
  is_pass: boolean;
}

export interface GradeConfiguration {
  id: number;
  institution_id: number;
  name: string;
  min_percentage: number;
  max_percentage: number;
  grade: string;
  grade_point: number;
  is_passing: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamPerformanceAnalytics {
  id: number;
  exam_id: number;
  section_id?: number;
  subject_id?: number;
  total_students: number;
  students_appeared: number;
  students_passed: number;
  students_failed: number;
  pass_percentage: number;
  average_marks: number;
  average_percentage: number;
  highest_marks: number;
  lowest_marks: number;
  median_marks: number;
  standard_deviation: number;
  created_at: string;
  updated_at: string;
}

export interface ExamCreateInput {
  institution_id: number;
  academic_year_id: number;
  grade_id: number;
  name: string;
  exam_type: ExamType;
  start_date: string;
  end_date: string;
  description?: string;
  total_marks?: number;
  passing_marks?: number;
}

export interface ExamSubjectCreateInput {
  institution_id: number;
  exam_id: number;
  subject_id: number;
  theory_max_marks: number;
  practical_max_marks: number;
  theory_passing_marks: number;
  practical_passing_marks: number;
}

export interface ExamScheduleCreateInput {
  institution_id: number;
  exam_id: number;
  subject_id: number;
  section_id: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number?: string;
  invigilator_id?: number;
  instructions?: string;
}

export interface BulkMarksEntry {
  student_id: number;
  theory_marks_obtained?: number;
  practical_marks_obtained?: number;
  is_absent: boolean;
  remarks?: string;
}

export interface BulkMarksEntryInput {
  exam_subject_id: number;
  marks_entries: BulkMarksEntry[];
}

export interface MarksVerification {
  exam_subject_id: number;
  verified: boolean;
  verified_by_id?: number;
  verification_remarks?: string;
}

export interface PerformanceComparison {
  exam_ids: number[];
  section_id?: number;
  subject_id?: number;
}

export interface TopperInfo {
  student_id: number;
  student_name: string;
  student_roll_number?: string;
  photo_url?: string;
  total_marks: number;
  percentage: number;
  grade?: string;
  rank: number;
}
