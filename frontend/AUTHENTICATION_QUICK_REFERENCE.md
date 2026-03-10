# Authentication System - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Wrap Your App

```tsx
import { AuthProvider } from './components/auth';
import SessionTimeoutWrapper from './components/common/SessionTimeoutWrapper';

<AuthProvider>
  <SessionTimeoutWrapper>
    <YourApp />
  </SessionTimeoutWrapper>
</AuthProvider>;
```

### 2. Add Routes

```tsx
import { LoginPage, ProtectedRoute } from './components/auth';

<Route path="/login" element={<LoginPage />} />
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### 3. Use Auth Hook

```tsx
const { user, isAuthenticated, logout } = useAuth();
```

---

## 📦 Import Paths

```tsx
// Components
import { LoginPage, RegisterPage, ProtectedRoute } from '@/components/auth';
import RequireRole from '@/components/common/RequireRole';

// Hooks
import { useAuth } from '@/hooks/useAuth';

// Utils
import { validateEmail, hasRole } from '@/utils';

// Store
import { useAuthStore } from '@/store/useAuthStore';

// Types
import type { AuthUser, UserRole } from '@/types/auth';

// Config
import { AUTH_CONFIG } from '@/config/auth';
```

---

## 🎯 Common Use Cases

### Protect a Route

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/profile" element={<Profile />} />
</Route>
```

### Protect by Role

```tsx
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin" element={<AdminPanel />} />
</Route>
```

### Conditional Render by Role

```tsx
<RequireRole roles={['admin']}>
  <AdminButton />
</RequireRole>
```

### Check Authentication

```tsx
const { isAuthenticated } = useAuth();
if (isAuthenticated) {
  // User is logged in
}
```

### Check Role

```tsx
const { hasRole } = useAuth();
if (hasRole('admin')) {
  // User is admin
}
```

### Manual Login

```tsx
const { login } = useAuth();
const result = await login({ email, password });
if (result.success) {
  navigate('/dashboard');
}
```

### Logout

```tsx
const { logout } = useAuth();
logout(); // Clears tokens and redirects
```

---

## 🔐 Available Routes

| Path               | Component          | Access        |
| ------------------ | ------------------ | ------------- |
| `/login`           | LoginPage          | Public        |
| `/register`        | RegisterPage       | Public        |
| `/forgot-password` | ForgotPasswordPage | Public        |
| `/reset-password`  | ResetPasswordPage  | Public        |
| `/verify-email`    | VerifyEmailPage    | Public        |
| `/unauthorized`    | UnauthorizedPage   | Public        |
| `/dashboard`       | Protected          | Authenticated |
| `/admin`           | Protected          | Admin only    |

---

## 🎨 Available Components

### Pages

- `LoginPage` - Standard login
- `LoginPageEnhanced` - Enhanced mobile
- `RegisterPage` - Registration
- `ForgotPasswordPage` - Request reset
- `ResetPasswordPage` - Reset password
- `VerifyEmailPage` - Email verify

### Guards

- `ProtectedRoute` - Auth guard
- `RoleBasedRoute` - Role guard
- `RequireRole` - Component guard

### Providers

- `AuthProvider` - Auth context
- `SessionTimeoutWrapper` - Timeout handler

### Dialogs

- `SessionTimeoutDialog` - Timeout warning

---

## 🎣 Available Hooks

```tsx
// Main auth hook
const {
  user, // Current user
  isAuthenticated, // Auth status
  login, // Login function
  loginWithOTP, // OTP login
  logout, // Logout function
  hasRole, // Role checker
} = useAuth();

// Session timeout
useSessionTimeout({
  timeoutMinutes: 30,
  warningMinutes: 5,
  onTimeout: () => {},
  onWarning: () => {},
});

// Token refresh (automatic)
useTokenRefresh();

// Responsive design
const { isMobile, isTablet, isDesktop } = useResponsive();
```

---

## 🛠️ Configuration

Edit `src/config/auth.ts`:

