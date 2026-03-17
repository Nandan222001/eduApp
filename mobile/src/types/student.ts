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
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
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
