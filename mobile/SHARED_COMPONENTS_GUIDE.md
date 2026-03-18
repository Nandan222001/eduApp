# Shared Component Library Implementation Guide

This guide explains the shared UI component library that has been implemented for the mobile app.

## Overview

A comprehensive set of reusable UI components with full theme support (light/dark mode) has been created in `/mobile/src/components/shared/`.

## Installation

The following dependencies have been added to `package.json`:
- `@gorhom/bottom-sheet`: ^4.6.1
- `@react-native-community/datetimepicker`: ^7.6.2

Run the following to install:
```bash
cd mobile
npm install
```

## Theme System

### Location
- `/mobile/src/theme/`
  - `colors.ts` - Light and dark color palettes
  - `typography.ts` - Font sizes, weights, and text styles
  - `spacing.ts` - Spacing scale, border radius, shadows
  - `ThemeContext.tsx` - Theme provider and hook
  - `index.ts` - Main export file

### Setup

Wrap your app with `ThemeProvider`:

```tsx
import { ThemeProvider } from '@/theme';

function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        {/* Your navigation */}
      </NavigationContainer>
    </ThemeProvider>
  );
}
```

### Usage

```tsx
import { useTheme } from '@/theme';

function MyComponent() {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ 
        color: theme.colors.text,
        ...theme.typography.h4 
      }}>
        Hello World
      </Text>
      <Button onPress={toggleTheme} title="Toggle Theme" />
    </View>
  );
}
```

## Component Library

### Core Components

1. **Button** - Enhanced button with loading, disabled states, and icons
   - Variants: primary, secondary, outline, ghost, danger
   - Sizes: small, medium, large
   - Features: loading spinner, icon support, full width option

2. **Input** - Text input with validation error display
   - Features: label, error messages, helper text
   - Icons: left and right icon support
   - Auto password visibility toggle for secure text entry

3. **Card** - Container with elevation and borders
   - Elevation levels: none, sm, base, md, lg, xl
   - Optional borders
   - Customizable padding

4. **Avatar** - Profile photo display
   - Supports: image URI, initials from name, icon
   - Sizes: small, medium, large, xlarge
   - Rounded or square variants

5. **Badge** - Status indicators
   - Variants: default, primary, secondary, success, warning, error, info
   - Sizes: small, medium, large
   - Icon support

6. **EmptyState** - Empty state with illustration and CTA
   - Customizable icon, title, description
   - Optional action button

7. **LoadingSpinner** - Activity indicator
   - Sizes: small, large
   - Optional text label
   - Full screen or inline

8. **RefreshControl** - Pull-to-refresh component
   - Theme-aware colors
   - Drop-in replacement for RN RefreshControl

### Advanced Components

9. **BottomSheet** - Modal bottom sheet using @gorhom/bottom-sheet
   - Customizable snap points
   - Title support
   - Backdrop with dismiss

10. **DatePicker** - Date/time picker wrapper
    - Modes: date, time, datetime
    - Min/max date constraints
    - Error display

11. **FilePicker** - Document picker
    - Multiple file types support
    - Single or multiple selection

12. **ImagePicker** - Image/camera picker
    - Camera or library selection
    - Image cropping
    - Quality control

13. **ErrorBoundary** - React error boundary
    - Catches component errors
    - Custom fallback UI
    - Error logging callback

### Layout Components

14. **ScreenContainer** - Screen wrapper with SafeAreaView
    - ScrollView option
    - Keyboard awareness
    - Padding control
    - Edge control

15. **Header** - Navigation header with back button
    - Back button (auto-navigation)
    - Title and subtitle
    - Right action button

16. **SectionHeader** - Section title with action
    - Title and subtitle
    - Optional icon
    - Action link

## Icons

All components use MaterialCommunityIcons from `react-native-vector-icons`.

Browse icons: https://pictogrammers.com/library/mdi/

Example icon names:
- `check`, `close`, `alert`, `information`
- `account`, `email`, `phone`, `lock`
- `calendar`, `clock`, `map-marker`
- `camera`, `image`, `file`, `folder`

## Import Paths

Components can be imported using path aliases:

```tsx
import { Button, Input, Card } from '@components/shared';
import { useTheme } from '@/theme';
```

Or direct imports:

```tsx
import { Button } from '@/components/shared/Button';
import { useTheme } from '@/theme/ThemeContext';
```

## Example Screen

```tsx
import React, { useState } from 'react';
import {
  ScreenContainer,
  Header,
  Card,
  Input,
  Button,
  SectionHeader,
  LoadingSpinner,
} from '@components/shared';
import { useTheme } from '@/theme';

export const ExampleScreen = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Your logic here
    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <ScreenContainer scroll keyboardAware>
      <Header title="Example Screen" />
      
      <SectionHeader
        title="Login Form"
        subtitle="Enter your credentials"
        icon="account"
      />

      <Card elevation="md">
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          leftIcon="email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          leftIcon="lock"
          secureTextEntry
        />

        <Button
          title="Login"
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          icon="login"
        />
      </Card>
    </ScreenContainer>
  );
};
```

## Theme Values

### Colors
```tsx
theme.colors.primary
theme.colors.secondary
theme.colors.error
theme.colors.warning
theme.colors.success
theme.colors.background
theme.colors.surface
theme.colors.text
theme.colors.textSecondary
theme.colors.border
```

### Spacing
```tsx
theme.spacing.xs   // 4
theme.spacing.sm   // 8
theme.spacing.md   // 16
theme.spacing.lg   // 24
theme.spacing.xl   // 32
theme.spacing['2xl']  // 48
```

### Typography
```tsx
theme.typography.h1
theme.typography.h2
theme.typography.h3
theme.typography.h4
theme.typography.body
theme.typography.caption
```

### Border Radius
```tsx
theme.borderRadius.sm    // 4
theme.borderRadius.md    // 8
theme.borderRadius.lg    // 12
theme.borderRadius.xl    // 16
theme.borderRadius.full  // 9999
```

### Shadows
```tsx
theme.shadows.sm
theme.shadows.base
theme.shadows.md
theme.shadows.lg
theme.shadows.xl
```

## Type Definitions

All components are fully typed with TypeScript. Use IDE autocomplete to explore available props.

## Next Steps

1. Install new dependencies: `npm install` in mobile directory
2. Wrap your app with `ThemeProvider`
3. Start using components in your screens
4. Customize theme colors/spacing if needed
5. Add custom components following the same patterns

## Reference

- Full component documentation: `/mobile/src/components/shared/README.md`
- Theme implementation: `/mobile/src/theme/`
- Component source: `/mobile/src/components/shared/`
