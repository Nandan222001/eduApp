# API Integration Guide

This guide documents all backend API endpoints used by the EDU Mobile app, authentication flow, request/response formats, and error handling patterns.

## Table of Contents

- [Base Configuration](#base-configuration)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Retry Logic](#retry-logic)
- [Offline Support](#offline-support)
- [Testing API Integration](#testing-api-integration)

## Base Configuration

### API Client Setup

The app uses a centralized Axios client configured in `src/api/client.ts`:

```typescript
const apiClient = axios.create({
  baseURL: API_URL,  // From environment variables
  timeout: API_TIMEOUT, // Default: 30000ms
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Environment Variables

```bash
# Development
API_URL=http://localhost:8000

# Staging
API_URL=https://staging-api.edu.app

# Production
API_URL=https://api.edu.app
```

## Authentication Flow

### 1. Login

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "student@example.com",
  "password": "password123",
  "otp": "123456"  // Optional, for 2FA
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "institutionId": 1
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  }
}
```

### 2. Token Storage

Tokens are securely stored using Expo Secure Store:

```typescript
await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
```

### 3. Token Refresh

**Endpoint**: `POST /auth/refresh`

**Request**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  }
}
```

### 4. Auto Token Refresh

The API client automatically refreshes expired tokens when receiving 401 responses.

### 5. Logout

**Endpoint**: `POST /auth/logout`

**Request**: No body (token in Authorization header)

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | No | User login |
| `/auth/register` | POST | No | User registration |
| `/auth/logout` | POST | Yes | User logout |
| `/auth/refresh` | POST | No | Refresh access token |
| `/auth/me` | GET | Yes | Get current user |
| `/auth/forgot-password` | POST | No | Request password reset |
| `/auth/reset-password` | POST | No | Reset password with token |
| `/auth/change-password` | POST | Yes | Change password |
| `/auth/request-otp` | POST | No | Request OTP for 2FA |
| `/auth/verify-otp` | POST | No | Verify OTP |

### Student Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/students/me` | GET | Yes | Get student profile |
| `/api/v1/students/me` | PUT | Yes | Update student profile |

### Assignment Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/assignments` | GET | Yes | List assignments |
| `/api/v1/assignments/{id}` | GET | Yes | Get assignment details |
| `/api/v1/submissions` | POST | Yes | Submit assignment |
| `/api/v1/submissions/{id}` | PUT | Yes | Update submission |
| `/api/v1/submissions/{id}` | DELETE | Yes | Delete submission |

**Query Parameters for Listing**:
- `status`: pending, submitted, graded, overdue
- `page`: Page number
- `limit`: Items per page

### Schedule Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/schedule` | GET | Yes | Get class schedule |
| `/api/v1/schedule/timetable` | GET | Yes | Get weekly timetable |

**Query Parameters**:
- `date`: YYYY-MM-DD format
- `week`: ISO week number

### Grades Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/grades` | GET | Yes | List all grades |
| `/api/v1/grades/assignment/{id}` | GET | Yes | Get grade by assignment |
| `/api/v1/grades/performance` | GET | Yes | Get performance analytics |

### Attendance Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/attendance` | GET | Yes | Get attendance records |
| `/api/v1/attendance/mark` | POST | Yes | Mark attendance (QR) |
| `/api/v1/attendance/summary` | GET | Yes | Get attendance summary |

### Study Materials Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/study-materials` | GET | Yes | List study materials |
| `/api/v1/study-materials/{id}` | GET | Yes | Get material details |
| `/api/v1/study-materials/{id}/download` | GET | Yes | Download material |

### Doubt Forum Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/doubts` | GET | Yes | List doubts |
| `/api/v1/doubts` | POST | Yes | Post new doubt |
| `/api/v1/doubts/{id}` | GET | Yes | Get doubt details |
| `/api/v1/doubts/{id}/answers` | POST | Yes | Post answer |

### Gamification Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/gamification/progress` | GET | Yes | Get user progress |
| `/api/v1/gamification/leaderboard` | GET | Yes | Get leaderboard |
| `/api/v1/gamification/badges` | GET | Yes | Get badges |

### Goals Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/goals` | GET | Yes | List goals |
| `/api/v1/goals` | POST | Yes | Create goal |
| `/api/v1/goals/{id}` | PUT | Yes | Update goal |
| `/api/v1/goals/{id}/progress` | PUT | Yes | Update progress |

### Notifications Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/notifications` | GET | Yes | List notifications |
| `/api/v1/notifications/{id}/read` | PUT | Yes | Mark as read |
| `/api/v1/notifications/unread-count` | GET | Yes | Get unread count |
| `/api/v1/notifications/preferences` | GET | Yes | Get preferences |
| `/api/v1/notifications/preferences` | PUT | Yes | Update preferences |
| `/api/v1/notifications/register-device` | POST | Yes | Register device token |

### AI Predictions Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/predictions/performance` | GET | Yes | Get performance predictions |
| `/api/v1/predictions/recommendations` | GET | Yes | Get study recommendations |

### Examinations Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/examinations` | GET | Yes | List examinations |
| `/api/v1/examinations/{id}` | GET | Yes | Get exam details |
| `/api/v1/examinations/{id}/results` | GET | Yes | Get exam results |

### Parent Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/parents/children` | GET | Yes | List linked children |
| `/api/v1/parents/children/{id}/progress` | GET | Yes | Get child progress |
| `/api/v1/parents/children/{id}/attendance` | GET | Yes | Get child attendance |
| `/api/v1/messages` | GET | Yes | Get messages |
| `/api/v1/messages` | POST | Yes | Send message |

### Events Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/events` | GET | Yes | List events |
| `/api/v1/events/{id}` | GET | Yes | Get event details |
| `/api/v1/events/{id}/rsvp` | POST | Yes | RSVP to event |

### Fees Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/fees` | GET | Yes | Get fee structure |
| `/api/v1/fees/payments` | GET | Yes | Get payment history |

## Request/Response Format

### Standard Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { /* Response data */ },
  "message": "Optional message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field_name": ["Error detail 1", "Error detail 2"]
  },
  "code": "ERROR_CODE"
}
```

### Common Status Codes

| Code | Meaning | Handling |
|------|---------|----------|
| 200 | Success | Process response data |
| 201 | Created | Resource created successfully |
| 204 | No Content | Action completed, no data returned |
| 400 | Bad Request | Show validation errors |
| 401 | Unauthorized | Refresh token or redirect to login |
| 403 | Forbidden | Show permission error |
| 404 | Not Found | Show "not found" message |
| 422 | Validation Error | Show field-specific errors |
| 429 | Too Many Requests | Wait and retry |
| 500 | Server Error | Show generic error, retry |
| 503 | Service Unavailable | Show maintenance message |

## Error Handling

### Error Types

```typescript
interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}
```

### Error Handler Implementation

```typescript
const handleError = (error: any): ApiError => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors,
        status: error.response.status,
        code: error.response.data?.code,
      };
    } else if (error.request) {
      // Request made but no response
      if (error.code === 'ECONNABORTED') {
        return {
          message: 'Request timeout. Please try again.',
          status: 408,
        };
      }
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    }
  }
  
  return {
    message: error.message || 'An unexpected error occurred',
  };
};
```

### Usage in Components

```typescript
try {
  const response = await assignmentsApi.getAssignments();
  setData(response.data);
  setError(null);
} catch (error: any) {
  setError(error.message);
  Alert.alert('Error', error.message);
}
```

## Retry Logic

### Automatic Retry Configuration

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,  // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};
```

