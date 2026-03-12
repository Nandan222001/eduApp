export enum QuizType {
  PRACTICE = 'practice',
  GRADED = 'graded',
  COMPETITIVE = 'competitive',
}

export enum QuestionType {
  MCQ = 'mcq',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  SHORT_ANSWER = 'short_answer',
}

export enum QuizStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum QuizAttemptStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_type: QuestionType;
  question_text: string;
  question_image_url?: string;
  explanation?: string;
  marks: number;
  order_index: number;
  options?: QuestionOption[];
  correct_answer?: string;
  correct_answers?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: number;
  institution_id: number;
  creator_id: number;
  grade_id?: number;
  section_id?: number;
  subject_id?: number;
  chapter_id?: number;
  title: string;
  description?: string;
  instructions?: string;
  quiz_type: QuizType;
  status: QuizStatus;
  time_limit_minutes?: number;
  passing_percentage?: number;
  total_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers: boolean;
  enable_leaderboard: boolean;
  allow_retake: boolean;
  max_attempts?: number;
  available_from?: string;
  available_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  attempt_number: number;
  status: QuizAttemptStatus;
  score: number;
  percentage: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  time_taken_seconds: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizResponse {
  id: number;
  attempt_id: number;
  question_id: number;
  user_answer?: string;
  user_answers?: string[];
  is_correct?: boolean;
  marks_awarded: number;
  time_taken_seconds: number;
  answered_at?: string;
  created_at: string;
}

export interface QuizLeaderboardEntry {
  id: number;
  quiz_id: number;
  user_id: number;
  user_name?: string;
  best_score: number;
  best_percentage: number;
  best_time_seconds: number;
  total_attempts: number;
  rank?: number;
  updated_at: string;
}

export interface QuizAnalytics {
  quiz_id: number;
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  average_percentage: number;
  average_time_seconds: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  question_difficulty?: Record<string, number>;
}

export interface QuestionAnalytics {
  question_id: number;
  question_text: string;
  total_attempts: number;
  correct_attempts: number;
  incorrect_attempts: number;
  accuracy_rate: number;
  average_time_seconds: number;
}

export interface QuizDetailedAnalytics {
  quiz_analytics: QuizAnalytics;
  question_analytics: QuestionAnalytics[];
  score_distribution: Record<string, number>;
  time_distribution: Record<string, number>;
}

export interface QuizCreateInput {
  institution_id: number;
  creator_id: number;
  title: string;
  description?: string;
  instructions?: string;
  grade_id?: number;
  section_id?: number;
  subject_id?: number;
  chapter_id?: number;
  quiz_type?: QuizType;
  time_limit_minutes?: number;
  passing_percentage?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_answers?: boolean;
  enable_leaderboard?: boolean;
  allow_retake?: boolean;
  max_attempts?: number;
  available_from?: string;
  available_until?: string;
}

export interface QuestionCreateInput {
  quiz_id: number;
  question_type: QuestionType;
  question_text: string;
  question_image_url?: string;
  explanation?: string;
  marks?: number;
  order_index?: number;
  options?: QuestionOption[];
  correct_answer?: string;
  correct_answers?: string[];
}

export interface QuizSubmissionInput {
  attempt_id: number;
  responses: Array<{
    attempt_id: number;
    question_id: number;
    user_answer?: string;
    user_answers?: string[];
  }>;
  time_taken_seconds: number;
}
