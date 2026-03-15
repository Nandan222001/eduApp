# Mobile App Implementation Guide

This document details the implementation of the EDU Mobile application.

## Project Structure

The mobile app is organized as follows:

```
mobile/
├── assets/                 # Static assets (icons, splash screens, images)
│   └── .gitkeep
├── scripts/               # Setup and utility scripts
│   ├── setup.sh          # Unix/Linux/macOS setup script
│   └── setup.ps1         # Windows PowerShell setup script
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Axios API client with interceptors
│   │   ├── auth.ts       # Authentication API endpoints
│   │   └── index.ts
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx    # Custom button component
│   │   ├── Input.tsx     # Custom input component
│   │   ├── Card.tsx      # Card container component
│   │   ├── Loading.tsx   # Loading spinner component
│   │   └── index.ts
│   ├── constants/        # App-wide constants
│   │   └── index.ts      # Colors, spacing, fonts, etc.
│   ├── navigation/       # React Navigation setup
│   │   ├── RootNavigator.tsx  # Main navigation container
│   │   ├── types.ts      # Navigation type definitions
│   │   └── index.ts
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx    # Login screen
│   │   ├── HomeScreen.tsx     # Home/dashboard screen
│   │   └── index.ts
│   ├── store/            # State management (Zustand)
│   │   ├── authStore.ts  # Authentication state
│   │   └── index.ts
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts      # Core types
│   │   └── env.d.ts      # Environment variable types
│   └── utils/            # Utility functions
│       ├── storage.ts    # AsyncStorage wrapper
│       ├── validators.ts # Form validation utilities
│       ├── formatters.ts # Data formatting utilities
│       └── index.ts
├── .editorconfig         # Editor configuration
├── .env.development      # Development environment variables
├── .env.staging          # Staging environment variables
├── .env.production       # Production environment variables
├── .env.example          # Example environment file
├── .eslintignore         # ESLint ignore patterns
├── .eslintrc.js          # ESLint configuration
├── .gitignore            # Git ignore patterns
├── .npmrc                # npm configuration
├── .prettierignore       # Prettier ignore patterns
├── .prettierrc           # Prettier configuration
├── App.tsx               # Main app component
├── app.config.js         # Expo app configuration (dynamic)
├── app.json              # Expo app configuration (static)
├── babel.config.js       # Babel configuration
├── eas.json              # EAS Build configuration
├── index.js              # App entry point
├── metro.config.js       # Metro bundler configuration
├── package.json          # Dependencies and scripts
├── README.md             # User documentation
├── tsconfig.json         # TypeScript configuration
└── IMPLEMENTATION.md     # This file
```

## Technology Stack

- **Framework**: Expo ~50.0.0
- **Language**: TypeScript 5.3+
- **React**: 18.2.0
- **React Native**: 0.73.2
- **Navigation**: React Navigation 6.x
  - Stack Navigator
  - Bottom Tabs Navigator
- **State Management**: Zustand 4.4+
- **API Client**: Axios 1.6+
- **Data Fetching**: TanStack Query 5.x
- **Storage**: AsyncStorage
- **Code Quality**:
  - ESLint 8.x
  - Prettier 3.x
  - TypeScript strict mode

## Key Features Implemented

### 1. Authentication System
- Login screen with form validation
- JWT token-based authentication
- Automatic token persistence
- Token refresh handling
- Secure storage of credentials

### 2. API Integration
- Centralized API client with Axios
- Request/response interceptors
- Automatic token injection
- Error handling and transformation
- Environment-based API endpoints

### 3. State Management
- Zustand store for authentication
- Persistent state across app restarts
- Type-safe state updates
- Clean separation of concerns

### 4. Navigation
- Stack-based navigation
- Conditional routing (authenticated/unauthenticated)
- Type-safe navigation props
- Deep linking support ready

### 5. UI Components
- Reusable Button component with variants
- Custom Input component with validation
- Card container component
- Loading indicator
- Consistent design system

### 6. Design System
- Centralized color palette
- Consistent spacing scale
- Typography system
- Border radius constants
- Theme-ready architecture

### 7. Developer Experience
- TypeScript with strict mode
- Path aliases for clean imports
- ESLint and Prettier configuration
- Hot reloading
- Environment variable support

## Configuration Files

