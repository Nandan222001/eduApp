# Authentication System Guide

## Overview

This authentication system provides a comprehensive, production-ready solution for user authentication and authorization with the following features:

- **Login with Email/Password** - Traditional authentication
- **Login with OTP** - One-time password authentication via email
- **Forgot Password Flow** - Password reset via email link
- **Session Management** - Automatic session timeout with warning
- **JWT Token Management** - Automatic token refresh
- **Protected Routes** - Route guards with authentication check
- **Role-Based Access Control** - Route and component-level authorization
- **Responsive Design** - Mobile, tablet, and desktop optimized

## Architecture

### Core Components

1. **Authentication Pages**
   - `LoginPage.tsx` - Login with email/password or OTP
   - `RegisterPage.tsx` - User registration
   - `ForgotPasswordPage.tsx` - Request password reset
   - `ResetPasswordPage.tsx` - Reset password with token
   - `VerifyEmailPage.tsx` - Email verification

2. **Route Guards**
   - `ProtectedRoute.tsx` - Protects routes requiring authentication
   - `RoleBasedRoute.tsx` - Protects routes by user role

3. **Providers & Wrappers**
   - `AuthProvider.tsx` - Initializes authentication state
   - `SessionTimeoutWrapper.tsx` - Handles session timeout

4. **State Management**
   - `useAuthStore.ts` - Zustand store for auth state
   - Persists user and tokens to localStorage

5. **Token Management**
   - `tokenManager.ts` - JWT token storage and validation
   - Automatic token expiry detection
   - Refresh token handling

6. **Hooks**
   - `useAuth.ts` - Authentication operations
   - `useSessionTimeout.ts` - Session timeout management
   - `useTokenRefresh.ts` - Automatic token refresh

## Usage

### Basic Setup

Wrap your app with `AuthProvider` and `SessionTimeoutWrapper`:

```tsx
import { AuthProvider } from './components/auth';
import SessionTimeoutWrapper from './components/common/SessionTimeoutWrapper';

function App() {
  return (
    <AuthProvider>
      <SessionTimeoutWrapper>
        <Routes>{/* Your routes */}</Routes>
      </SessionTimeoutWrapper>
    </AuthProvider>
  );
}
```

### Protected Routes

#### Basic Protection

```tsx
import { ProtectedRoute } from './components/auth';

<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>;
```

#### Role-Based Protection

```tsx
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin" element={<AdminPanel />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
  <Route path="/teacher" element={<TeacherDashboard />} />
</Route>
```

#### Email Verification Required

```tsx
<Route element={<ProtectedRoute requireEmailVerified={true} />}>
  <Route path="/profile" element={<Profile />} />
</Route>
```

### Component-Level Authorization

Use `RequireRole` component for conditional rendering:

```tsx
import RequireRole from '@/components/common/RequireRole';

<RequireRole roles={['admin']}>
  <Button>Admin Only Action</Button>
</RequireRole>

<RequireRole roles={['teacher', 'admin']} fallback={<div>Access Denied</div>}>
  <TeacherTools />
</RequireRole>
```

### Using the Auth Hook

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout, hasRole } = useAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password123',
    });

    if (result.success) {
      // Login successful
    } else {
      // Handle error: result.error
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.fullName}</p>
          {hasRole('admin') && <AdminButton />}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## Authentication Flows

### Login Flow

1. User enters credentials on `LoginPage`
2. API call to `/api/auth/login`
3. Receive user data and tokens
4. Store tokens via `tokenManager`
5. Update auth store with user data
6. Redirect to dashboard

### OTP Login Flow

1. User enters email and requests OTP
2. API call to `/api/auth/otp/request`
3. User receives OTP via email
4. User enters OTP code
5. API call to `/api/auth/login/otp`
6. Complete login with tokens

### Password Reset Flow

1. User requests reset on `ForgotPasswordPage`
2. API call to `/api/auth/forgot-password`
3. User receives email with reset link
4. User clicks link (contains token)
5. User enters new password on `ResetPasswordPage`
6. API call to `/api/auth/reset-password`
7. Redirect to login

### Session Management

- **Timeout**: 30 minutes of inactivity
- **Warning**: 5 minutes before timeout
- **Activity Detection**: Mouse, keyboard, scroll, touch events
- **Dialog**: Shows countdown with options to extend or logout

### Token Refresh

- Automatic refresh when token expires in 5 minutes
- Runs every 60 seconds to check expiry
- Failed refresh triggers logout
- Queues requests during refresh

## API Integration

The system expects these API endpoints:

```typescript
POST / api / auth / login;
POST / api / auth / login / otp;
POST / api / auth / otp / request;
POST / api / auth / register;
POST / api / auth / logout;
POST / api / auth / forgot - password;
POST / api / auth / reset - password;
POST / api / auth / refresh;
GET / api / auth / me;
POST / api / auth / verify - email;
POST / api / auth / resend - verification;
```

## Security Features

1. **JWT Tokens**: Access and refresh token pattern
2. **Token Storage**: localStorage with expiry tracking
3. **Automatic Refresh**: Prevents session interruption
4. **Session Timeout**: Automatic logout after inactivity
5. **Request Queuing**: Handles concurrent requests during refresh
6. **Role-Based Access**: Prevents unauthorized access
7. **Email Verification**: Optional email confirmation

## Responsive Design

All authentication pages are fully responsive:

- **Mobile** (<600px): Single column, touch-optimized
- **Tablet** (600-960px): Optimized spacing
- **Desktop** (>960px): Full layout with side content

## Customization

### Timeout Duration

```tsx
<SessionTimeoutWrapper>{children}</SessionTimeoutWrapper>;

// Or in ProtectedRoute/useSessionTimeout
useSessionTimeout({
  timeoutMinutes: 30, // Total timeout
  warningMinutes: 5, // Warning before timeout
});
```

### Redirect Paths

```tsx
<ProtectedRoute redirectTo="/custom-login" />
```

### Styling

All components use Material-UI and respect theme configuration. Customize via theme:

```tsx
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});
```

## TypeScript Types

Key types are defined in `src/types/auth.ts`:

```typescript
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}
```

## Testing

Mock the auth store for testing:

```tsx
import { useAuthStore } from '@/store/useAuthStore';

// Mock authenticated state
useAuthStore.setState({
  isAuthenticated: true,
  user: {
    id: '1',
    email: 'test@example.com',
    role: 'admin',
    // ... other fields
  },
});
```

## Best Practices

1. **Always use AuthProvider** at the root level
2. **Wrap protected areas** with SessionTimeoutWrapper
3. **Check roles** before rendering sensitive UI
4. **Handle errors** in login/register forms
5. **Validate input** before API calls
6. **Clear tokens** on logout
7. **Test role guards** thoroughly

## Troubleshooting

### Token Expired Issues

- Check `tokenManager.hasValidToken()`
- Verify refresh token is valid
- Check network requests for 401 responses

### Session Timeout Not Working

- Ensure SessionTimeoutWrapper is active
- Check browser console for errors
- Verify user is authenticated

### Role Guards Not Working

- Verify user object has correct role
- Check allowedRoles array
- Ensure role type matches UserRole

## Future Enhancements

- Multi-factor authentication (MFA)
- Social login (Google, Facebook, etc.)
- Biometric authentication
- Remember me functionality
- Login history and device management
- IP-based security rules