### Exponential Backoff

```typescript
// Retry delays with exponential backoff:
// Retry 1: 1000ms
// Retry 2: 2000ms
// Retry 3: 4000ms
const delay = retryDelay * Math.pow(2, retryCount - 1);
```

### Custom Retry Configuration

```typescript
const response = await apiClient.get('/api/v1/data', {
  retry: {
    maxRetries: 5,
    retryDelay: 2000,
    retryableStatuses: [500, 503],
  },
});
```

## Offline Support

### Offline Queue

Critical operations are queued when offline:

```typescript
import { offlineAwareApi } from '@api/offlineAwareApi';

// Queue this request if offline
await offlineAwareApi.post('/api/v1/assignments/submit', data, {
  offlineKey: 'submit-assignment-123',
  offlineData: data,
});
```

### Automatic Sync

Queued requests sync automatically when connection is restored:

```typescript
// Triggered by network state change
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncService.syncAllQueues();
  }
});
```

### Offline-First Data

Some data is cached locally for offline access:

- Class schedules
- Study materials (if downloaded)
- Grades and attendance records
- Notifications

## Testing API Integration

### Mock API Responses

```typescript
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@api/client';

const mock = new MockAdapter(apiClient);

describe('Assignments API', () => {
  afterEach(() => {
    mock.reset();
  });

  it('fetches assignments successfully', async () => {
    const mockData = [
      { id: 1, title: 'Math Homework', status: 'pending' },
    ];

    mock.onGet('/api/v1/assignments').reply(200, {
      success: true,
      data: mockData,
    });

    const response = await assignmentsApi.getAssignments();
    expect(response.data).toEqual(mockData);
  });
});
```

