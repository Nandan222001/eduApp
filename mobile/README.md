# EDU Mobile App

Mobile application for the EDU platform built with React Native and Expo.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development on macOS)
- Android Studio with emulator (for Android development)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure your API endpoints.

### 3. Start the development server

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your physical device

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

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
mobile/
├── assets/              # Images, fonts, and other static assets
├── src/
│   ├── api/            # API client and endpoints
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── navigation/     # Navigation configuration
│   ├── store/          # State management (Zustand)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── constants/      # App constants and theme
├── App.tsx             # App entry point
├── app.json            # Expo configuration
├── eas.json            # EAS Build configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Environment Configuration

The app supports three environments:

- **Development**: `.env.development` - Local development
- **Staging**: `.env.staging` - Staging/preview environment
- **Production**: `.env.production` - Production environment

Configure the appropriate environment variables in each file.

## Building for Production

### iOS

1. Configure `eas.json` with your Apple credentials
2. Run: `npm run build:prod:ios`
3. Submit: `npm run submit:ios`

### Android

1. Configure `eas.json` with your Google Play credentials
2. Run: `npm run build:prod:android`
3. Submit: `npm run submit:android`

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: Zustand
- **API Client**: Axios
- **Code Quality**: ESLint, Prettier
- **Build**: EAS Build

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
