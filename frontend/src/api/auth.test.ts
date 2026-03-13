import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/setupTests';
import { authApi } from './auth';
import { DEMO_CREDENTIALS, demoAuthResponse } from '@/data/dummyData';
import type { AuthResponse } from '@/types/auth';

describe('authApi.login', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('should return demoAuthResponse synchronously for demo credentials without API call', async () => {
    let apiCallMade = false;

    server.use(
      http.post('http://localhost:8000/api/auth/login', () => {
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
    expect(result.tokens.accessToken).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_access_token'
    );
  });

  it('should call backend API for non-demo credentials', async () => {
    let apiCallMade = false;
    const mockApiResponse: AuthResponse = {
      user: {
        id: '2001',
        email: 'real@example.com',
        firstName: 'Real',
        lastName: 'User',
        fullName: 'Real User',
        role: 'student',
        isActive: true,
        emailVerified: true,
        isSuperuser: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      tokens: {
        accessToken: 'real-access-token',
        refreshToken: 'real-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    };

    server.use(
      http.post('http://localhost:8000/api/auth/login', async ({ request }) => {
        apiCallMade = true;
        const body = (await request.json()) as { email: string; password: string };
        expect(body.email).toBe('real@example.com');
        expect(body.password).toBe('RealPassword123');
        return HttpResponse.json(mockApiResponse);
      })
    );

    const result = await authApi.login({
      email: 'real@example.com',
      password: 'RealPassword123',
    });

    expect(apiCallMade).toBe(true);
    expect(result).toEqual(mockApiResponse);
    expect(result.user.email).toBe('real@example.com');
    expect(result.tokens.accessToken).toBe('real-access-token');
  });

  it('should call backend API when email matches but password does not', async () => {
    let apiCallMade = false;
    const mockApiResponse: AuthResponse = {
      user: {
        id: '3001',
        email: DEMO_CREDENTIALS.email,
        firstName: 'Demo',
        lastName: 'WrongPassword',
        fullName: 'Demo WrongPassword',
        role: 'student',
        isActive: true,
        emailVerified: true,
        isSuperuser: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      tokens: {
        accessToken: 'wrong-password-token',
        refreshToken: 'wrong-password-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    };

    server.use(
      http.post('http://localhost:8000/api/auth/login', () => {
        apiCallMade = true;
        return HttpResponse.json(mockApiResponse);
      })
    );

    const result = await authApi.login({
      email: DEMO_CREDENTIALS.email,
      password: 'WrongPassword',
    });

    expect(apiCallMade).toBe(true);
    expect(result).toEqual(mockApiResponse);
    expect(result.user.firstName).toBe('Demo');
  });

  it('should call backend API when password matches but email does not', async () => {
    let apiCallMade = false;
    const mockApiResponse: AuthResponse = {
      user: {
        id: '4001',
        email: 'different@example.com',
        firstName: 'Different',
        lastName: 'Email',
        fullName: 'Different Email',
        role: 'teacher',
        isActive: true,
        emailVerified: true,
        isSuperuser: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      tokens: {
        accessToken: 'different-email-token',
        refreshToken: 'different-email-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    };

    server.use(
      http.post('http://localhost:8000/api/auth/login', () => {
        apiCallMade = true;
        return HttpResponse.json(mockApiResponse);
      })
    );

    const result = await authApi.login({
      email: 'different@example.com',
      password: DEMO_CREDENTIALS.password,
    });

    expect(apiCallMade).toBe(true);
    expect(result).toEqual(mockApiResponse);
    expect(result.user.email).toBe('different@example.com');
  });

  it('should verify demo credentials exact values', () => {
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
