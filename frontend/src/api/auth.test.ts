import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/setupTests';
import { authApi } from './auth';
import axiosInstance from '@/lib/axios';
import {
  DEMO_CREDENTIALS,
  demoAuthResponse,
  TEACHER_CREDENTIALS,
  teacherAuthResponse,
  PARENT_CREDENTIALS,
  parentAuthResponse,
  ADMIN_CREDENTIALS,
  adminAuthResponse,
  SUPERADMIN_CREDENTIALS,
  superadminAuthResponse,
} from '@/data/dummyData';
import type { AuthResponse } from '@/types/auth';

describe('authApi.login', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Demo Student Credentials', () => {
    it('should return demoAuthResponse synchronously for demo student credentials without API call', async () => {
      let apiCallMade = false;

      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', () => {
          apiCallMade = true;
          return HttpResponse.json({
            user: {
              id: '999',
              email: 'other@example.com',
              firstName: 'Other',
              lastName: 'User',
              fullName: 'Other User',
              role: 'student',
              isActive: true,
              emailVerified: true,
              isSuperuser: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            tokens: {
              accessToken: 'api-access-token',
              refreshToken: 'api-refresh-token',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
          } as AuthResponse);
        })
      );

      const result = await authApi.login({
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
      });

      expect(apiCallMade).toBe(false);
      expect(result).toEqual(demoAuthResponse);
      expect(result.user.email).toBe('demo@example.com');
      expect(result.user.firstName).toBe('Alex');
      expect(result.user.lastName).toBe('Johnson');
      expect(result.user.role).toBe('student');
      expect(result.tokens.accessToken).toBe(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_access_token'
      );
    });

    it('should verify demo student credentials exact values', () => {
      expect(DEMO_CREDENTIALS.email).toBe('demo@example.com');
      expect(DEMO_CREDENTIALS.password).toBe('Demo@123');
    });

    it('should verify demoAuthResponse structure', () => {
      expect(demoAuthResponse).toHaveProperty('user');
      expect(demoAuthResponse).toHaveProperty('tokens');
      expect(demoAuthResponse.user.email).toBe(DEMO_CREDENTIALS.email);
      expect(demoAuthResponse.tokens).toHaveProperty('accessToken');
      expect(demoAuthResponse.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('Demo Teacher Credentials', () => {
    it('should return teacherAuthResponse synchronously for demo teacher credentials without API call', async () => {
      let apiCallMade = false;

      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', () => {
          apiCallMade = true;
          return HttpResponse.json({
            user: {
              id: '999',
              email: 'other@example.com',
              firstName: 'Other',
              lastName: 'User',
              fullName: 'Other User',
              role: 'teacher',
              isActive: true,
              emailVerified: true,
              isSuperuser: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            tokens: {
              accessToken: 'api-access-token',
              refreshToken: 'api-refresh-token',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
          } as AuthResponse);
        })
      );

      const result = await authApi.login({
        email: TEACHER_CREDENTIALS.email,
        password: TEACHER_CREDENTIALS.password,
      });

      expect(apiCallMade).toBe(false);
      expect(result).toEqual(teacherAuthResponse);
      expect(result.user.email).toBe('teacher@demo.com');
      expect(result.user.firstName).toBe('Emily');
      expect(result.user.lastName).toBe('Carter');
      expect(result.user.role).toBe('teacher');
    });

    it('should verify demo teacher credentials exact values', () => {
      expect(TEACHER_CREDENTIALS.email).toBe('teacher@demo.com');
      expect(TEACHER_CREDENTIALS.password).toBe('Demo@123');
    });
  });

  describe('Demo Parent Credentials', () => {
    it('should return parentAuthResponse synchronously for demo parent credentials without API call', async () => {
      let apiCallMade = false;

      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', () => {
          apiCallMade = true;
          return HttpResponse.json({
            user: {
              id: '999',
              email: 'other@example.com',
              firstName: 'Other',
              lastName: 'User',
              fullName: 'Other User',
              role: 'parent',
              isActive: true,
              emailVerified: true,
              isSuperuser: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            tokens: {
              accessToken: 'api-access-token',
              refreshToken: 'api-refresh-token',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
          } as AuthResponse);
        })
      );

      const result = await authApi.login({
        email: PARENT_CREDENTIALS.email,
        password: PARENT_CREDENTIALS.password,
      });

      expect(apiCallMade).toBe(false);
      expect(result).toEqual(parentAuthResponse);
      expect(result.user.email).toBe('parent@demo.com');
      expect(result.user.firstName).toBe('Robert');
      expect(result.user.lastName).toBe('Williams');
      expect(result.user.role).toBe('parent');
    });

    it('should verify demo parent credentials exact values', () => {
      expect(PARENT_CREDENTIALS.email).toBe('parent@demo.com');
      expect(PARENT_CREDENTIALS.password).toBe('Demo@123');
    });
  });

  describe('Demo Admin Credentials', () => {
    it('should return adminAuthResponse synchronously for demo admin credentials without API call', async () => {
      let apiCallMade = false;

      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', () => {
          apiCallMade = true;
          return HttpResponse.json({
            user: {
              id: '999',
              email: 'other@example.com',
              firstName: 'Other',
              lastName: 'User',
              fullName: 'Other User',
              role: 'admin',
              isActive: true,
              emailVerified: true,
              isSuperuser: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            tokens: {
              accessToken: 'api-access-token',
              refreshToken: 'api-refresh-token',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
          } as AuthResponse);
        })
      );

      const result = await authApi.login({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password,
      });

      expect(apiCallMade).toBe(false);
      expect(result).toEqual(adminAuthResponse);
      expect(result.user.email).toBe('admin@demo.com');
      expect(result.user.firstName).toBe('Michael');
      expect(result.user.lastName).toBe('Anderson');
      expect(result.user.role).toBe('institution_admin');
    });

    it('should verify demo admin credentials exact values', () => {
      expect(ADMIN_CREDENTIALS.email).toBe('admin@demo.com');
      expect(ADMIN_CREDENTIALS.password).toBe('Demo@123');
    });
  });

  describe('Demo SuperAdmin Credentials', () => {
    it('should return superadminAuthResponse synchronously for demo superadmin credentials without API call', async () => {
      let apiCallMade = false;

      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', () => {
          apiCallMade = true;
          return HttpResponse.json({
            user: {
              id: '999',
              email: 'other@example.com',
              firstName: 'Other',
              lastName: 'User',
              fullName: 'Other User',
              role: 'superadmin',
              isActive: true,
              emailVerified: true,
              isSuperuser: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            tokens: {
              accessToken: 'api-access-token',
              refreshToken: 'api-refresh-token',
              expiresIn: 3600,
              tokenType: 'Bearer',
            },
          } as AuthResponse);
        })
      );

      const result = await authApi.login({
        email: SUPERADMIN_CREDENTIALS.email,
        password: SUPERADMIN_CREDENTIALS.password,
      });

      expect(apiCallMade).toBe(false);
      expect(result).toEqual(superadminAuthResponse);
      expect(result.user.email).toBe('superadmin@demo.com');
      expect(result.user.firstName).toBe('Sarah');
      expect(result.user.lastName).toBe('Thompson');
      expect(result.user.role).toBe('superadmin');
    });

    it('should verify demo superadmin credentials exact values', () => {
      expect(SUPERADMIN_CREDENTIALS.email).toBe('superadmin@demo.com');
      expect(SUPERADMIN_CREDENTIALS.password).toBe('Demo@123');
    });
  });

  describe('Non-Demo Credentials', () => {
    // These hit authApi.login's real axios.post branch. happy-dom's Response
    // implementation doesn't support the ReadableStream body MSW's XHR
    // interceptor needs, so mock axios directly instead of via MSW/XHR.
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call backend API for non-demo credentials', async () => {
      const backendResponse = {
        user: {
          id: 2001,
          email: 'real@example.com',
          first_name: 'Real',
          last_name: 'User',
          role_slug: 'student',
          is_active: true,
          email_verified: true,
          is_superuser: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'real-access-token',
        refresh_token: 'real-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      const postSpy = vi
        .spyOn(axiosInstance, 'post')
        .mockResolvedValueOnce({ data: backendResponse });

      const result = await authApi.login({
        email: 'real@example.com',
        password: 'RealPassword123',
      });

      expect(postSpy).toHaveBeenCalledWith('/api/auth/login', {
        email: 'real@example.com',
        password: 'RealPassword123',
      });
      expect(result.user.email).toBe('real@example.com');
      expect(result.user.firstName).toBe('Real');
      expect(result.user.lastName).toBe('User');
      expect(result.tokens.accessToken).toBe('real-access-token');
    });

    it('should call backend API when email matches but password does not', async () => {
      const backendResponse = {
        user: {
          id: 3001,
          email: DEMO_CREDENTIALS.email,
          first_name: 'Demo',
          last_name: 'WrongPassword',
          role_slug: 'student',
          is_active: true,
          email_verified: true,
          is_superuser: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'wrong-password-token',
        refresh_token: 'wrong-password-refresh',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      const postSpy = vi
        .spyOn(axiosInstance, 'post')
        .mockResolvedValueOnce({ data: backendResponse });

      const result = await authApi.login({
        email: DEMO_CREDENTIALS.email,
        password: 'WrongPassword',
      });

      expect(postSpy).toHaveBeenCalled();
      expect(result.user.firstName).toBe('Demo');
    });

    it('should call backend API when password matches but email does not', async () => {
      const backendResponse = {
        user: {
          id: 4001,
          email: 'different@example.com',
          first_name: 'Different',
          last_name: 'Email',
          role_slug: 'teacher',
          is_active: true,
          email_verified: true,
          is_superuser: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        access_token: 'different-email-token',
        refresh_token: 'different-email-refresh',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      const postSpy = vi
        .spyOn(axiosInstance, 'post')
        .mockResolvedValueOnce({ data: backendResponse });

      const result = await authApi.login({
        email: 'different@example.com',
        password: DEMO_CREDENTIALS.password,
      });

      expect(postSpy).toHaveBeenCalled();
      expect(result.user.email).toBe('different@example.com');
    });
  });
});
