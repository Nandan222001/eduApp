import axios from '@/lib/axios';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
}

export enum CorrectionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Attendance {
  id: number;
  institution_id: number;
  student_id: number;
  section_id?: number;
  subject_id?: number;
  date: string;
  status: AttendanceStatus;
  marked_by_id?: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkAttendanceItem {
  student_id: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkAttendanceCreate {
  date: string;
  section_id?: number;
  subject_id?: number;
  attendances: BulkAttendanceItem[];
  [key: string]: unknown;
}

export interface BulkAttendanceResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    student_id: number;
    error: string;
  }>;
}

export interface AttendanceCorrectionCreate {
  institution_id: number;
  attendance_id: number;
  new_status: AttendanceStatus;
  reason: string;
  requested_by_id?: number;
}

export interface AttendanceCorrectionResponse {
  id: number;
  institution_id: number;
  attendance_id: number;
  requested_by_id?: number;
  old_status: AttendanceStatus;
  new_status: AttendanceStatus;
  reason: string;
  status: CorrectionStatus;
  reviewed_by_id?: number;
  review_remarks?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendanceReport {
  student_id: number;
  student_name: string;
  admission_number?: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  attendance_percentage: number;
}

export interface AttendanceDefaulter {
  student_id: number;
  student_name: string;
  admission_number?: string;
  section_name?: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  attendance_percentage: number;
}

export interface DateRangeAttendance {
  date: string;
  status: AttendanceStatus;
  subject_id?: number;
  subject_name?: string;
  marked_by_id?: number;
  remarks?: string;
}

export interface StudentAttendanceDetail {
  student_id: number;
  student_name: string;
  admission_number?: string;
  attendances: DateRangeAttendance[];
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  attendance_percentage: number;
}

export interface AttendanceListResponse {
  items: Attendance[];
  total: number;
  skip: number;
  limit: number;
}

export interface ClassRosterStudent {
  id: number;
  first_name: string;
  last_name: string;
  admission_number?: string;
  roll_number?: string;
  photo_url?: string;
  status: AttendanceStatus;
  remarks?: string;
  attendance_id?: number;
}

export interface MonthlyAttendanceData {
  date: string;
  status: AttendanceStatus;
}

const attendanceApi = {
  bulkMarkAttendance: async (data: BulkAttendanceCreate): Promise<BulkAttendanceResult> => {
    const response = await axios.post<BulkAttendanceResult>('/api/v1/attendance/bulk', data);
    return response.data;
  },

  listAttendances: async (params: {
    start_date?: string;
    end_date?: string;
    section_id?: number;
    subject_id?: number;
    student_id?: number;
    status?: AttendanceStatus;
    skip?: number;
    limit?: number;
  }): Promise<AttendanceListResponse> => {
    const response = await axios.get<AttendanceListResponse>('/api/v1/attendance/', {
      params,
    });
    return response.data;
  },

  getAttendance: async (attendanceId: number): Promise<Attendance> => {
    const response = await axios.get<Attendance>(`/api/v1/attendance/${attendanceId}`);
    return response.data;
  },

  updateAttendance: async (
    attendanceId: number,
    data: { status?: AttendanceStatus; remarks?: string }
  ): Promise<Attendance> => {
    const response = await axios.put<Attendance>(`/api/v1/attendance/${attendanceId}`, data);
    return response.data;
  },

  requestCorrection: async (
    data: AttendanceCorrectionCreate
  ): Promise<AttendanceCorrectionResponse> => {
    const response = await axios.post<AttendanceCorrectionResponse>(
      '/api/v1/attendance/corrections',
      data
    );
    return response.data;
  },

  listCorrections: async (params: {
    status?: CorrectionStatus;
    skip?: number;
    limit?: number;
  }): Promise<{
    items: AttendanceCorrectionResponse[];
    total: number;
    skip: number;
    limit: number;
  }> => {
    const response = await axios.get('/api/v1/attendance/corrections', { params });
    return response.data;
  },

  getSectionReport: async (
    sectionId: number,
    startDate: string,
    endDate: string,
    subjectId?: number
  ): Promise<StudentAttendanceReport[]> => {
    const response = await axios.get<StudentAttendanceReport[]>(
      `/api/v1/attendance/reports/section/${sectionId}`,
      {
        params: {
          start_date: startDate,
          end_date: endDate,
          subject_id: subjectId,
        },
      }
    );
    return response.data;
  },

  getStudentDetailedReport: async (
    studentId: number,
    startDate: string,
    endDate: string,
    subjectId?: number
  ): Promise<StudentAttendanceDetail> => {
    const response = await axios.get<StudentAttendanceDetail>(
      `/api/v1/attendance/reports/student/${studentId}`,
      {
        params: {
          start_date: startDate,
          end_date: endDate,
          subject_id: subjectId,
        },
      }
    );
    return response.data;
  },

  getDefaulters: async (
    startDate: string,
    endDate: string,
    thresholdPercentage: number = 75.0,
    sectionId?: number,
    subjectId?: number
  ): Promise<AttendanceDefaulter[]> => {
    const response = await axios.get<AttendanceDefaulter[]>(
      '/api/v1/attendance/reports/defaulters',
      {
        params: {
          start_date: startDate,
          end_date: endDate,
          threshold_percentage: thresholdPercentage,
          section_id: sectionId,
          subject_id: subjectId,
        },
      }
    );
    return response.data;
  },
};

export default attendanceApi;
