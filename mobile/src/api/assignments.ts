import { apiClient } from './client';

export interface AssignmentDetail {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  subject: string;
  subjectCode?: string;
  teacherName?: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  totalMarks?: number;
  obtainedMarks?: number;
  submittedAt?: string;
  feedback?: string;
  attachments?: AssignmentAttachment[];
  submission?: AssignmentSubmission;
  createdAt: string;
}

export interface AssignmentAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface AssignmentSubmission {
  id: number;
  submittedAt: string;
  status: 'submitted' | 'graded';
  comments?: string;
  grade?: number;
  feedback?: string;
  attachments: SubmissionAttachment[];
}

export interface SubmissionAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface SubmitAssignmentData {
  assignmentId: number;
  comments?: string;
  attachments: SubmitAttachmentData[];
}

export interface SubmitAttachmentData {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
}

export interface AssignmentsListParams {
  status?: 'pending' | 'submitted' | 'graded' | 'overdue';
  page?: number;
  limit?: number;
}

export const assignmentsApi = {
  getAssignments: async (params?: AssignmentsListParams) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/api/v1/assignments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<AssignmentDetail[]>(url);
  },

  getAssignmentDetail: async (assignmentId: string) => {
    return apiClient.get<AssignmentDetail>(`/api/v1/assignments/${assignmentId}`);
  },

  submitAssignment: async (data: SubmitAssignmentData) => {
    return apiClient.post<AssignmentSubmission>(
      `/api/v1/submissions`,
      data
    );
  },

  updateSubmission: async (submissionId: number, data: Partial<SubmitAssignmentData>) => {
    return apiClient.put<AssignmentSubmission>(
      `/api/v1/submissions/${submissionId}`,
      data
    );
  },

  deleteSubmission: async (submissionId: number) => {
    return apiClient.delete(`/api/v1/submissions/${submissionId}`);
  },
};
