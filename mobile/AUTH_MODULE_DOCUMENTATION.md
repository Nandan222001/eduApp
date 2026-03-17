# Authentication Module Documentation

## Overview

The authentication module provides a complete authentication solution for the mobile app with the following features:

- Email/password authentication
- OTP (One-Time Password) authentication
- Biometric authentication (Face ID/Fingerprint)
- JWT token management with automatic refresh
- Secure token storage
- Session persistence
- Password reset flow
- Auto-logout on token expiration

## Architecture

### Components

#### 1. API Client (`/mobile/src/api/client.ts`)

- Axios instance configured with base URL from environment variables
- Request interceptor for JWT token injection
- Response interceptor for automatic token refresh on 401 errors
- Error handling and transformation
- Queue mechanism to handle multiple concurrent requests during token refresh

**Key Features:**

- Base URL: Configured from `API_URL` environment variable
- Timeout: 30 seconds (configurable via `API_TIMEOUT` constant)
- Automatic Bearer token injection in Authorization header
- Token refresh queue to prevent multiple simultaneous refresh requests
- Comprehensive error handling with typed error responses

#### 2. Auth API (`/mobile/src/api/auth.ts`)

- Login endpoint with email/password and optional OTP
- Logout endpoint
- Token refresh endpoint
- Password reset flow (forgot password, reset password)
- OTP request and verification
- User profile retrieval
- Password change

**Available Endpoints:**

```typescript
authApi.login({ email, password, otp? })
authApi.logout()
authApi.refreshToken(refreshToken)
authApi.getCurrentUser()
authApi.forgotPassword(email)
authApi.resetPassword({ token, password, confirm_password })
authApi.requestOTP(email)
authApi.verifyOTP({ email, otp })
authApi.changePassword(currentPassword, newPassword)
```

#### 3. Secure Storage (`/mobile/src/utils/secureStorage.ts`)

- Wrapper around expo-secure-store for token storage
- Platform-specific implementation (secure store for iOS/Android, AsyncStorage for web)
- Support for storing objects and primitives
- Error handling and logging

**Methods:**

```typescript
secureStorage.setItem(key, value);
secureStorage.getItem(key);
secureStorage.removeItem(key);
secureStorage.setObject(key, object);
secureStorage.getObject(key);
secureStorage.clear();
```

#### 4. Redux Store (`/mobile/src/store`)

**Auth Slice (`slices/authSlice.ts`):**

- User state management
- Token management (access and refresh tokens)
- Authentication status
- Loading states
- Error handling
- Biometric authentication settings

**State Shape:**

```typescript
{
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
}
```

**Async Actions:**

- `login(credentials)` - Authenticate user
- `logout()` - Clear session and logout
- `refreshTokens()` - Manually refresh tokens
- `loadStoredAuth()` - Load saved session on app start
- `enableBiometric({ email, password })` - Enable biometric login
- `disableBiometric()` - Disable biometric login

**Sync Actions:**

- `setUser(user)` - Update user data
- `setTokens({ accessToken, refreshToken })` - Update tokens
- `clearError()` - Clear error state
- `updateUser(partialUser)` - Partial user update

#### 5. Auth Service (`/mobile/src/utils/authService.ts`)

- Session management
- Automatic token refresh every 14 minutes
- Token expiration checking
- Biometric credentials management
- Session persistence

**Methods:**

```typescript
authService.initializeAuth() - Initialize auth on app start
authService.startAutoRefresh() - Start automatic token refresh
authService.stopAutoRefresh() - Stop automatic token refresh
authService.refreshTokens() - Manually refresh tokens
authService.clearSession() - Clear all auth data
authService.saveSession(accessToken, refreshToken, user) - Save session
authService.isTokenExpiringSoon(token) - Check if token needs refresh
authService.checkAndRefreshIfNeeded() - Check and refresh if needed
authService.getBiometricCredentials() - Get saved biometric credentials
authService.isBiometricEnabled() - Check if biometric is enabled
```

#### 6. Login Screen (`/mobile/src/screens/auth/LoginScreen.tsx`)

- Email/password input fields
- OTP input option
- Biometric login support (Face ID/Fingerprint)
- Remember me functionality (enables biometric)
- Forgot password navigation
- Registration navigation
- Auto-login with biometric if enabled
- Form validation
- Error display

**Features:**

- Detects available biometric authentication methods
- Automatically prompts for biometric login if enabled
- Toggle between password and OTP login
- Secure password input with show/hide toggle
- Loading states during authentication
- Error handling with user-friendly messages

#### 7. Forgot Password Screen (`/mobile/src/screens/auth/ForgotPasswordScreen.tsx`)

- Email input for password reset request
- Email validation
- Success/error feedback
- Navigation back to login

#### 8. Reset Password Screen (`/mobile/src/screens/auth/ResetPasswordScreen.tsx`)

- New password input with strength indicator
- Password confirmation
- Password requirements display with validation
- Success feedback and navigation

## Authentication Flow

### 1. Initial App Load

```
App Start
  → RootNavigator loads
  → Dispatch loadStoredAuth()
  → Check secure storage for tokens
  → If tokens exist:
    → Load user data
    → Check token expiration
    → Refresh if needed
    → Start auto-refresh timer
    → Navigate to Main
  → If no tokens:
    → Navigate to Auth
```

### 2. Login Flow

```
User enters credentials
  → Dispatch login(credentials)
  → API call to /auth/login
  → If successful:
    → Save tokens to secure storage
    → Save user data
    → If "Remember Me" checked:
      → Save credentials for biometric
      → Enable biometric
    → Start auto-refresh timer
    → Navigate to Main
  → If failed:
    → Display error message
```

