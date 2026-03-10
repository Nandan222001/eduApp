import axios from '@/lib/axios';

export interface InstitutionOverview {
  student_count: number;
  teacher_count: number;
  total_users: number;
}

export interface TodayAttendanceSummary {
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface RecentExamResult {
  exam_id: number;
  exam_name: string;
  exam_type: string;
  date: string;
  total_students: number;
  passed_students: number;
  average_percentage: number;
}

export interface UpcomingEvent {
  id: number;
  title: string;
  event_type: string;
  date: string;
  description: string;
}

export interface PendingTask {
  id: string;
  task_type: string;
  title: string;
  description: string;
  count: number;
  priority: string;
  due_date: string | null;
}

export interface PerformanceTrend {
  month: string;
  average_score: number;
  attendance_rate: number;
  student_count: number;
}

export interface QuickStatistic {
  label: string;
  value: string;
  trend: string | null;
  icon: string;
}

export interface DashboardResponse {
  overview: InstitutionOverview;
  attendance_summary: TodayAttendanceSummary;
  recent_exam_results: RecentExamResult[];
  upcoming_events: UpcomingEvent[];
  pending_tasks: PendingTask[];
  performance_trends: PerformanceTrend[];
  quick_statistics: QuickStatistic[];
}

const institutionAdminApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await axios.get<DashboardResponse>('/api/v1/institution-admin/dashboard');
    return response.data;
  },
};

export default institutionAdminApi;
