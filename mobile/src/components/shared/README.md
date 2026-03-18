# Shared UI Component Library

A comprehensive collection of reusable UI components for the mobile app with full theme support.

## Theme Provider

Before using any components, wrap your app with the `ThemeProvider`:

```tsx
import { ThemeProvider } from '@/theme';

function App() {
  return (
    <ThemeProvider>
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### Using the Theme Hook

```tsx
import { useTheme } from '@/theme';

function MyComponent() {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  
  // Access theme values
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  
  // Change theme
  setThemeMode('dark'); // 'light', 'dark', or 'auto'
  toggleTheme(); // Toggle between light and dark
}
```

## Components

### Button

```tsx
import { Button } from '@components/shared';

<Button
  title="Click Me"
  variant="primary" // primary, secondary, outline, ghost, danger
  size="medium" // small, medium, large
  loading={false}
  disabled={false}
  fullWidth={false}
  icon="check" // MaterialCommunityIcons name
  iconPosition="left" // left, right
  onPress={() => {}}
/>
```

### Input

```tsx
import { Input } from '@components/shared';

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  helperText="We'll never share your email"
  leftIcon="email"
  rightIcon="close"
  onRightIconPress={() => setEmail('')}
  secureTextEntry={false}
/>
```

### Card

```tsx
import { Card } from '@components/shared';

<Card
  elevation="base" // none, sm, base, md, lg, xl
  padding={16}
  bordered={false}
>
  <Text>Card content</Text>
</Card>
```

### Avatar

```tsx
import { Avatar } from '@components/shared';

<Avatar
  uri="https://example.com/photo.jpg"
  name="John Doe"
  size="medium" // small, medium, large, xlarge
  icon="account"
  backgroundColor="#3B82F6"
  textColor="#FFFFFF"
  rounded={true}
/>
```

### Badge

```tsx
import { Badge } from '@components/shared';

<Badge
  label="New"
  variant="primary" // default, primary, secondary, success, warning, error, info
  size="medium" // small, medium, large
  icon="star"
  rounded={true}
/>
```

### EmptyState

```tsx
import { EmptyState } from '@components/shared';

<EmptyState
  icon="inbox"
  title="No items found"
  description="Try adding some items to get started"
  actionLabel="Add Item"
  onActionPress={() => {}}
/>
```

### LoadingSpinner

```tsx
import { LoadingSpinner } from '@components/shared';

<LoadingSpinner
  size="large" // small, large
  text="Loading..."
  fullScreen={false}
  color="#3B82F6"
/>
```

### RefreshControl

```tsx
import { RefreshControl } from '@components/shared';
import { ScrollView } from 'react-native';

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  }
>
  {/* Content */}
</ScrollView>
```

### BottomSheet

```tsx
import { BottomSheet } from '@components/shared';
import { useRef } from 'react';

const bottomSheetRef = useRef<BottomSheetModal>(null);

<BottomSheet
  ref={bottomSheetRef}
  snapPoints={['50%', '90%']}
  title="Options"
  onClose={() => {}}
>
  <Text>Bottom sheet content</Text>
</BottomSheet>

// Open the sheet
bottomSheetRef.current?.present();

// Close the sheet
bottomSheetRef.current?.dismiss();
```

### DatePicker

```tsx
import { DatePicker } from '@components/shared';

<DatePicker
  label="Select Date"
  value={selectedDate}
  onChange={setSelectedDate}
  mode="date" // date, time, datetime
  minimumDate={new Date()}
  maximumDate={new Date(2025, 12, 31)}
  error={dateError}
  placeholder="Choose a date"
/>
```

### FilePicker

```tsx
import { FilePicker } from '@components/shared';

<FilePicker
  label="Upload Document"
  onFileSelect={(file) => console.log(file)}
  acceptedTypes={['application/pdf', 'image/*']}
  error={fileError}
  multiple={false}
/>
```

### ImagePicker

```tsx
import { ImagePicker } from '@components/shared';

<ImagePicker
  label="Profile Photo"
  onImageSelect={(uri) => console.log(uri)}
  error={imageError}
  currentImage={profilePhoto}
  aspectRatio={[1, 1]}
  quality={0.8}
/>
```

### ErrorBoundary

```tsx
import { ErrorBoundary } from '@components/shared';

<ErrorBoundary
  fallback={<CustomErrorScreen />}
  onError={(error, errorInfo) => {
    // Log to error tracking service
  }}
>
  {/* Your app components */}
</ErrorBoundary>
```

## Layout Components

### ScreenContainer

```tsx
import { ScreenContainer } from '@components/shared';

<ScreenContainer
  scroll={false}
  keyboardAware={true}
  padding={true}
  backgroundColor="#FFFFFF"
  edges={['top', 'bottom']}
>
  {/* Screen content */}
</ScreenContainer>
```

### Header

```tsx
import { Header } from '@components/shared';

<Header
  title="My Screen"
  subtitle="Subtitle text"
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
  rightIcon="settings"
  onRightPress={() => {}}
/>
```

### SectionHeader

```tsx
import { SectionHeader } from '@components/shared';

<SectionHeader
  title="Recent Activity"
  subtitle="Last 7 days"
  icon="clock-outline"
  actionLabel="View All"
  onActionPress={() => {}}
/>
```

## Icons

All components use MaterialCommunityIcons from `react-native-vector-icons`. Browse available icons at:
https://pictogrammers.com/library/mdi/

## Theme Customization

The theme provides:
- **Colors**: Full color palette with light/dark variants
- **Typography**: Pre-defined text styles (h1-h6, body, caption, etc.)
- **Spacing**: Consistent spacing scale
- **Border Radius**: Standard border radius values
- **Shadows**: Elevation shadows for cards and modals

Access theme values:

```tsx
const { theme } = useTheme();

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
});
```
