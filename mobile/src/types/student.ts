export interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
  studentId?: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface AttendanceSummary {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  todayStatus: 'present' | 'absent' | 'late' | 'not_marked';
  recentAttendance: {
    date: string;
    status: 'present' | 'absent' | 'late';
  }[];
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  subject: string;
  subjectCode?: string;
  teacherName?: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  totalMarks?: number;
  obtainedMarks?: number;
  submittedAt?: string;
  feedback?: string;
  attachments?: {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  createdAt?: string;
}

export interface Grade {
  id: number;
  examName: string;
  subject: string;
  subjectCode?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
  term?: string;
  remarks?: string;
}

export interface AIPrediction {
  predictedPercentage: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
  nextMilestone?: {
    target: number;
    daysRemaining: number;
  };
}

export interface WeakArea {
  id: number;
  topic: string;
  subject: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  recommendedResources: number;
  lastPracticed?: string;
}

export interface GamificationData {
  totalPoints: number;
  currentLevel: number;
  nextLevelPoints: number;
  rank: number;
  totalStudents: number;
  badges: Badge[];
  recentAchievements: Achievement[];
  streak: StreakData;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  pointsEarned: number;
  achievedAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakType: 'daily_login' | 'assignment_submission' | 'study_time';
}

export interface TopicProbability {
  topic: string;
  subject: string;
  probability: number;
  confidence: number;
  lastSeen?: string;
}

export interface PredictedQuestionBlueprint {
  category: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  weight: number;
}

export interface FocusArea {
  id: string;
  subject: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  mastery: number;
  recommendedStudyTime: number;
  resources: {
    id: string;
    title: string;
    type: 'video' | 'article' | 'quiz' | 'practice';
    url: string;
  }[];
}

export interface AIPredictionDashboardData {
  topicProbabilities: TopicProbability[];
  questionBlueprint: PredictedQuestionBlueprint[];
  focusAreas: FocusArea[];
  overallReadiness: number;
  lastAnalyzed: string;
}

export interface MistakeAnalysis {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RemedialSuggestion {
  id: string;
  topic: string;
  suggestion: string;
  resources: {
    title: string;
    type: string;
    url: string;
  }[];
}

export interface HomeworkScanResult {
  id: string;
  imageUrl: string;
  subject?: string;
  topic?: string;
  overallScore: number;
  mistakes: MistakeAnalysis[];
  remedialSuggestions: RemedialSuggestion[];
  processedAt: string;
  feedback: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isVoice?: boolean;
}

export interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  duration: number;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    estimatedTime: number;
  }[];
  createdAt: string;
}

export interface DailyBriefing {
  date: string;
  upcomingTests: {
    subject: string;
    date: string;
    daysRemaining: number;
  }[];
  pendingAssignments: number;
  focusTopics: string[];
  motivationalMessage: string;
}
