export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'card' | 'briefing' | 'plan' | 'achievement' | 'review';
}

export interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  type: 'class' | 'exam' | 'assignment' | 'study';
  status?: 'upcoming' | 'ongoing' | 'completed';
}

export interface WeakTopic {
  id: string;
  subject: string;
  topic: string;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ExamReadiness {
  subject: string;
  readiness: number;
  confidence: number;
  lastPracticed: string;
}

export interface DailyBriefing {
  date: Date;
  schedule: ScheduleItem[];
  weakTopics: WeakTopic[];
  examReadiness: ExamReadiness[];
  motivationalQuote?: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  duration: number;
  startTime: string;
  endTime: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  type: 'revision' | 'practice' | 'reading' | 'assignment';
}

export interface DailyStudyPlan {
  date: Date;
  tasks: StudyTask[];
  totalDuration: number;
  completedDuration: number;
  productivity: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  timestamp: Date;
  points: number;
  category: 'study' | 'streak' | 'score' | 'completion';
}

export interface StudySession {
  date: string;
  hours: number;
  subjects: {
    name: string;
    hours: number;
  }[];
}

export interface PerformanceMetric {
  subject: string;
  currentScore: number;
  previousScore: number;
  delta: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyReview {
  weekStart: Date;
  weekEnd: Date;
  totalStudyHours: number;
  dailySessions: StudySession[];
  performance: PerformanceMetric[];
  achievementsEarned: number;
  streakDays: number;
  topSubjects: string[];
  areasToImprove: string[];
}

export type MoodType = 'excited' | 'happy' | 'neutral' | 'tired' | 'stressed' | 'confused';

export interface MoodCheckIn {
  id: string;
  mood: MoodType;
  timestamp: Date;
  note?: string;
  energyLevel?: number;
  focusLevel?: number;
}

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
}
