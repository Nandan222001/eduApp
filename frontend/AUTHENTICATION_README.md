# Authentication System - Quick Start

## Features

✅ **Login with Email/Password** - Traditional authentication with password visibility toggle  
✅ **Login with OTP** - One-time password authentication via email  
✅ **Forgot Password** - Password reset via email link  
✅ **Password Reset** - Secure password reset with token validation  
✅ **User Registration** - New user signup with validation  
✅ **Email Verification** - Optional email confirmation flow  
✅ **Session Timeout** - Automatic logout with warning dialog (30 min default)  
✅ **JWT Token Management** - Automatic token refresh before expiry  
✅ **Protected Routes** - Authentication guard for private routes  
✅ **Role-Based Access Control** - Route and component-level authorization  
✅ **Responsive Design** - Mobile-first, tablet, and desktop optimized

## Quick Setup

### 1. Wrap Your App

```tsx
// src/main.tsx or src/App.tsx
import { AuthProvider } from './components/auth';
import SessionTimeoutWrapper from './components/common/SessionTimeoutWrapper';

function App() {
  return (
    <AuthProvider>
      <SessionTimeoutWrapper>{/* Your app routes */}</SessionTimeoutWrapper>
    </AuthProvider>
  );
}
```

### 2. Configure Routes

```tsx
import { Routes, Route } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProtectedRoute,
} from './components/auth';

<Routes>
  {/* Public routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />

  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>

  {/* Role-based routes */}
  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
    <Route path="/admin" element={<AdminPanel />} />
  </Route>
</Routes>;
```

### 3. Use Authentication

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.fullName}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

## Components

### Login Pages

- `LoginPage` - Standard login page with tabs
- `LoginPageEnhanced` - Enhanced version with better mobile UX
- `RegisterPage` - User registration
- `ForgotPasswordPage` - Request password reset
- `ResetPasswordPage` - Reset password with token
- `VerifyEmailPage` - Email verification

### Route Guards

- `ProtectedRoute` - Requires authentication
- `RoleBasedRoute` - Requires specific roles

### UI Components

- `AuthProvider` - Initializes auth state
- `SessionTimeoutWrapper` - Handles session timeout
- `SessionTimeoutDialog` - Warning dialog
- `AuthCard` - Responsive card wrapper
- `MobileAuthHeader` - Mobile-optimized header
- `PasswordStrengthIndicator` - Visual password strength

### Utility Components

- `RequireRole` - Conditional rendering by role

## Hooks

```tsx
// Main auth hook
const { user, isAuthenticated, login, logout, hasRole } = useAuth();

// Session timeout
useSessionTimeout({
  timeoutMinutes: 30,
  warningMinutes: 5,
});

// Automatic token refresh
useTokenRefresh();

// Responsive design
const { isMobile, isTablet, isDesktop } = useResponsive();
```

## Configuration

Edit `src/config/auth.ts`:

```typescript
export const AUTH_CONFIG = {
  session: {
    timeoutMinutes: 30, // Total session timeout
    warningMinutes: 5, // Warning before timeout
  },
  token: {
    refreshThresholdMinutes: 5, // Refresh token before expiry
  },
  routes: {
    login: '/login',
    dashboard: '/dashboard',
    unauthorized: '/unauthorized',
  },
};
```

## API Endpoints Required

Your backend should implement these endpoints:

```
POST /api/auth/login              - Login with email/password
POST /api/auth/login/otp          - Login with OTP
POST /api/auth/otp/request        - Request OTP code
POST /api/auth/register           - User registration
POST /api/auth/logout             - Logout
POST /api/auth/forgot-password    - Request password reset
POST /api/auth/reset-password     - Reset password
POST /api/auth/refresh            - Refresh access token
GET  /api/auth/me                 - Get current user
POST /api/auth/verify-email       - Verify email
POST /api/auth/resend-verification - Resend verification email
```

## User Roles

Define in `src/types/auth.ts`:

```typescript
type UserRole = 'admin' | 'teacher' | 'student' | 'parent';
```

## Examples

### Protected Route with Roles

```tsx
<Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
  <Route path="/classes" element={<Classes />} />
</Route>
```

### Conditional Rendering by Role

```tsx
import RequireRole from '@/components/common/RequireRole';

<RequireRole roles={['admin']}>
  <AdminButton />
</RequireRole>

<RequireRole roles={['teacher', 'admin']} fallback={<div>Access Denied</div>}>
  <TeacherTools />
</RequireRole>
```

### Check Role Programmatically

```tsx
const { hasRole } = useAuth();

if (hasRole('admin')) {
  // Show admin features
}

if (hasRole(['teacher', 'admin'])) {
  // Show teacher features
}
```

## Mobile Optimization

All components are responsive:

- **Mobile** (<600px): Full-width, touch-optimized inputs
- **Tablet** (600-960px): Balanced layout
- **Desktop** (>960px): Enhanced spacing and features

## Security Features

- ✅ JWT token storage in localStorage
- ✅ Automatic token refresh before expiry
- ✅ Session timeout after inactivity
- ✅ Request queue during token refresh
- ✅ 401/403 error handling
- ✅ Role-based access control
- ✅ Password strength validation
- ✅ Email verification support

## Troubleshooting

### Tokens Not Persisting

- Check localStorage is enabled
- Verify token manager is working: `tokenManager.hasValidToken()`

### Session Timeout Not Working

- Ensure `SessionTimeoutWrapper` wraps your routes
- Check browser console for errors

### Protected Routes Not Working

- Verify `AuthProvider` is at the root
- Check user state: `useAuthStore.getState()`

### Role Guards Failing

- Verify user.role matches UserRole type
- Check allowedRoles array

## Testing

```tsx
import { useAuthStore } from '@/store/useAuthStore';

// Mock authenticated state
beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: true,
    user: {
      id: '1',
      email: 'test@example.com',
      role: 'admin',
      // ...other fields
    },
  });
});

// Mock unauthenticated state
afterEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
  });
});
```

## Support

For detailed documentation, see `AUTHENTICATION_GUIDE.md`.

For issues or questions, check:

1. Browser console for errors
2. Network tab for API calls
3. localStorage for token data
4. Auth store state
