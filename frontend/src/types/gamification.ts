export enum BadgeType {
  ATTENDANCE = 'attendance',
  ASSIGNMENT = 'assignment',
  EXAM = 'exam',
  GOAL = 'goal',
  STREAK = 'streak',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
}

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum EventType {
  ATTENDANCE = 'attendance',
  ASSIGNMENT_SUBMIT = 'assignment_submit',
  ASSIGNMENT_GRADE = 'assignment_grade',
  EXAM_PASS = 'exam_pass',
  EXAM_EXCELLENT = 'exam_excellent',
  GOAL_COMPLETE = 'goal_complete',
  MILESTONE_ACHIEVE = 'milestone_achieve',
  DAILY_LOGIN = 'daily_login',
  STREAK = 'streak',
  BADGE_EARN = 'badge_earn',
}

export enum AchievementType {
  ATTENDANCE = 'attendance',
  ASSIGNMENT = 'assignment',
  EXAM = 'exam',
  GOAL = 'goal',
  STREAK = 'streak',
  LEVEL = 'level',
  POINTS = 'points',
  SOCIAL = 'social',
}

export enum LeaderboardType {
  GLOBAL = 'global',
  GRADE = 'grade',
  SECTION = 'section',
  SUBJECT = 'subject',
  CUSTOM = 'custom',
}

export enum LeaderboardPeriod {
  ALL_TIME = 'all_time',
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily',
}

export interface Badge {
  id: number;
  institution_id: number;
  name: string;
  description: string;
  badge_type: BadgeType;
  rarity: BadgeRarity;
  icon_url: string | null;
  points_required: number;
  criteria: Record<string, unknown> | null;
  auto_award: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: number;
  institution_id: number;
  user_id: number;
  badge_id: number;
  earned_at: string;
  points_awarded: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  badge?: Badge;
}

export interface UserPoints {
  id: number;
  institution_id: number;
  user_id: number;
  total_points: number;
  level: number;
  experience_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  last_login_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointHistory {
  id: number;
  institution_id: number;
  user_points_id: number;
  event_type: EventType;
  points: number;
  description: string;
  reference_id: number | null;
  reference_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Achievement {
  id: number;
  institution_id: number;
  name: string;
  description: string;
  achievement_type: AchievementType;
  icon_url: string | null;
  points_reward: number;
  requirements: Record<string, unknown>;
  is_secret: boolean;
  is_repeatable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: number;
  institution_id: number;
  user_id: number;
  achievement_id: number;
  progress: number;
  is_completed: boolean;
  completed_at: string | null;
  times_completed: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  achievement?: Achievement;
}

export interface Leaderboard {
  id: number;
  institution_id: number;
  name: string;
  description: string;
  leaderboard_type: LeaderboardType;
  period: LeaderboardPeriod;
  grade_id: number | null;
  section_id: number | null;
  subject_id: number | null;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
  show_full_names: boolean;
  max_entries: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: number;
  institution_id: number;
  leaderboard_id: number;
  user_id: number;
  rank: number;
  score: number;
  previous_rank: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface LeaderboardWithEntries extends Leaderboard {
  entries: LeaderboardEntry[];
}

export interface StreakTracker {
  id: number;
  institution_id: number;
  user_id: number;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserGamificationStats {
  user_id: number;
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  badges_count: number;
  achievements_count: number;
  rank: number | null;
  points_to_next_level: number;
  level_progress_percentage: number;
}

export interface UserShowcase {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  badges: UserBadge[];
  achievements: UserAchievement[];
  recent_activities: PointHistory[];
  rank: number | null;
}

export interface PointsCalculationResult {
  points_awarded: number;
  level_up: boolean;
  new_level: number;
  badges_earned: UserBadge[];
  achievements_unlocked: UserAchievement[];
}

export interface Reward {
  id: number;
  institution_id: number;
  name: string;
  description: string;
  points_cost: number;
  category: string;
  icon_url: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRedemption {
  id: number;
  institution_id: number;
  user_id: number;
  reward_id: number;
  points_spent: number;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  redeemed_at: string;
  processed_at: string | null;
  notes: string | null;
  reward?: Reward;
}

export interface LeaderboardFilter {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  gradeId?: number;
  sectionId?: number;
  subjectId?: number;
  friendsOnly?: boolean;
}

export interface AchievementNotification {
  id: string;
  type: 'badge' | 'achievement' | 'level_up' | 'streak';
  title: string;
  message: string;
  icon?: string;
  points?: number;
  timestamp: Date;
}
