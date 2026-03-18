import { authApi } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';

jest.mock('../../src/api/client');

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call post with correct endpoint and credentials', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com' },
          access_token: 'token',
          refresh_token: 'refresh',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await authApi.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('should call post with correct endpoint and data', async () => {
      const mockResponse = { data: { id: 1, email: 'test@example.com' } };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const data = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
      };

      const result = await authApi.register(data);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', data);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should call post with logout endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('refreshToken', () => {
    it('should call post with refresh token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-token',
          refresh_token: 'new-refresh',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.refreshToken('old-refresh-token');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'old-refresh-token',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentUser', () => {
    it('should call get with me endpoint', async () => {
      const mockResponse = { data: { id: 1, email: 'test@example.com' } };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should call post with email', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await authApi.forgotPassword('test@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
    });
  });

  describe('changePassword', () => {
    it('should call post with password data', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await authApi.changePassword('oldpass', 'newpass');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        current_password: 'oldpass',
        new_password: 'newpass',
      });
    });
  });
});
