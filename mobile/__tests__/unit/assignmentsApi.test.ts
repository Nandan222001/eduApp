import { assignmentsApi } from '../../src/api/assignments';
import { apiClient } from '../../src/api/client';

jest.mock('../../src/api/client');

describe('assignmentsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssignments', () => {
    it('should call get with correct endpoint and params', async () => {
      const mockResponse = { data: [{ id: 1, title: 'Test Assignment' }] };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await assignmentsApi.getAssignments({ status: 'pending', page: 1, limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/assignments?status=pending&page=1&limit=10');
      expect(result).toEqual(mockResponse);
    });

    it('should call get without params', async () => {
      const mockResponse = { data: [] };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await assignmentsApi.getAssignments();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/assignments');
    });
  });

  describe('getAssignmentDetail', () => {
    it('should call get with assignment id', async () => {
      const mockResponse = { data: { id: 1, title: 'Test Assignment' } };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await assignmentsApi.getAssignmentDetail('1');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/assignments/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('submitAssignment', () => {
    it('should call post with submission data', async () => {
      const mockResponse = { data: { id: 1, submittedAt: '2024-01-01' } };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const data = {
        assignmentId: 1,
        comments: 'Test submission',
        attachments: [
          {
            fileName: 'test.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            fileData: 'base64data',
          },
        ],
      };

      const result = await assignmentsApi.submitAssignment(data);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/submissions', data);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateSubmission', () => {
    it('should call put with submission id and data', async () => {
      const mockResponse = { data: { id: 1, comments: 'Updated' } };
      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const data = { comments: 'Updated comments' };
      const result = await assignmentsApi.updateSubmission(1, data);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/submissions/1', data);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteSubmission', () => {
    it('should call delete with submission id', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await assignmentsApi.deleteSubmission(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/submissions/1');
    });
  });
});
