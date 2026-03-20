# EduTrack Mobile App

React Native mobile application for the EduTrack education management system.

---

## 🔧 Build Issues? Need to Clean Cache?

If you're experiencing build errors, 500 errors on web, or dependency issues:

**👉 See [START_HERE.md](START_HERE.md) for quick cleanup and rebuild instructions**

Or jump directly to:
- [Quick Commands](QUICK_COMMANDS.md) - Copy-paste commands
- [Troubleshooting](TROUBLESHOOTING_FLOWCHART.md) - Visual guide
- [Full Documentation](INDEX.md) - Complete index

---

## Features

### Authentication
- Email/Password login
- OTP-based login
- Biometric authentication (Face ID/Touch ID)
- Secure token storage using Expo Secure Store
- Auto-refresh token mechanism

### Navigation
- Role-based tab navigation (Student/Parent)
- Deep linking support
- Stack navigation for auth flow

### Student Features
- Home dashboard with quick actions
- Course listing
- Assignment management
- Profile with settings

### Parent Features
- Home dashboard with children overview
- Children management
- Academic reports
- Profile with settings

## Tech Stack

- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **Secure Storage**: Expo Secure Store
- **Biometric Auth**: Expo Local Authentication
- **API Client**: Axios
- **Language**: TypeScript

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API base URL
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Axios instance with interceptors
│   │   └── authApi.ts    # Auth API endpoints
│   ├── components/       # Reusable components
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── navigation/       # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── StudentNavigator.tsx
│   │   ├── ParentNavigator.tsx
│   │   └── linking.ts    # Deep linking config
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── student/      # Student screens
│   │   └── parent/       # Parent screens
│   ├── store/            # Redux store
│   │   ├── index.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   │       └── authSlice.ts
│   ├── types/            # TypeScript types
│   │   ├── auth.ts
│   │   └── navigation.ts
│   └── utils/            # Utility functions
│       ├── secureStorage.ts
│       └── biometric.ts
├── App.tsx               # Root component
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json

```

## API Integration

The app connects to the backend API at `/api/v1/auth`:

### Endpoints Used
- `POST /auth/login` - Email/password login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `POST /auth/logout-all` - Logout from all devices
- `GET /auth/me` - Get current user info
- `POST /auth/otp/request` - Request OTP (requires backend implementation)
- `POST /auth/otp/verify` - Verify OTP (requires backend implementation)

## Security

- Access tokens stored securely in Expo Secure Store
- Refresh tokens stored securely in Expo Secure Store
- Automatic token refresh on 401 responses
- Biometric authentication for quick login
- Secure credential validation

## Deep Linking

The app supports deep linking with the following URLs:

### Auth
- `edutrack://login`
- `edutrack://otp-login`
- `edutrack://otp-verify`

### Student
- `edutrack://student/home`
- `edutrack://student/courses`
- `edutrack://student/assignments`
- `edutrack://student/profile`

### Parent
- `edutrack://parent/home`
- `edutrack://parent/children`
- `edutrack://parent/reports`
- `edutrack://parent/profile`

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Notes

- OTP endpoints (`/auth/otp/request` and `/auth/otp/verify`) need to be implemented in the backend
- Biometric authentication requires device support for Face ID, Touch ID, or fingerprint
- Deep linking configuration may need adjustment for production domains
- Update API_BASE_URL in .env for different environments