### app.json
Static Expo configuration:
- App name: "EDU Mobile"
- Bundle identifier: com.edu.mobile
- Orientation, splash screen, and icon settings
- Platform-specific configurations

### eas.json
EAS Build configuration with three profiles:
- **Development**: Development client, internal distribution
- **Preview**: Internal testing, APK/IPA builds
- **Production**: Production builds (AAB for Android, optimized for iOS)

### Environment Variables
Three environment files for different stages:
- `.env.development`: Local development (localhost:8000)
- `.env.staging`: Staging environment
- `.env.production`: Production environment

Each contains:
- `API_URL`: Backend API endpoint
- `WS_URL`: WebSocket endpoint
- `APP_ENV`: Environment identifier

## Development Workflow

### Initial Setup
```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with your API endpoints
npm start
```

### Running the App
```bash
npm start          # Start Expo dev server
npm run ios        # Open in iOS simulator
npm run android    # Open in Android emulator
```

### Code Quality
```bash
npm run lint       # Run ESLint
npm run lint:fix   # Auto-fix ESLint issues
npm run format     # Format with Prettier
npm run type-check # TypeScript type checking
```

### Building
```bash
# Development builds
npm run build:dev:ios
npm run build:dev:android

# Preview builds
npm run build:preview:ios
npm run build:preview:android

# Production builds
npm run build:prod:ios
npm run build:prod:android
```

## Path Aliases

TypeScript and Babel are configured with path aliases for clean imports:

```typescript
import { Button } from '@components';        // instead of '../../../components'
import { useAuthStore } from '@store';       // instead of '../../store'
import { apiClient } from '@api';            // instead of '../api'
import { COLORS } from '@constants';         // instead of '../../constants'
import { validators } from '@utils';         // instead of '../utils'
import type { User } from '@types';          // instead of '../../types'
```

## API Client Architecture

The API client (`src/api/client.ts`) provides:
- Automatic JWT token injection
- Request/response interceptors
- Centralized error handling
- Type-safe responses
- Environment-based base URL

```typescript
// Usage example
import { apiClient } from '@api';

const response = await apiClient.get<User>('/users/me');
const user = response.data;
```

## State Management

Zustand stores provide:
- Minimal boilerplate
- Type-safe state and actions
- React hooks integration
- Easy testing

```typescript
// Usage example
import { useAuthStore } from '@store';

function MyComponent() {
  const { user, login, logout } = useAuthStore();
  // ...
}
```

## Next Steps for Expansion

### Immediate Additions
1. Add more screens (Dashboard, Profile, Settings)
2. Implement bottom tab navigation
3. Add push notification support
4. Integrate more API endpoints
5. Add offline support with AsyncStorage
6. Implement error boundaries

### Medium-term Additions
1. Add biometric authentication
2. Implement deep linking
3. Add analytics tracking
4. Implement app updates (OTA)
5. Add crash reporting (Sentry)
6. Implement feature flags

### Advanced Features
1. Offline-first architecture
2. Background sync
3. Advanced caching strategies
4. Performance monitoring
5. A/B testing infrastructure
6. Multi-language support (i18n)

## Build Profiles Explained

### Development
- Development client enabled
- Internal distribution only
- Fast iteration
- Debugging tools enabled

### Preview
- Internal testing
- QA distribution
- Staging API endpoints
- Similar to production but for testing

### Production
- Optimized builds
- Production API endpoints
- App store ready
- AAB for Android (smaller download size)

## Security Considerations

1. **Token Storage**: Tokens stored in secure AsyncStorage
2. **Environment Variables**: Sensitive data in `.env` files (not committed)
3. **API Communication**: HTTPS enforced in production
4. **Code Obfuscation**: Enabled in production builds
5. **Certificate Pinning**: Ready to implement if needed

## Testing Strategy

While tests are not yet implemented, the structure supports:
- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox or Maestro
- API mocking with MSW

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install`
   - Clear cache: `expo start -c`

2. **Environment variables not working**
   - Ensure `.env` file exists
   - Restart Expo dev server
   - Check `babel.config.js` for dotenv plugin

3. **Build failures**
   - Check `eas.json` configuration
   - Verify credentials: `eas credentials`
   - Check logs: `eas build:list`

4. **Type errors**
   - Run `npm run type-check`
   - Ensure all dependencies have types
   - Check `tsconfig.json` paths

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [EAS Build](https://docs.expo.dev/build/introduction/)
