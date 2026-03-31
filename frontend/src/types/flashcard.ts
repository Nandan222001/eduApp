export enum FlashcardDeckVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  INSTITUTION = 'institution',
}

export enum SpacedRepetitionLevel {
  NEW = 'new',
  LEARNING = 'learning',
  REVIEWING = 'reviewing',
  MASTERED = 'mastered',
}

export interface Flashcard {
  id: number;
  deck_id: number;
  front_content: string;
  back_content: string;
  front_image_url?: string;
  back_image_url?: string;
  hint?: string;
  tags?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlashcardDeck {
  id: number;
  institution_id: number;
  creator_id: number;
  grade_id?: number;
  subject_id?: number;
  chapter_id?: number;
  title: string;
  description?: string;
  thumbnail_url?: string;
  visibility: FlashcardDeckVisibility;
  tags?: string;
  total_cards: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  flashcards?: Flashcard[];
}

export interface FlashcardDeckShare {
  id: number;
  deck_id: number;
  shared_with_user_id?: number;
  shared_with_grade_id?: number;
  shared_with_section_id?: number;
  can_edit: boolean;
  shared_at: string;
}

export interface FlashcardStudyProgress {
  id: number;
  deck_id: number;
  user_id: number;
  cards_studied: number;
  cards_mastered: number;
  total_study_time_minutes: number;
  last_studied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FlashcardStudySession {
  id: number;
  flashcard_id: number;
  user_id: number;
  repetition_level: SpacedRepetitionLevel;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date?: string;
  last_reviewed_at?: string;
  correct_count: number;
  incorrect_count: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcardDeckStats {
  total_cards: number;
  cards_studied: number;
  cards_mastered: number;
  study_time_minutes: number;
  average_accuracy: number;
  cards_due_today: number;
}

export interface FlashcardCreateInput {
  deck_id: number;
  front_content: string;
  back_content: string;
  front_image_url?: string;
  back_image_url?: string;
  hint?: string;
  tags?: string;
  order_index?: number;
  [key: string]: unknown;
}

export interface FlashcardDeckCreateInput {
  institution_id: number;
  creator_id: number;
  title: string;
  description?: string;
  grade_id?: number;
  subject_id?: number;
  chapter_id?: number;
  thumbnail_url?: string;
  visibility?: FlashcardDeckVisibility;
  tags?: string;
  [key: string]: unknown;
}

export interface FlashcardStudySessionUpdate {
  repetition_level: SpacedRepetitionLevel;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  is_correct: boolean;
  [key: string]: unknown;
}
