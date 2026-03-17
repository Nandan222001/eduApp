export interface StudentJobListing {
  id: number;
  institution_id: number;
  employer_name: string;
  job_title: string;
  job_type: 'part_time' | 'seasonal' | 'internship' | 'volunteer';
  description: string;
  requirements?: string;
  hourly_pay?: number;
  hours_per_week?: number;
  location?: string;
  application_link?: string;
  posting_date: string;
  expiry_date?: string;
  employer_verified: boolean;
  application_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentJobListingCreate {
  institution_id: number;
  employer_name: string;
  job_title: string;
  job_type: string;
  description: string;
  requirements?: string;
  hourly_pay?: number;
  hours_per_week?: number;
  location?: string;
  application_link?: string;
  expiry_date?: string;
  employer_verified?: boolean;
}

export interface StudentJobListingUpdate {
  employer_name?: string;
  job_title?: string;
  job_type?: string;
  description?: string;
  requirements?: string;
  hourly_pay?: number;
  hours_per_week?: number;
  location?: string;
  application_link?: string;
  expiry_date?: string;
  employer_verified?: boolean;
  is_active?: boolean;
}

export interface WorkPermit {
  id: number;
  institution_id: number;
  student_id: number;
  permit_type: 'state_specific';
  issue_date: string;
  expiry_date: string;
  employer_name?: string;
  max_hours_per_week?: number;
  school_authorization_status: 'pending' | 'approved' | 'denied' | 'expired';
  parent_consent: boolean;
  permit_number?: string;
  restrictions?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkPermitCreate {
  institution_id: number;
  student_id: number;
  permit_type: string;
  issue_date: string;
  expiry_date: string;
  employer_name?: string;
  max_hours_per_week?: number;
  parent_consent?: boolean;
  permit_number?: string;
  restrictions?: string;
  notes?: string;
}

export interface WorkPermitUpdate {
  permit_type?: string;
  issue_date?: string;
  expiry_date?: string;
  employer_name?: string;
  max_hours_per_week?: number;
  school_authorization_status?: string;
  parent_consent?: boolean;
  permit_number?: string;
  restrictions?: string;
  notes?: string;
  is_active?: boolean;
}

export interface StudentEmployment {
  id: number;
  institution_id: number;
  student_id: number;
  work_permit_id?: number;
  employer: string;
  job_title: string;
  job_type: 'part_time' | 'seasonal' | 'internship' | 'volunteer';
  start_date: string;
  end_date?: string;
  hours_per_week?: number;
  hourly_pay?: number;
  skills_gained?: string;
  responsibilities?: string;
  supervisor_name?: string;
  supervisor_reference?: string;
  supervisor_contact?: string;
  is_current: boolean;
  verified_for_graduation: boolean;
  verification_date?: string;
  verified_by?: number;
  total_hours_worked?: number;
  performance_rating?: number;
  would_recommend?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentEmploymentCreate {
  institution_id: number;
  student_id: number;
  work_permit_id?: number;
  employer: string;
  job_title: string;
  job_type: string;
  start_date: string;
  end_date?: string;
  hours_per_week?: number;
  hourly_pay?: number;
  skills_gained?: string;
  responsibilities?: string;
  supervisor_name?: string;
  supervisor_reference?: string;
  supervisor_contact?: string;
  is_current?: boolean;
  total_hours_worked?: number;
  performance_rating?: number;
  would_recommend?: boolean;
}

export interface StudentEmploymentUpdate {
  employer?: string;
  job_title?: string;
  job_type?: string;
  start_date?: string;
  end_date?: string;
  hours_per_week?: number;
  hourly_pay?: number;
  skills_gained?: string;
  responsibilities?: string;
  supervisor_name?: string;
  supervisor_reference?: string;
  supervisor_contact?: string;
  is_current?: boolean;
  total_hours_worked?: number;
  performance_rating?: number;
  would_recommend?: boolean;
  is_active?: boolean;
}

export interface JobApplication {
  id: number;
  institution_id: number;
  student_id: number;
  job_listing_id: number;
  application_date: string;
  status: string;
  cover_letter?: string;
  resume_url?: string;
  notes?: string;
  interview_date?: string;
  response_date?: string;
  outcome?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  job_listing?: StudentJobListing;
}

export interface JobApplicationCreate {
  institution_id: number;
  student_id: number;
  job_listing_id: number;
  cover_letter?: string;
  resume_url?: string;
  notes?: string;
}

export interface JobApplicationUpdate {
  status?: string;
  cover_letter?: string;
  resume_url?: string;
  notes?: string;
  interview_date?: string;
  response_date?: string;
  outcome?: string;
}

export interface StudentEmploymentSummary {
  student_id: number;
  total_jobs: number;
  current_jobs: number;
  total_hours_worked: number;
  verified_jobs: number;
  job_types_summary: Record<string, number>;
}

export interface EmploymentStatistics {
  active_job_listings: number;
  total_applications: number;
  active_employments: number;
  active_work_permits: number;
  pending_verifications: number;
}

export interface ParentConsentSignature {
  parent_name: string;
  signature_data: string;
  signature_date: string;
  consent_granted: boolean;
}

export interface WorkHourAlert {
  student_id: number;
  current_weekly_hours: number;
  max_allowed_hours: number;
  warning_threshold_reached: boolean;
}
