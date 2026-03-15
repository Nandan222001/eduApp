export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

export enum LessonType {
  VIDEO = 'video',
  ARTICLE = 'article',
  QUIZ = 'quiz',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
}

export interface CourseCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url?: string;
  instructor_name: string;
  instructor_photo_url?: string;
  category_id: number;
  category_name?: string;
  level: CourseLevel;
  duration_minutes: number;
  total_lessons: number;
  enrollment_count: number;
  rating?: number;
  rating_count?: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  type: LessonType;
  video_url?: string;
  video_duration_seconds?: number;
  transcript?: string;
  content?: string;
  order_index: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseMaterial {
  id: number;
  lesson_id: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  lesson_id: number;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  order_index: number;
}

export interface Enrollment {
  id: number;
  parent_id: number;
  course_id: number;
  course?: Course;
  status: EnrollmentStatus;
  progress_percentage: number;
  current_lesson_id?: number;
  current_lesson?: Lesson;
  completed_lessons: number;
  total_lessons: number;
  certificate_url?: string;
  certificate_issued_at?: string;
  enrolled_at: string;
  completed_at?: string;
  last_accessed_at?: string;
}

export interface LessonProgress {
  id: number;
  enrollment_id: number;
  lesson_id: number;
  is_completed: boolean;
  completed_at?: string;
  time_spent_seconds: number;
  last_position_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  enrollment_id: number;
  lesson_id: number;
  content: string;
  timestamp_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface DiscussionThread {
  id: number;
  course_id: number;
  lesson_id?: number;
  parent_id: number;
  parent_name?: string;
  parent_photo_url?: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  reply_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface DiscussionReply {
  id: number;
  thread_id: number;
  parent_id?: number;
  user_id: number;
  user_name: string;
  user_photo_url?: string;
  user_role: string;
  content: string;
  is_answer: boolean;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  criteria: string;
  awarded_at: string;
}

export interface Certificate {
  id: number;
  enrollment_id: number;
  parent_name: string;
  course_title: string;
  completion_date: string;
  certificate_url: string;
  verification_code: string;
  issued_at: string;
}

export interface QuizAttempt {
  id: number;
  lesson_id: number;
  parent_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  answers: Record<number, string>;
  completed_at: string;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
  syllabus?: string;
  learning_objectives?: string[];
  prerequisites?: string[];
}

export interface EnrollmentDetail extends Enrollment {
  course: CourseDetail;
  lesson_progress: LessonProgress[];
  badges: Badge[];
  notes: Note[];
}
