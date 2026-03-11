import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface TopicProbabilityRanking {
  topic_id?: number;
  topic_name: string;
  chapter_name?: string;
  probability_score: number;
  star_rating: number;
  confidence_level: string;
  frequency_count: number;
  last_appeared_year?: number;
  years_since_last_appearance: number;
  is_due: boolean;
  priority_tag: string;
  expected_marks: number;
  study_hours_recommended: number;
}

export interface QuestionPaperSection {
  section_name: string;
  total_marks: number;
  question_types: string[];
  topics_included: string[];
  difficulty_distribution: Record<string, number>;
  bloom_level_distribution: Record<string, number>;
}

export interface PredictedQuestionBlueprint {
  total_marks: number;
  duration_minutes: number;
  sections: QuestionPaperSection[];
  topic_coverage: Record<string, number>;
  difficulty_breakdown: Record<string, number>;
}

export interface MarksDistribution {
  category: string;
  marks: number;
  percentage: number;
  color: string;
}

export interface FocusAreaRecommendation {
  topic_id?: number;
  topic_name: string;
  chapter_name?: string;
  priority: string;
  priority_score: number;
  reason: string;
  expected_impact: string;
  study_hours_needed: number;
  resources: string[];
  difficulty_level: string;
}

export interface StudyTimeAllocation {
  category: string;
  hours: number;
  percentage: number;
  color: string;
  description: string;
}

export interface AIPredictionDashboardResponse {
  board: string;
  grade_id: number;
  subject_id: number;
  subject_name: string;
  generated_at: string;
  topic_rankings: TopicProbabilityRanking[];
  predicted_blueprint: PredictedQuestionBlueprint;
  marks_distribution: MarksDistribution[];
  focus_areas: FocusAreaRecommendation[];
  study_time_allocation: StudyTimeAllocation[];
  overall_prediction: Record<string, number | string>;
}

export interface DailyTask {
  task_id: string;
  date: string;
  topic_name: string;
  task_type: string;
  duration_hours: number;
  priority: string;
  description: string;
  resources: string[];
  is_completed: boolean;
}

export interface StudyPlanWeek {
  week_number: number;
  start_date: string;
  end_date: string;
  focus_topics: string[];
  total_hours: number;
  tasks: DailyTask[];
}

export interface StudyPlanRequest {
  board: string;
  grade_id: number;
  subject_id: number;
  exam_date: string;
  available_hours_per_day: number;
  weak_areas?: number[];
}

export interface StudyPlanResponse {
  exam_date: string;
  days_until_exam: number;
  total_study_hours: number;
  weeks: StudyPlanWeek[];
  completion_percentage: number;
  milestone_dates: Record<string, string>;
}

export interface WhatIfScenarioRequest {
  board: string;
  grade_id: number;
  subject_id: number;
  study_hours_adjustment: number;
  focus_topic_ids?: number[];
  practice_test_count: number;
}

export interface PredictionChange {
  metric: string;
  current_value: number;
  projected_value: number;
  change_percentage: number;
  impact_level: string;
}

export interface WhatIfScenarioResponse {
  current_predicted_score: number;
  projected_score: number;
  score_improvement: number;
  confidence_level: string;
  prediction_changes: PredictionChange[];
  recommended_adjustments: string[];
  risk_factors: string[];
}

export interface CrashCourseTopicPriority {
  topic_id?: number;
  topic_name: string;
  priority_level: number;
  time_to_study_hours: number;
  expected_marks: number;
  roi_score: number;
  quick_revision_points: string[];
  must_know_concepts: string[];
  practice_questions: string[];
}

export interface CrashCourseDay {
  day_number: number;
  date: string;
  morning_session: string[];
  afternoon_session: string[];
  evening_session: string[];
  revision_topics: string[];
  practice_tests: string[];
  total_hours: number;
}

export interface CrashCourseModeResponse {
  days_until_exam: number;
  mode_activated: boolean;
  priority_topics: CrashCourseTopicPriority[];
  daily_schedule: CrashCourseDay[];
  quick_wins: string[];
  topics_to_skip: string[];
  estimated_coverage: number;
  expected_score_range: Record<string, number>;
}

const aiPredictionDashboardApi = {
  getDashboard: async (
    board: string,
    gradeId: number,
    subjectId: number
  ): Promise<AIPredictionDashboardResponse> => {
    const response = await api.get('/ai-prediction-dashboard/dashboard', {
      params: { board, grade_id: gradeId, subject_id: subjectId },
    });
    return response.data;
  },

  generateStudyPlan: async (request: StudyPlanRequest): Promise<StudyPlanResponse> => {
    const response = await api.post('/ai-prediction-dashboard/study-plan', request);
    return response.data;
  },

  simulateWhatIfScenario: async (
    request: WhatIfScenarioRequest
  ): Promise<WhatIfScenarioResponse> => {
    const response = await api.post('/ai-prediction-dashboard/what-if-scenario', request);
    return response.data;
  },

  activateCrashCourseMode: async (
    board: string,
    gradeId: number,
    subjectId: number,
    daysUntilExam: number
  ): Promise<CrashCourseModeResponse> => {
    const response = await api.get('/ai-prediction-dashboard/crash-course-mode', {
      params: {
        board,
        grade_id: gradeId,
        subject_id: subjectId,
        days_until_exam: daysUntilExam,
      },
    });
    return response.data;
  },
};

export default aiPredictionDashboardApi;
