export interface PomodoroSession {
  id: number;
  student_id: number;
  subject_id?: number;
  subject_name?: string;
  session_type: 'work' | 'short_break' | 'long_break';
  duration_minutes: number;
  start_time: string;
  end_time?: string;
  completed: boolean;
  interrupted: boolean;
  created_at: string;
}

export interface PomodoroSettings {
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  auto_start_breaks: boolean;
  auto_start_work: boolean;
  sound_enabled: boolean;
  notification_enabled: boolean;
}

export interface Subject {
  id: number;
  name: string;
  color?: string;
}

export interface PomodoroAnalytics {
  total_focus_time_minutes: number;
  total_sessions: number;
  completed_sessions: number;
  interrupted_sessions: number;
  current_streak: number;
  longest_streak: number;
  subject_distribution: SubjectDistribution[];
  hourly_productivity: HourlyProductivity[];
  daily_focus_time: DailyFocusTime[];
  weekly_summary: WeeklySummary;
}

export interface SubjectDistribution {
  subject_id?: number;
  subject_name: string;
  total_minutes: number;
  session_count: number;
  percentage: number;
  color?: string;
}

export interface HourlyProductivity {
  hour: number;
  focus_minutes: number;
  session_count: number;
  average_focus_score: number;
}

export interface DailyFocusTime {
  date: string;
  total_minutes: number;
  session_count: number;
  completed_sessions: number;
}

export interface WeeklySummary {
  current_week_minutes: number;
  previous_week_minutes: number;
  change_percentage: number;
  average_daily_minutes: number;
  most_productive_day: string;
}

export interface BreakSuggestion {
  type: 'stretch' | 'hydrate' | 'eyerest' | 'walk' | 'meditate' | 'snack';
  title: string;
  description: string;
  duration_minutes: number;
  icon: string;
}

export const breakSuggestions: BreakSuggestion[] = [
  {
    type: 'stretch',
    title: 'Stretch Break',
    description: 'Stand up and stretch your arms, legs, and back',
    duration_minutes: 5,
    icon: '🧘',
  },
  {
    type: 'hydrate',
    title: 'Hydration Break',
    description: 'Drink a glass of water to stay hydrated',
    duration_minutes: 2,
    icon: '💧',
  },
  {
    type: 'eyerest',
    title: 'Eye Rest',
    description: 'Look away from the screen and focus on distant objects',
    duration_minutes: 3,
    icon: '👀',
  },
  {
    type: 'walk',
    title: 'Short Walk',
    description: 'Take a quick walk around your room or house',
    duration_minutes: 5,
    icon: '🚶',
  },
  {
    type: 'meditate',
    title: 'Mindful Breathing',
    description: 'Practice deep breathing or quick meditation',
    duration_minutes: 5,
    icon: '🧠',
  },
  {
    type: 'snack',
    title: 'Healthy Snack',
    description: 'Grab a healthy snack to refuel your energy',
    duration_minutes: 5,
    icon: '🍎',
  },
];
