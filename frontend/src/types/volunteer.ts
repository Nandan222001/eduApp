export interface VolunteerActivity {
  id: number;
  activity_name: string;
  date: string;
  hours: number;
  supervisor_name: string;
  supervisor_email?: string;
  supervisor_phone?: string;
  description?: string;
  location?: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  notes?: string;
  parent_id: number;
  parent_name: string;
  student_id?: number;
  student_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VolunteerHoursSummary {
  total_hours: number;
  pending_hours: number;
  approved_hours: number;
  rejected_hours: number;
  activities_by_type: {
    activity_type: string;
    hours: number;
    count: number;
  }[];
  milestones: {
    milestone: string;
    target_hours: number;
    achieved: boolean;
  }[];
  next_milestone?: {
    name: string;
    hours_needed: number;
    target_hours: number;
  };
}

export interface VolunteerActivityForm {
  activity_name: string;
  date: string;
  hours: number;
  supervisor_name: string;
  supervisor_email?: string;
  supervisor_phone?: string;
  description?: string;
  location?: string;
  student_id?: number;
}

export interface VerificationRequest {
  activity_id: number;
  status: 'approved' | 'rejected';
  notes?: string;
  rejection_reason?: string;
}

export interface VolunteerLeaderboardEntry {
  rank: number;
  parent_id: number;
  parent_name: string;
  display_name: string;
  total_hours: number;
  activities_count: number;
  is_anonymous: boolean;
  grade_name?: string;
  student_count?: number;
}

export interface GradeVolunteerStats {
  grade_name: string;
  total_volunteers: number;
  total_students: number;
  participation_rate: number;
  total_hours: number;
  average_hours_per_volunteer: number;
  rank: number;
}

export interface CommunityImpactStats {
  total_volunteers: number;
  total_hours: number;
  total_activities: number;
  active_this_month: number;
  most_popular_activity: string;
  most_popular_activity_hours: number;
  hours_this_year: number;
  hours_last_year: number;
  growth_percentage: number;
  impact_metrics: {
    metric_name: string;
    value: number;
    unit: string;
  }[];
}

export interface VolunteerCertificate {
  certificate_id: string;
  parent_name: string;
  total_hours: number;
  academic_year: string;
  activities_breakdown: {
    activity_type: string;
    hours: number;
  }[];
  issue_date: string;
  principal_name: string;
  principal_signature?: string;
  school_logo?: string;
}

export interface VolunteerEngagementTrend {
  date: string;
  total_hours: number;
  activities_count: number;
  unique_volunteers: number;
}

export interface ActivityPopularity {
  activity_name: string;
  total_hours: number;
  participants_count: number;
  average_hours_per_activity: number;
}

export interface EventCorrelation {
  event_name: string;
  event_date: string;
  volunteer_hours_before: number;
  volunteer_hours_during: number;
  volunteer_hours_after: number;
  correlation_score: number;
}

export interface VolunteerAnalytics {
  engagement_trends: VolunteerEngagementTrend[];
  popular_activities: ActivityPopularity[];
  event_correlations: EventCorrelation[];
  monthly_summary: {
    month: string;
    total_hours: number;
    new_volunteers: number;
    active_volunteers: number;
  }[];
  demographics: {
    by_grade: {
      grade_name: string;
      volunteer_count: number;
      total_hours: number;
    }[];
    by_activity_type: {
      activity_type: string;
      volunteer_count: number;
      total_hours: number;
    }[];
  };
}