### 3. Biometric Login Flow

```
LoginScreen loads
  → Check biometric availability
  → If biometric enabled:
    → Prompt biometric authentication
    → If successful:
      → Retrieve saved credentials
      → Auto-login with credentials
    → If failed/cancelled:
      → Show manual login form
```

### 4. Token Refresh Flow

```
API Request
  → Interceptor adds access token
  → If 401 response:
    → Check if already refreshing
    → If yes: Queue request
    → If no: Start refresh
      → Call /auth/refresh with refresh token
      → If successful:
        → Update tokens in storage
        → Update Redux state
        → Retry all queued requests
      → If failed:
        → Clear session
        → Navigate to Login
```

### 5. Auto-Refresh Flow

```
Every 14 minutes (configurable)
  → authService checks token expiration
  → If token expires in < 5 minutes:
    → Call /auth/refresh
    → Update tokens
    → Continue auto-refresh timer
  → If refresh fails:
    → Clear session
    → Navigate to Login
```

### 6. Logout Flow

```
User clicks logout
  → Dispatch logout()
  → Call /auth/logout API
  → Clear tokens from secure storage
  → Clear user data
  → Stop auto-refresh timer
  → Reset Redux state
  → Navigate to Login
```

## Environment Variables

Required environment variables (in `.env`, `.env.development`, `.env.production`):

```env
API_URL=http://localhost:8000/api/v1
WS_URL=ws://localhost:8000/ws
APP_ENV=development
```

## Storage Keys

Defined in `/mobile/src/constants/index.ts`:

```typescript
STORAGE_KEYS = {
  ACCESS_TOKEN: '@edu_access_token'
  REFRESH_TOKEN: '@edu_refresh_token'
  USER_DATA: '@edu_user_data'
  BIOMETRIC_ENABLED: '@edu_biometric_enabled'
  BIOMETRIC_CREDENTIALS: '@edu_biometric_credentials'
}
```

## Security Considerations

1. **Token Storage**: Tokens are stored using expo-secure-store (iOS Keychain/Android Keystore) for maximum security
2. **Biometric Credentials**: Encrypted and stored securely only when user explicitly enables
3. **Auto-Refresh**: Tokens are automatically refreshed before expiration to maintain session
4. **Token Expiration**: Tokens are checked for expiration time and refreshed proactively
5. **Password Display**: Password fields include show/hide toggle for user convenience
6. **Error Handling**: Errors are caught and handled gracefully without exposing sensitive information
7. **Web Fallback**: On web platform, falls back to AsyncStorage (not recommended for production)

## Backend API Requirements

The authentication module expects the backend to provide the following endpoints:

### POST /api/v1/auth/login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "otp": "123456" // optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer"
  }
}
```

### POST /api/v1/auth/refresh

**Request:**

```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer"
  }
}
```

### POST /api/v1/auth/logout

**Request:** (access token in Authorization header)

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/v1/auth/forgot-password

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /api/v1/auth/reset-password

**Request:**

```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Usage Examples

### Using Auth in Components

```typescript
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login, logout } from '@store/slices/authSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  const handleLogin = async () => {
    try {
      await dispatch(login({ email, password })).unwrap();
      // Login successful
    } catch (error) {
      // Handle error
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    // Your component JSX
  );
}
```

### Making Authenticated API Calls

```typescript
import { apiClient } from '@api/client';

// The client automatically includes the access token
const fetchUserData = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};
```

### Checking Auth Status in Navigation

```typescript
import { useAppSelector } from '@store/hooks';

function Navigator() {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}
```

## Configuration

### Token Refresh Interval

Edit in `/mobile/src/utils/authService.ts`:

```typescript
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes
```

### Token Expiration Check

Edit in `/mobile/src/utils/authService.ts`:

```typescript
// Refresh if token expires in less than 5 minutes
return timeUntilExpiration < 5 * 60 * 1000;
```

### API Timeout

Edit in `/mobile/src/constants/index.ts`:

```typescript
export const API_TIMEOUT = 30000; // 30 seconds
```

## Testing

### Test Biometric Authentication

1. Enable biometric on your device (Face ID/Touch ID)
2. Login with credentials
3. Enable "Remember Me"
4. Logout
5. Biometric prompt should appear on next login

### Test Token Refresh

1. Login to the app
2. Wait for token to near expiration (or modify the expiration check to trigger sooner)
3. Make an API request
4. Token should refresh automatically

### Test Session Persistence

1. Login to the app
2. Close the app completely
3. Reopen the app
4. Should auto-login without requiring credentials

## Troubleshooting

### Biometric Not Working

- Ensure device has biometric hardware
- Check if biometric is enrolled in device settings
- Verify expo-local-authentication is properly installed

### Token Refresh Failing

- Check backend /auth/refresh endpoint is working
- Verify refresh token is being stored correctly
- Check token expiration logic

### Auto-Login Not Working

- Verify tokens are being saved to secure storage
- Check loadStoredAuth is being called on app start
- Ensure tokens haven't expired

### 401 Errors on API Calls

- Check if access token is being sent in Authorization header
- Verify token format (should be "Bearer {token}")
- Check backend authentication middleware

## Future Enhancements

Potential improvements for the authentication module:

1. **Multi-factor Authentication (MFA)**: Add support for TOTP/SMS-based 2FA
2. **Social Login**: Google, Facebook, Apple Sign In
3. **Device Management**: Track and manage logged-in devices
4. **Session Activity**: Log user session activity
5. **Token Blacklisting**: Implement token revocation on backend
6. **Offline Mode**: Queue auth-required actions when offline
7. **Pin Code**: Additional layer with numeric PIN
8. **Account Linking**: Link multiple authentication methods
