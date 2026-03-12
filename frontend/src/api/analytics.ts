import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface AnalyticsDashboardStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  total_sessions: number;
  avg_session_duration: number;
  total_page_views: number;
  avg_pages_per_session: number;
}

export interface FeatureAdoptionStats {
  feature_name: string;
  total_users: number;
  total_usage: number;
  unique_users_today: number;
  unique_users_week: number;
  unique_users_month: number;
  adoption_rate: number;
}

export interface UserFlowNode {
  page: string;
  count: number;
  drop_off_rate: number;
}

export interface UserFlowAnalysis {
  nodes: UserFlowNode[];
  total_sessions: number;
}

export interface RetentionCohort {
  cohort_date: string;
  users_count: number;
  retention_day_1: number;
  retention_day_7: number;
  retention_day_14: number;
  retention_day_30: number;
}

export interface TopEventStats {
  event_name: string;
  event_type: string;
  count: number;
  unique_users: number;
}

export interface PerformanceStats {
  metric_name: string;
  avg_value: number;
  p50_value: number;
  p75_value: number;
  p95_value: number;
  good_count: number;
  needs_improvement_count: number;
  poor_count: number;
}

export const analyticsApi = {
  getDashboardStats: async (institutionId?: string): Promise<AnalyticsDashboardStats> => {
    const params = institutionId ? { institution_id: institutionId } : {};
    const response = await axios.get(`${API_URL}/api/v1/analytics/dashboard`, { params });
    return response.data;
  },

  getFeatureAdoption: async (
    institutionId?: string,
    limit = 20
  ): Promise<FeatureAdoptionStats[]> => {
    const params = { limit, ...(institutionId ? { institution_id: institutionId } : {}) };
    const response = await axios.get(`${API_URL}/api/v1/analytics/features/adoption`, {
      params,
    });
    return response.data;
  },

  getUserFlow: async (institutionId?: string, limit = 10): Promise<UserFlowAnalysis> => {
    const params = { limit, ...(institutionId ? { institution_id: institutionId } : {}) };
    const response = await axios.get(`${API_URL}/api/v1/analytics/user-flow`, { params });
    return response.data;
  },

  getRetentionCohorts: async (
    institutionId?: string,
    cohortDays = 30
  ): Promise<RetentionCohort[]> => {
    const params = {
      cohort_days: cohortDays,
      ...(institutionId ? { institution_id: institutionId } : {}),
    };
    const response = await axios.get(`${API_URL}/api/v1/analytics/retention/cohorts`, {
      params,
    });
    return response.data;
  },

  getTopEvents: async (institutionId?: string, limit = 20): Promise<TopEventStats[]> => {
    const params = { limit, ...(institutionId ? { institution_id: institutionId } : {}) };
    const response = await axios.get(`${API_URL}/api/v1/analytics/events/top`, { params });
    return response.data;
  },

  getPerformanceStats: async (metricName?: string, days = 7): Promise<PerformanceStats[]> => {
    const params = { days, ...(metricName ? { metric_name: metricName } : {}) };
    const response = await axios.get(`${API_URL}/api/v1/analytics/performance/stats`, {
      params,
    });
    return response.data;
  },
};
