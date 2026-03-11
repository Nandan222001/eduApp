export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum SubmissionStatus {
  NOT_SUBMITTED = 'not_submitted',
  SUBMITTED = 'submitted',
  LATE_SUBMITTED = 'late_submitted',
  GRADED = 'graded',
  RETURNED = 'returned',
}

export interface AssignmentFile {
  id: number;
  assignment_id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  s3_key: string;
  uploaded_at: string;
}

export interface SubmissionFile {
  id: number;
  submission_id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  s3_key: string;
  uploaded_at: string;
}

export interface RubricLevel {
  id?: number;
  criteria_id?: number;
  name: string;
  description?: string;
  points: number;
  order: number;
  created_at?: string;
}

export interface RubricCriteria {
  id?: number;
  assignment_id?: number;
  name: string;
  description?: string;
  max_points: number;
  order: number;
  created_at?: string;
  levels: RubricLevel[];
}

export interface SubmissionGrade {
  id?: number;
  submission_id?: number;
  criteria_id: number;
  points_awarded: number;
  feedback?: string;
  graded_at?: string;
}

export interface Assignment {
  id: number;
  institution_id: number;
  teacher_id: number;
  grade_id: number;
  section_id?: number;
  subject_id: number;
  chapter_id?: number;
  title: string;
  description?: string;
  content?: string;
  instructions?: string;
  due_date?: string;
  publish_date?: string;
  close_date?: string;
  max_marks: number;
  passing_marks?: number;
  allow_late_submission: boolean;
  late_penalty_percentage?: number;
  max_file_size_mb: number;
  allowed_file_types?: string;
  status: AssignmentStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  attachment_files?: AssignmentFile[];
  rubric_criteria?: RubricCriteria[];
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  content?: string;
  submission_text?: string;
  submitted_at?: string;
  is_late: boolean;
  marks_obtained?: number;
  grade?: string;
  feedback?: string;
  graded_by?: number;
  graded_at?: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  submission_files?: SubmissionFile[];
  rubric_grades?: SubmissionGrade[];
  student_name?: string;
  student_email?: string;
  student_roll_number?: string;
}

export interface AssignmentCreateInput {
  institution_id: number;
  teacher_id: number;
  grade_id: number;
  section_id?: number;
  subject_id: number;
  chapter_id?: number;
  title: string;
  description?: string;
  content?: string;
  instructions?: string;
  due_date?: string;
  publish_date?: string;
  close_date?: string;
  max_marks: number;
  passing_marks?: number;
  allow_late_submission: boolean;
  late_penalty_percentage?: number;
  max_file_size_mb: number;
  allowed_file_types?: string;
  status: AssignmentStatus;
}

export interface SubmissionGradeInput {
  marks_obtained: number;
  grade?: string;
  feedback?: string;
  rubric_grades?: SubmissionGrade[];
}

export interface AssignmentListParams {
  skip?: number;
  limit?: number;
  grade_id?: number;
  section_id?: number;
  subject_id?: number;
  teacher_id?: number;
  status?: AssignmentStatus;
  search?: string;
  is_active?: boolean;
}

export interface SubmissionListParams {
  skip?: number;
  limit?: number;
  status?: SubmissionStatus;
  is_late?: boolean;
}