### Testing with MSW (Mock Service Worker)

```typescript
import { rest } from 'msw';

export const handlers = [
  rest.get('*/api/v1/assignments', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [{ id: 1, title: 'Test Assignment' }],
      })
    );
  }),
];
```

## Best Practices

1. **Centralized API Client**: Always use the configured API client
2. **Type Safety**: Define TypeScript interfaces for all requests/responses
3. **Error Handling**: Handle errors gracefully with user-friendly messages
4. **Loading States**: Show loading indicators during API calls
5. **Retry Logic**: Use automatic retry for transient failures
6. **Offline Support**: Queue critical operations when offline
7. **Caching**: Cache frequently accessed data
8. **Rate Limiting**: Respect API rate limits
9. **Security**: Never log sensitive data or tokens
10. **Testing**: Mock all API calls in tests

## Performance Optimization

### Request Batching

```typescript
// Batch multiple requests
const [assignments, grades, schedule] = await Promise.all([
  assignmentsApi.getAssignments(),
  gradesApi.getGrades(),
  scheduleApi.getSchedule(),
]);
```

### Response Caching

```typescript
// Use React Query or similar for caching
const { data, isLoading } = useQuery(
  'assignments',
  () => assignmentsApi.getAssignments(),
  { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
);
```

### Pagination

Always use pagination for large data sets:

```typescript
const fetchAssignments = async (page: number = 1, limit: number = 20) => {
  return assignmentsApi.getAssignments({ page, limit });
};
```

## Troubleshooting

### Common Issues

**Request Timeout**
- Check network connection
- Increase timeout value
- Check backend server status

**401 Unauthorized**
- Token expired (auto-refreshed by interceptor)
- Invalid credentials
- Token not stored properly

**429 Too Many Requests**
- Rate limit exceeded
- Implement request throttling
- Add delay between requests

**CORS Errors** (web only)
- Configure backend CORS settings
- Check allowed origins

**SSL Certificate Errors**
- Ensure valid SSL certificate
- Check device date/time settings

## Security Considerations

1. **Token Storage**: Use Expo Secure Store for sensitive data
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Expiration**: Implement proper token refresh
4. **Input Validation**: Validate all user inputs
5. **Error Messages**: Don't expose sensitive info in errors
6. **Rate Limiting**: Respect rate limits
7. **Secure Headers**: Include security headers in requests

## Further Reading

- [Axios Documentation](https://axios-http.com/)
- [React Query](https://tanstack.com/query)
- [REST API Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
