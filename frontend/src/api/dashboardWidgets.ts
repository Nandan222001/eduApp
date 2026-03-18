import apiClient from '../lib/axios';

export enum WidgetType {
  UPCOMING_DEADLINES = 'upcoming_deadlines',
  PENDING_GRADING = 'pending_grading',
  ATTENDANCE_ALERTS = 'attendance_alerts',
  RECENT_GRADES = 'recent_grades',
  QUICK_STATS = 'quick_stats',
  UPCOMING_EXAMS = 'upcoming_exams',
  RECENT_ANNOUNCEMENTS = 'recent_announcements',
  PROGRESS_TRACKER = 'progress_tracker',
  GOAL_TRACKER = 'goal_tracker',
  LEADERBOARD = 'leaderboard',
  STUDY_STREAK = 'study_streak',
  BADGES = 'badges',
  PENDING_ASSIGNMENTS = 'pending_assignments',
  CLASS_PERFORMANCE = 'class_performance',
  ATTENDANCE_SUMMARY = 'attendance_summary',
  RECENT_ACTIVITY = 'recent_activity',
  CALENDAR = 'calendar',
  TIMETABLE = 'timetable',
  NOTIFICATIONS = 'notifications',
  QUICK_ACTIONS = 'quick_actions',
}

export enum WidgetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  FULL = 'full',
}

export interface DashboardWidget {
  id: number;
  user_id: number;
  widget_type: WidgetType;
  title: string;
  position: number;
  size: WidgetSize;
  is_visible: boolean;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WidgetData {
  widget_id: number;
  widget_type: WidgetType;
  data: Record<string, unknown>;
  last_updated: string;
}

export interface CreateWidgetRequest {
  widget_type: WidgetType;
  title: string;
  position?: number;
  size?: WidgetSize;
  is_visible?: boolean;
  config?: Record<string, unknown>;
}

export interface UpdateWidgetRequest {
  title?: string;
  position?: number;
  size?: WidgetSize;
  is_visible?: boolean;
  config?: Record<string, unknown>;
}

export interface WidgetPositionUpdate {
  widget_id: number;
  position: number;
}

export interface BulkWidgetPositionUpdate {
  updates: WidgetPositionUpdate[];
}

const dashboardWidgetsApi = {
  getWidgets: async (): Promise<DashboardWidget[]> => {
    const response = await apiClient.get('/dashboard/widgets');
    return response.data;
  },

  getWidget: async (widgetId: number): Promise<DashboardWidget> => {
    const response = await apiClient.get(`/dashboard/widgets/${widgetId}`);
    return response.data;
  },

  createWidget: async (data: CreateWidgetRequest): Promise<DashboardWidget> => {
    const response = await apiClient.post('/dashboard/widgets', data);
    return response.data;
  },

  updateWidget: async (widgetId: number, data: UpdateWidgetRequest): Promise<DashboardWidget> => {
    const response = await apiClient.put(`/dashboard/widgets/${widgetId}`, data);
    return response.data;
  },

  deleteWidget: async (widgetId: number): Promise<void> => {
    await apiClient.delete(`/dashboard/widgets/${widgetId}`);
  },

  updatePositions: async (updates: BulkWidgetPositionUpdate): Promise<void> => {
    await apiClient.post('/dashboard/widgets/positions', updates);
  },

  getWidgetData: async (widgetId: number): Promise<WidgetData> => {
    const response = await apiClient.get(`/dashboard/widgets/${widgetId}/data`);
    return response.data;
  },

  initializeDefaultWidgets: async (): Promise<DashboardWidget[]> => {
    const response = await apiClient.post('/dashboard/widgets/initialize');
    return response.data;
  },

  resetToDefaults: async (): Promise<DashboardWidget[]> => {
    const response = await apiClient.post('/dashboard/widgets/reset');
    return response.data;
  },
};

export default dashboardWidgetsApi;
