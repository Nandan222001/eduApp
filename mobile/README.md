# EDU Mobile App

A comprehensive mobile application for the EDU educational platform, built with React Native and Expo, providing students and parents with seamless access to academic information, assignments, grades, schedules, and more.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Development](#development)
- [Building and Deployment](#building-and-deployment)
- [Tech Stack](#tech-stack)
- [Available Scripts](#available-scripts)
- [Environment Configuration](#environment-configuration)
- [Contributing](#contributing)
- [Documentation](#documentation)

## Project Overview

The EDU Mobile app is a cross-platform mobile application that connects students, parents, and educators in a unified educational ecosystem. It provides:

- **For Students**: Access to assignments, grades, schedules, study materials, doubt forums, AI-powered predictions, gamification features, and more
- **For Parents**: Monitor child's academic progress, attendance, grades, communication with teachers, fee payments, and reports
- **Offline Support**: Sync data for offline access and queue actions when offline
- **Real-time Updates**: Push notifications for assignments, grades, attendance, and announcements
- **Biometric Authentication**: Secure login with Face ID/Touch ID
- **Multi-language Support**: Internationalization ready

### Key Features

- 📚 Assignments and submissions with file uploads
- 📊 Grades and academic performance tracking
- 📅 Class schedules and timetables
- 📖 Study materials library with offline access
- 💬 Doubt forums and peer discussions
- 🎯 Goal setting and progress tracking
- 🏆 Gamification (badges, points, leaderboards)
- 🤖 AI-powered performance predictions
- 📱 QR code scanning for quick attendance
- 🔔 Push notifications with customizable preferences
- 🌐 Offline mode with data synchronization
- 👨‍👩‍👧 Parent dashboard for monitoring children
- 📈 Analytics and performance reports
- 🎨 Customizable themes (light/dark mode)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                           │
│                     (React Native + Expo)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │     UI       │  │  Navigation  │  │    Screens   │    │
│  │  Components  │  │   (React     │  │  (Student/   │    │
│  │              │  │  Navigation) │  │   Parent)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    State     │  │   Services   │  │     API      │    │
│  │  Management  │  │  (Analytics, │  │    Client    │    │
│  │   (Zustand)  │  │  Offline,    │  │   (Axios)    │    │
│  │              │  │  Notif.)     │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Local     │  │   Secure     │  │    Native    │    │
│  │   Storage    │  │   Storage    │  │   Modules    │    │
│  │  (AsyncStorage)│ │  (SecureStore)│ │  (Camera,   │    │
│  │              │  │              │  │   Notif.)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Server                       │
│                    (FastAPI + PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Structure

```
Root Navigator
│
├─── Auth Stack (Unauthenticated)
│    ├── Login Screen
│    ├── Register Screen
│    ├── Forgot Password Screen
│    └── Reset Password Screen
│
└─── Main Stack (Authenticated)
     │
     ├─── Student Tab Navigator
     │    ├── Home (Dashboard)
     │    ├── Assignments
     │    ├── Schedule
     │    ├── Grades
     │    └── More Menu
     │         ├── Study Materials
     │         ├── Doubt Forum
     │         ├── AI Predictions
     │         ├── Goals
     │         ├── Gamification
     │         ├── Profile
     │         ├── Settings
     │         └── Notifications
     │
     └─── Parent Tab Navigator
          ├── Dashboard
          ├── Children
          ├── Communication
          ├── Reports
          └── Profile
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Store                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   Auth     │  │  Offline   │  │   Sync     │          │
│  │   Store    │  │   Store    │  │   Store    │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │Notification│  │   Theme    │  │   Cache    │          │
│  │   Store    │  │   Store    │  │   Store    │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                      │
                      │ State Updates
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     React Components                        │
│               (Auto-rerender on state change)               │
└─────────────────────────────────────────────────────────────┘
```

### API Integration Flow

```
Component → API Hook → API Client → Interceptors → Backend
    │                       │            │
    │                       │            ├── Request Interceptor
    │                       │            │   - Add Auth Token
    │                       │            │   - Add Headers
    │                       │            │   - Track Request
    │                       │            │
    │                       │            └── Response Interceptor
    │                       │                - Handle Errors
    │                       │                - Token Refresh
    │                       │                - Retry Logic
    │                       │
    │                       └── Offline Handler
    │                           - Queue Requests
    │                           - Sync When Online
    │
    └── State Update
        - Update Store
        - Re-render UI
```

## Folder Structure

```
mobile/
├── assets/                      # Static assets
│   ├── fonts/                   # Custom fonts
│   ├── images/                  # Images and icons
│   ├── icon.png                 # App icon
│   ├── splash.png              # Splash screen
│   └── adaptive-icon.png       # Android adaptive icon
│
├── src/                         # Source code
│   ├── api/                     # API client and endpoints
│   │   ├── client.ts           # Axios client with interceptors
│   │   ├── auth.ts             # Authentication endpoints
│   │   ├── assignments.ts      # Assignment endpoints
│   │   ├── grades.ts           # Grades endpoints
│   │   ├── schedule.ts         # Schedule endpoints
│   │   ├── notifications.ts    # Notification endpoints
│   │   ├── gamification.ts     # Gamification endpoints
│   │   └── index.ts            # API exports
│   │
│   ├── components/              # Reusable UI components
│   │   ├── shared/             # Cross-platform components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Loading.tsx
│   │   ├── student/            # Student-specific components
│   │   └── index.ts
│   │
│   ├── screens/                 # Screen components
│   │   ├── auth/               # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── student/            # Student screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── AssignmentsScreen.tsx
│   │   │   ├── GradesScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   ├── parent/             # Parent screens
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ChildrenScreen.tsx
│   │   │   └── ReportsScreen.tsx
│   │   ├── shared/             # Shared screens
│   │   │   ├── SettingsScreen.tsx
│   │   │   └── NotificationHistoryScreen.tsx
│   │   └── common/             # Common screens
│   │
│   ├── navigation/              # Navigation configuration
│   │   ├── RootNavigator.tsx   # Root navigation
│   │   ├── AuthNavigator.tsx   # Auth stack
│   │   ├── MainNavigator.tsx   # Main stack
│   │   ├── StudentTabNavigator.tsx
│   │   ├── ParentTabNavigator.tsx
│   │   └── linking.ts          # Deep linking config
│   │
│   ├── store/                   # State management (Zustand)
│   │   ├── authStore.ts        # Authentication state
│   │   ├── offlineStore.ts     # Offline mode state
│   │   ├── syncStore.ts        # Sync queue state
│   │   ├── hooks.ts            # Custom hooks
│   │   └── index.ts
│   │
│   ├── services/                # Service modules
│   │   ├── analytics.ts        # Analytics service
│   │   ├── notificationService.ts
│   │   ├── syncService.ts      # Offline sync service
│   │   └── index.ts
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useOffline.ts
│   │   ├── useNotifications.ts
│   │   └── index.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── storage.ts          # AsyncStorage wrapper
│   │   ├── secureStorage.ts    # Secure storage wrapper
│   │   ├── validation.ts       # Form validation
│   │   ├── formatting.ts       # Data formatting
│   │   └── index.ts
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── api.ts              # API types
│   │   ├── navigation.ts       # Navigation types
│   │   ├── models.ts           # Data models
│   │   └── index.ts
│   │
│   ├── constants/               # App constants
│   │   ├── index.ts            # General constants
│   │   ├── storage.ts          # Storage keys
│   │   └── api.ts              # API constants
│   │
│   ├── theme/                   # Theme configuration
│   │   ├── colors.ts           # Color palette
│   │   ├── typography.ts       # Typography styles
│   │   ├── spacing.ts          # Spacing scale
│   │   └── index.ts
│   │
│   ├── config/                  # Configuration files
│   │   ├── sentry.ts           # Error tracking config
│   │   └── index.ts
│   │
│   └── offline.ts              # Offline functionality
│
├── scripts/                     # Utility scripts
│   └── version-bump.js         # Version bumping script
│
├── __tests__/                   # Test files
│   ├── unit/                   # Unit tests
│   ├── components/             # Component tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
│
├── docs/                        # Documentation
│   ├── API_INTEGRATION.md      # API integration guide
│   ├── USER_TESTING.md         # User testing guide
│   └── TROUBLESHOOTING.md      # Common issues
│
├── App.tsx                      # App entry point
├── app.json                     # Expo configuration
├── app.config.js               # Dynamic Expo config
├── eas.json                     # EAS Build configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── babel.config.js             # Babel configuration
├── metro.config.js             # Metro bundler config
├── jest.config.js              # Jest test config
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── .env.development            # Development environment
├── .env.staging                # Staging environment
├── .env.production             # Production environment
├── .env.example                # Environment template
├── CONTRIBUTING.md             # Contributing guidelines
├── CHANGELOG.md                # Version history
└── README.md                   # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **npm or yarn**: Package manager
  - npm comes with Node.js
  - yarn: `npm install -g yarn`

- **Expo CLI**: Expo command-line tools
  - Install: `npm install -g expo-cli`
  - Verify: `expo --version`

- **EAS CLI**: For building and submitting apps
  - Install: `npm install -g eas-cli`
  - Verify: `eas --version`

### Platform-Specific Requirements

#### iOS Development (macOS only)

- **Xcode**: Latest version from Mac App Store
- **Xcode Command Line Tools**: `xcode-select --install`
- **CocoaPods**: `sudo gem install cocoapods`
- **iOS Simulator**: Included with Xcode
- **Apple Developer Account**: For device testing and App Store deployment

#### Android Development

- **Android Studio**: Latest version
  - Download from [developer.android.com](https://developer.android.com/studio)
  - Install Android SDK (API level 33 or higher recommended)
  - Set up Android Virtual Device (AVD)

- **Java Development Kit (JDK)**: Version 11 or higher
  - Verify: `java -version`

- **Environment Variables**:
  ```bash
  # Add to ~/.zshrc or ~/.bash_profile
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mobile
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Copy the example environment file and configure for your environment:

```bash
cp .env.example .env.development
```

Edit `.env.development` with your API endpoints and configuration:

```bash
# API Configuration
API_URL=http://localhost:8000
API_TIMEOUT=30000

# App Configuration
APP_NAME=EDU Mobile
APP_VERSION=1.0.0

# Feature Flags
ENABLE_BIOMETRIC_AUTH=true
ENABLE_OFFLINE_MODE=true
ENABLE_PUSH_NOTIFICATIONS=true
```

For production builds, also configure:
- `.env.staging`
- `.env.production`

### 4. Configure EAS Build (Optional)

If you plan to build native apps:

```bash
eas login
eas init
```

Edit `eas.json` with your project configuration.

### 5. Start Development Server

```bash
npm start
# or
expo start
```

### 6. Run on Simulators/Devices

#### iOS Simulator (macOS only)

```bash
npm run ios
# or press 'i' in the Expo dev server
```

#### Android Emulator

```bash
npm run android
# or press 'a' in the Expo dev server
```

#### Physical Device

1. Install **Expo Go** app from App Store or Play Store
2. Scan the QR code shown in the terminal
3. App will load on your device

## Development

### Running the Development Server

```bash
# Start Expo dev server
npm start

# Start with specific platform
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser
```

### Development with Expo Dev Client

For better native module support:

```bash
npm run dev
```

### Code Quality Tools

```bash
# Linting
npm run lint              # Check for lint errors
npm run lint:fix          # Auto-fix lint errors

# Formatting
npm run format            # Format code with Prettier
npm run format:check      # Check formatting

# Type Checking
npm run type-check        # Run TypeScript type checking
```

### Testing

```bash
# Unit tests
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run test:unit         # Run unit tests only
npm run test:components   # Run component tests

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e:ios      # Run E2E tests on iOS
npm run test:e2e:android  # Run E2E tests on Android
```

### Hot Reloading

The development server supports hot reloading:
- Save any file to see changes instantly
- Press `r` in terminal to reload manually
- Press `Shift + m` to open developer menu on device

## Building and Deployment

### Development Builds

```bash
# Build for development
npm run build:dev:ios
npm run build:dev:android
npm run build:dev         # Build both platforms
```

### Preview/Staging Builds

```bash
# Build for preview
npm run build:preview:ios
npm run build:preview:android
npm run build:preview     # Build both platforms
```

### Production Builds

```bash
# Build for production
npm run build:prod:ios
npm run build:prod:android
npm run build:prod        # Build both platforms
```

### Submitting to App Stores

```bash
# Submit to Apple App Store
npm run submit:ios

# Submit to Google Play Store
npm run submit:android
```

### OTA Updates

Deploy over-the-air updates without rebuilding:

```bash
# Publish update to development channel
npm run update:publish:dev -- "Bug fixes"

# Publish update to production channel
npm run update:publish:prod -- "New features"
```

### Version Bumping

```bash
npm run version:bump:patch   # 1.0.0 -> 1.0.1
npm run version:bump:minor   # 1.0.0 -> 1.1.0
npm run version:bump:major   # 1.0.0 -> 2.0.0
```

## Tech Stack

### Core Technologies

- **Framework**: React Native 0.73
- **Runtime**: Expo SDK 50
- **Language**: TypeScript 5.3
- **Navigation**: React Navigation 6
- **State Management**: Zustand 4.4
- **API Client**: Axios 1.6
- **Forms**: React Hook Form (planned)
- **UI Components**: React Native Elements

### Key Libraries

- **Authentication**: Expo Secure Store, Biometric Auth
- **Notifications**: Expo Notifications
- **Media**: Expo Image Picker, Camera, Document Picker
- **Storage**: AsyncStorage, Redux Persist
- **Offline**: Custom offline queue with sync
- **Analytics**: Sentry, Custom analytics service
- **Charts**: React Native Chart Kit
- **Calendar**: React Native Calendars
- **PDF**: React Native PDF
- **QR Code**: Expo Barcode Scanner

### Development Tools

- **Code Quality**: ESLint, Prettier
- **Testing**: Jest, React Native Testing Library, Detox
- **Build**: EAS Build
- **CI/CD**: GitHub Actions (planned)
- **Error Tracking**: Sentry

## Available Scripts

### Development
- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start on web
- `npm run dev` - Start with development client

### Building
- `npm run build:dev:ios` - Build development iOS app
- `npm run build:dev:android` - Build development Android app
- `npm run build:preview:ios` - Build preview iOS app
- `npm run build:preview:android` - Build preview Android app
- `npm run build:prod:ios` - Build production iOS app
- `npm run build:prod:android` - Build production Android app

### Submission
- `npm run submit:ios` - Submit iOS app to App Store
- `npm run submit:android` - Submit Android app to Play Store

### Updates
- `npm run update:development` - Publish update to development
- `npm run update:preview` - Publish update to preview
- `npm run update:production` - Publish update to production

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e:ios` - Run E2E tests on iOS
- `npm run test:e2e:android` - Run E2E tests on Android

### Utilities
- `npm run version:bump:patch` - Bump patch version
- `npm run version:bump:minor` - Bump minor version
- `npm run version:bump:major` - Bump major version
- `npm run channel:list` - List EAS update channels
- `npm run build:list` - List EAS builds

## Environment Configuration

The app supports multiple environments with separate configurations:

### Development Environment (`.env.development`)
- Local development and testing
- Points to local backend (localhost:8000)
- Debug logging enabled
- Hot reloading enabled

### Staging Environment (`.env.staging`)
- Internal testing and QA
- Points to staging backend server
- Limited logging
- Mirrors production configuration

### Production Environment (`.env.production`)
- Live production app
- Points to production backend server
- Minimal logging
- Performance optimized

### Required Environment Variables

```bash
# API
API_URL=<backend-url>
API_TIMEOUT=30000

# App Info
APP_NAME=EDU Mobile
APP_VERSION=1.0.0

# Analytics (Optional)
SENTRY_DSN=<your-sentry-dsn>
ANALYTICS_KEY=<your-analytics-key>

# Feature Flags
ENABLE_BIOMETRIC_AUTH=true
ENABLE_OFFLINE_MODE=true
ENABLE_PUSH_NOTIFICATIONS=true

# EAS (Required for builds)
EXPO_PROJECT_ID=<your-project-id>
EXPO_OWNER=<your-expo-username>
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Documentation

- [API Integration Guide](./docs/API_INTEGRATION.md) - Backend API endpoints and integration patterns
- [Contributing Guidelines](./CONTRIBUTING.md) - Development standards and PR process
- [User Testing Guide](./docs/USER_TESTING.md) - How to conduct user testing
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Changelog](./CHANGELOG.md) - Version history and release notes

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [TypeScript](https://www.typescriptlang.org/)

## Support

For support, please contact the development team or open an issue in the repository.

## License

This project is proprietary and confidential.
