import axios from '@/lib/axios';
import {
  ScanSubmission,
  ScanResponse,
  HomeworkScanResult,
  ProcessingProgress,
} from '@/types/homeworkScanner';

const homeworkScannerApi = {
  submitScan: async (data: ScanSubmission): Promise<ScanResponse> => {
    const response = await axios.post('/api/v1/homework-scanner/scan', data);
    return response.data;
  },

  getScanStatus: async (scanId: string): Promise<ProcessingProgress> => {
    const response = await axios.get(`/api/v1/homework-scanner/scan/${scanId}/status`);
    return response.data;
  },

  getScanResult: async (scanId: string): Promise<HomeworkScanResult> => {
    const response = await axios.get(`/api/v1/homework-scanner/scan/${scanId}/result`);
    return response.data;
  },

  listScans: async (studentId: number, limit: number = 10): Promise<HomeworkScanResult[]> => {
    const response = await axios.get('/api/v1/homework-scanner/scans', {
      params: { student_id: studentId, limit },
    });
    return response.data;
  },

  notifyTeacher: async (scanId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`/api/v1/homework-scanner/scan/${scanId}/notify-teacher`);
    return response.data;
  },

  deleteScan: async (scanId: string): Promise<void> => {
    await axios.delete(`/api/v1/homework-scanner/scan/${scanId}`);
  },

  uploadImage: async (imageData: string): Promise<{ imageUrl: string }> => {
    const response = await axios.post('/api/v1/homework-scanner/upload-image', {
      image: imageData,
    });
    return response.data;
  },
};

export default homeworkScannerApi;
