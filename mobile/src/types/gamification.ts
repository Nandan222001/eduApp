export interface Points {
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsToNextLevel: number;
  pointsInCurrentLevel: number;
  pointsRequiredForNextLevel: number;
  recentActivities: PointActivity[];
}

export interface PointActivity {
  id: number;
  activityType: string;
  description: string;
  pointsEarned: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  iconUrl?: string;
  category: 'academic' | 'attendance' | 'participation' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
  isEarned: boolean;
  progress?: BadgeProgress;
  criteria?: string;
}

export interface BadgeProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface Leaderboard {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  myRank: number;
  myPoints: number;
  totalParticipants: number;
  topRankers: LeaderboardEntry[];
  nearbyRankers: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  studentName: string;
  profilePhoto?: string;
  points: number;
  level: number;
  badgeCount: number;
  trend?: 'up' | 'down' | 'same';
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  streakType: 'daily_login' | 'assignment_submission' | 'study_time' | 'attendance';
  lastActivityDate: string;
  isActive: boolean;
  nextMilestone?: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  category: string;
  pointsEarned: number;
  badgeEarned?: Badge;
  achievedAt: string;
  isNew: boolean;
}

export interface GamificationStats {
  totalPoints: number;
  totalBadges: number;
  totalAchievements: number;
  currentLevel: number;
  rank: number;
  totalStudents?: number;
  nextLevelPoints?: number;
  badges?: Badge[];
  streaks: Streak[];
  recentAchievements: Achievement[];
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  icon: string;
  pointsCost: number;
  available: boolean;
  category: string;
  imageUrl?: string;
  expiresAt?: string;
  claimed: boolean;
  claimedAt?: string;
}

export interface StreakCalendarDay {
  date: Date;
  isActive: boolean;
  isToday: boolean;
}
