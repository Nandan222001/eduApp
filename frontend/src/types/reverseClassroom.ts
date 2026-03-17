export interface Topic {
  id: number;
  chapter_id: number;
  title: string;
  description?: string;
  estimated_hours: number;
  order: number;
}

export interface Chapter {
  id: number;
  subject_id: number;
  chapter_number: number;
  title: string;
  description?: string;
  estimated_hours: number;
  order: number;
  topics: Topic[];
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  chapters: Chapter[];
}

export interface ChatMessage {
  id: string;
  role: 'student' | 'ai';
  content: string;
  timestamp: Date;
  confusion_markers?: string[];
}

export interface ConceptAnalysis {
  correctly_explained: string[];
  missing_concepts: string[];
  confused_concepts: string[];
  understanding_score: number;
}

export interface TeachingSession {
  id: string;
  topic_id: number;
  topic_name: string;
  started_at: Date;
  ended_at?: Date;
  messages: ChatMessage[];
  analysis?: ConceptAnalysis;
  difficulty_level?: DifficultyLevel;
  mastery_score?: number;
}

export type DifficultyLevel = '5yo' | '10yo' | 'college' | '30seconds';

export interface DifficultyChallenge {
  id: DifficultyLevel;
  label: string;
  description: string;
  icon: string;
}

export interface TopicProgress {
  topic_id: number;
  topic_name: string;
  mastery_level: number;
  sessions_count: number;
  last_session_date?: Date;
  trend: 'up' | 'down' | 'stable';
}

export interface TeachingBadge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at: Date;
  criteria: string;
}

export interface VoiceTranscription {
  text: string;
  confidence: number;
  duration: number;
}

export interface TeachingAnalyticsResponse {
  session_id: string;
  analysis: ConceptAnalysis;
  mastery_score: number;
  badges_earned?: TeachingBadge[];
}