```tsx
export const AUTH_CONFIG = {
  session: {
    timeoutMinutes: 30, // Session timeout
    warningMinutes: 5, // Warning time
  },
  token: {
    refreshThresholdMinutes: 5, // Refresh timing
  },
  routes: {
    login: '/login',
    dashboard: '/dashboard',
  },
};
```

---

## 🔒 User Roles

```typescript
type UserRole = 'admin' | 'teacher' | 'student' | 'parent';
```

### Role Priority

1. `admin` (highest)
2. `teacher`
3. `parent`
4. `student` (lowest)

---

## 📡 API Endpoints

Configure in `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Expected endpoints:

- `POST /api/auth/login`
- `POST /api/auth/login/otp`
- `POST /api/auth/otp/request`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

---

## 🎯 Type Reference

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

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}
```

---

## 🐛 Debugging

### Check Auth State

```tsx
import { useAuthStore } from '@/store/useAuthStore';
console.log(useAuthStore.getState());
```

### Check Tokens

```tsx
import { tokenManager } from '@/lib/tokenManager';
console.log(tokenManager.getAccessToken());
console.log(tokenManager.hasValidToken());
```

### Common Issues

**Route guard not working?**
→ Verify AuthProvider is at root

**Session timeout not working?**
→ Check SessionTimeoutWrapper is active

**Token refresh failing?**
→ Check refresh token in localStorage

**Role guard failing?**
→ Verify user.role matches UserRole type

---

## 📱 Responsive Breakpoints

- **Mobile**: < 600px
- **Tablet**: 600px - 960px
- **Desktop**: > 960px

```tsx
const { isMobile, isTablet, isDesktop } = useResponsive();
```

---

## ✅ Validation Helpers

```tsx
import { validateEmail, validatePassword, getPasswordStrength } from '@/utils';

// Email
const isValid = validateEmail('user@example.com');

// Password
const { isValid, errors } = validatePassword('Pass123!');

// Password strength
const { strength, score } = getPasswordStrength('Pass123!');
// strength: 'weak' | 'medium' | 'strong' | 'very-strong'
```

---

## 🔧 Utility Functions

```tsx
import { hasRole, getRoleLabel, getRolePriority } from '@/utils';

// Role checking
hasRole('admin', ['admin', 'teacher']); // true

// Role label
getRoleLabel('admin'); // "Administrator"

// Role priority
getRolePriority('admin'); // 4
```

---

## 📚 Documentation Files

1. **AUTHENTICATION_README.md** - Quick start
2. **AUTHENTICATION_GUIDE.md** - Full guide
3. **AUTHENTICATION_IMPLEMENTATION.md** - Technical details
4. **AUTHENTICATION_CHECKLIST.md** - Implementation checklist
5. **AUTHENTICATION_STRUCTURE.md** - File structure
6. **AUTHENTICATION_SUMMARY.md** - Executive summary
7. **AUTHENTICATION_QUICK_REFERENCE.md** - This file

---

## 🚨 Quick Troubleshooting

| Problem                     | Solution                         |
| --------------------------- | -------------------------------- |
| Not redirecting to login    | Add AuthProvider at root         |
| Session timeout not working | Add SessionTimeoutWrapper        |
| Tokens not persisting       | Check localStorage permissions   |
| 401 errors                  | Token expired, will auto-refresh |
| Role guard fails            | Check user.role value            |
| Build errors                | Run `npm install`                |

---

## 🎉 Ready to Use!

All features are implemented and ready for integration with your backend API.

**Next Steps:**

1. Configure `.env` with API URL
2. Test login flow
3. Customize theme/styles
4. Deploy!

---

**Quick Links:**

- 📖 [Full Documentation](./AUTHENTICATION_GUIDE.md)
- ✅ [Checklist](./AUTHENTICATION_CHECKLIST.md)
- 📁 [File Structure](./AUTHENTICATION_STRUCTURE.md)
- 💡 [Examples](./src/examples/AuthExamples.tsx)
