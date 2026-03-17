import axios from '@/lib/axios';
import {
  StudentJobListing,
  StudentJobListingCreate,
  StudentJobListingUpdate,
  WorkPermit,
  WorkPermitCreate,
  WorkPermitUpdate,
  StudentEmployment,
  StudentEmploymentCreate,
  StudentEmploymentUpdate,
  JobApplication,
  JobApplicationCreate,
  JobApplicationUpdate,
  StudentEmploymentSummary,
  EmploymentStatistics,
} from '@/types/employment';

export interface JobListingsParams {
  job_type?: string;
  employer_verified?: boolean;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

const employmentApi = {
  listJobListings: async (params?: JobListingsParams): Promise<StudentJobListing[]> => {
    const response = await axios.get('/api/v1/student-employment/job-listings', { params });
    return response.data;
  },

  getJobListing: async (id: number): Promise<StudentJobListing> => {
    const response = await axios.get(`/api/v1/student-employment/job-listings/${id}`);
    return response.data;
  },

  createJobListing: async (data: StudentJobListingCreate): Promise<StudentJobListing> => {
    const response = await axios.post('/api/v1/student-employment/job-listings', data);
    return response.data;
  },

  updateJobListing: async (id: number, data: StudentJobListingUpdate): Promise<StudentJobListing> => {
    const response = await axios.put(`/api/v1/student-employment/job-listings/${id}`, data);
    return response.data;
  },

  deleteJobListing: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/student-employment/job-listings/${id}`);
  },

  createJobApplication: async (data: JobApplicationCreate): Promise<JobApplication> => {
    const response = await axios.post('/api/v1/student-employment/applications', data);
    return response.data;
  },

  getStudentApplications: async (
    studentId: number,
    statusFilter?: string
  ): Promise<JobApplication[]> => {
    const response = await axios.get(`/api/v1/student-employment/applications/student/${studentId}`, {
      params: statusFilter ? { status_filter: statusFilter } : {},
    });
    return response.data;
  },

  updateJobApplication: async (id: number, data: JobApplicationUpdate): Promise<JobApplication> => {
    const response = await axios.put(`/api/v1/student-employment/applications/${id}`, data);
    return response.data;
  },

  createWorkPermit: async (data: WorkPermitCreate): Promise<WorkPermit> => {
    const response = await axios.post('/api/v1/student-employment/work-permits', data);
    return response.data;
  },

  getStudentWorkPermits: async (studentId: number, isActive?: boolean): Promise<WorkPermit[]> => {
    const response = await axios.get(`/api/v1/student-employment/work-permits/student/${studentId}`, {
      params: isActive !== undefined ? { is_active: isActive } : {},
    });
    return response.data;
  },

  getWorkPermit: async (id: number): Promise<WorkPermit> => {
    const response = await axios.get(`/api/v1/student-employment/work-permits/${id}`);
    return response.data;
  },

  updateWorkPermit: async (id: number, data: WorkPermitUpdate): Promise<WorkPermit> => {
    const response = await axios.put(`/api/v1/student-employment/work-permits/${id}`, data);
    return response.data;
  },

  authorizeWorkPermit: async (id: number, status: string): Promise<WorkPermit> => {
    const response = await axios.post(`/api/v1/student-employment/work-permits/${id}/authorize`, null, {
      params: { authorization_status: status },
    });
    return response.data;
  },

  getExpiringWorkPermits: async (days?: number): Promise<WorkPermit[]> => {
    const response = await axios.get('/api/v1/student-employment/work-permits/expiring', {
      params: days ? { days } : {},
    });
    return response.data;
  },

  createEmployment: async (data: StudentEmploymentCreate): Promise<StudentEmployment> => {
    const response = await axios.post('/api/v1/student-employment/employments', data);
    return response.data;
  },

  getStudentEmployments: async (
    studentId: number,
    isCurrent?: boolean,
    verifiedForGraduation?: boolean
  ): Promise<StudentEmployment[]> => {
    const params: Record<string, boolean> = {};
    if (isCurrent !== undefined) params.is_current = isCurrent;
    if (verifiedForGraduation !== undefined) params.verified_for_graduation = verifiedForGraduation;

    const response = await axios.get(`/api/v1/student-employment/employments/student/${studentId}`, {
      params,
    });
    return response.data;
  },

  getEmployment: async (id: number): Promise<StudentEmployment> => {
    const response = await axios.get(`/api/v1/student-employment/employments/${id}`);
    return response.data;
  },

  updateEmployment: async (id: number, data: StudentEmploymentUpdate): Promise<StudentEmployment> => {
    const response = await axios.put(`/api/v1/student-employment/employments/${id}`, data);
    return response.data;
  },

  verifyEmploymentForGraduation: async (
    employmentId: number,
    verified: boolean,
    notes?: string
  ): Promise<StudentEmployment> => {
    const response = await axios.post(`/api/v1/student-employment/employments/${employmentId}/verify`, {
      employment_id: employmentId,
      verified_for_graduation: verified,
      verification_notes: notes,
    });
    return response.data;
  },

  getStudentEmploymentSummary: async (studentId: number): Promise<StudentEmploymentSummary> => {
    const response = await axios.get(`/api/v1/student-employment/employments/student/${studentId}/summary`);
    return response.data;
  },

  getPendingEmploymentVerifications: async (limit?: number): Promise<StudentEmployment[]> => {
    const response = await axios.get('/api/v1/student-employment/employments/verification-pending', {
      params: limit ? { limit } : {},
    });
    return response.data;
  },

  getStatistics: async (): Promise<EmploymentStatistics> => {
    const response = await axios.get('/api/v1/student-employment/statistics/overview');
    return response.data;
  },
};

export default employmentApi;
