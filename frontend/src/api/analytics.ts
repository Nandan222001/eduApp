import axios from '@/lib/axios';
import {
  StudentPerformanceAnalytics,
  ClassPerformanceAnalytics,
  InstitutionAnalytics,
  CustomReportFilter,
  CustomReportData,
} from '@/types/analytics';

const analyticsApi = {
  getStudentPerformanceAnalytics: async (
    studentId: number,
    startDate?: string,
    endDate?: string
  ): Promise<StudentPerformanceAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`/api/v1/analytics/student/${studentId}?${params}`);
    return response.data;
  },

  getClassPerformanceAnalytics: async (
    classId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ClassPerformanceAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`/api/v1/analytics/class/${classId}?${params}`);
    return response.data;
  },

  getInstitutionAnalytics: async (
    institutionId: number,
    startDate?: string,
    endDate?: string
  ): Promise<InstitutionAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`/api/v1/analytics/institution/${institutionId}?${params}`);
    return response.data;
  },

  generateCustomReport: async (
    institutionId: number,
    filters: CustomReportFilter
  ): Promise<CustomReportData> => {
    const response = await axios.post(
      `/api/v1/analytics/institution/${institutionId}/custom-report`,
      filters
    );
    return response.data;
  },

  exportReportToPDF: async (reportData: CustomReportData): Promise<Blob> => {
    const response = await axios.post('/api/v1/analytics/export/pdf', reportData, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportReportToExcel: async (reportData: CustomReportData): Promise<Blob> => {
    const response = await axios.post('/api/v1/analytics/export/excel', reportData, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default analyticsApi;
