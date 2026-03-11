export enum Board {
  CBSE = 'cbse',
  ICSE = 'icse',
  STATE_BOARD = 'state_board',
  IB = 'ib',
  CAMBRIDGE = 'cambridge',
  OTHER = 'other',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  TRUE_FALSE = 'true_false',
  FILL_IN_BLANK = 'fill_in_blank',
  NUMERICAL = 'numerical',
  MATCH_THE_FOLLOWING = 'match_the_following',
  ASSERTION_REASONING = 'assertion_reasoning',
}

export enum DifficultyLevel {
  VERY_EASY = 'very_easy',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
}

export enum BloomTaxonomyLevel {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand',
  APPLY = 'apply',
  ANALYZE = 'analyze',
  EVALUATE = 'evaluate',
  CREATE = 'create',
}

export interface PreviousYearPaper {
  id: number;
  institution_id: number;
  title: string;
  description?: string;
  board: Board;
  year: number;
  exam_month?: string;
  grade_id: number;
  subject_id: number;
  total_marks?: number;
  duration_minutes?: number;
  pdf_file_name?: string;
  pdf_file_size?: number;
  pdf_file_url?: string;
  ocr_processed: boolean;
  ocr_processed_at?: string;
  ocr_text?: string;
  tags?: string;
  view_count: number;
  download_count: number;
  is_active: boolean;
  uploaded_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PreviousYearPaperCreate {
  institution_id: number;
  title: string;
  description?: string;
  board: Board;
  year: number;
  exam_month?: string;
  grade_id: number;
  subject_id: number;
  total_marks?: number;
  duration_minutes?: number;
  tags?: string;
  uploaded_by?: number;
}

export interface QuestionBank {
  id: number;
  institution_id: number;
  paper_id?: number;
  question_text: string;
  question_type: QuestionType;
  grade_id: number;
  subject_id: number;
  chapter_id?: number;
  topic_id?: number;
  difficulty_level: DifficultyLevel;
  bloom_taxonomy_level: BloomTaxonomyLevel;
  marks?: number;
  estimated_time_minutes?: number;
  answer_text?: string;
  explanation?: string;
  hints?: string;
  options?: string;
  correct_option?: string;
  image_url?: string;
  tags?: string;
  keywords?: string;
  usage_count: number;
  is_active: boolean;
  is_verified: boolean;
  verified_by?: number;
  verified_at?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionBankCreate {
  institution_id: number;
  paper_id?: number;
  question_text: string;
  question_type: QuestionType;
  grade_id: number;
  subject_id: number;
  chapter_id?: number;
  topic_id?: number;
  difficulty_level: DifficultyLevel;
  bloom_taxonomy_level: BloomTaxonomyLevel;
  marks?: number;
  estimated_time_minutes?: number;
  answer_text?: string;
  explanation?: string;
  hints?: string;
  options?: string;
  correct_option?: string;
  tags?: string;
  keywords?: string;
  created_by?: number;
}

export interface QuestionBookmark {
  id: number;
  user_id: number;
  question_id: number;
  institution_id: number;
  notes?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionBookmarkCreate {
  question_id: number;
  notes?: string;
  tags?: string;
}

export interface QuestionTagSuggestion {
  question_id: number;
  suggested_tags: string[];
  suggested_chapter?: string;
  suggested_topic?: string;
  suggested_difficulty?: string;
  suggested_bloom_level?: string;
  confidence_score: number;
}

export interface PaperFilters {
  board?: Board;
  year?: number;
  grade_id?: number;
  subject_id?: number;
  is_active?: boolean;
  ocr_processed?: boolean;
  search?: string;
}

export interface QuestionFilters {
  paper_id?: number;
  grade_id?: number;
  subject_id?: number;
  chapter_id?: number;
  topic_id?: number;
  question_type?: QuestionType;
  difficulty_level?: DifficultyLevel;
  bloom_taxonomy_level?: BloomTaxonomyLevel;
  is_active?: boolean;
  is_verified?: boolean;
  search?: string;
}

export interface PaperStatistics {
  total_papers: number;
  papers_by_board: Record<string, number>;
  papers_by_year: Record<string, number>;
  papers_by_grade: Record<string, number>;
  papers_by_subject: Record<string, number>;
  ocr_processed_count: number;
  ocr_pending_count: number;
}

export interface QuestionStatistics {
  total_questions: number;
  questions_by_type: Record<string, number>;
  questions_by_difficulty: Record<string, number>;
  questions_by_bloom_level: Record<string, number>;
  verified_count: number;
  unverified_count: number;
  questions_by_chapter: Record<string, number>;
}
