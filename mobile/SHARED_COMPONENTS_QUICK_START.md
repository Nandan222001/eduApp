# Shared Components - Quick Start Guide

## Installation

```bash
cd mobile
npm install
```

## Setup (One-time)

### 1. Wrap your App with ThemeProvider

```tsx
// mobile/App.tsx
import { ThemeProvider } from '@/theme';
import { ErrorBoundary } from '@components/shared';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {/* Your existing app code */}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

## Basic Usage

### Import Components

```tsx
import {
  Button,
  Input,
  Card,
  Avatar,
  Badge,
  LoadingSpinner,
  EmptyState,
} from '@components/shared';
import { useTheme } from '@/theme';
```

### Use the Theme

```tsx
function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Hello World
      </Text>
    </View>
  );
}
```

### Common Patterns

#### Form Screen
```tsx
import { ScreenContainer, Header, Card, Input, Button } from '@components/shared';

export const FormScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScreenContainer keyboardAware>
      <Header title="Login" />
      <Card elevation="md">
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          leftIcon="email"
          placeholder="Enter email"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          leftIcon="lock"
          secureTextEntry
        />
        <Button
          title="Login"
          variant="primary"
          fullWidth
          onPress={handleLogin}
        />
      </Card>
    </ScreenContainer>
  );
};
```

#### List Screen
```tsx
import {
  ScreenContainer,
  Header,
  SectionHeader,
  Card,
  Avatar,
  Badge,
  EmptyState,
  RefreshControl,
} from '@components/shared';

export const ListScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <Header title="Items" />
        <EmptyState
          icon="inbox"
          title="No Items"
          description="Get started by adding your first item"
          actionLabel="Add Item"
          onActionPress={() => {}}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <Header title="Items" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <SectionHeader
          title="Recent Items"
          actionLabel="View All"
          onActionPress={() => {}}
        />
        {items.map(item => (
          <Card key={item.id} elevation="sm">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={item.name} size="medium" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text>{item.name}</Text>
                <Badge label={item.status} variant="success" />
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
};
```

## Available Components

### Core UI
- **Button** - Primary, secondary, outline, ghost, danger variants
- **Input** - Text input with validation and icons
- **Card** - Container with elevation
- **Avatar** - Profile photos with fallbacks
- **Badge** - Status indicators

### Display
- **EmptyState** - Empty state with icon and CTA
- **LoadingSpinner** - Loading indicator
- **ErrorBoundary** - Error catching

### Input Controls
- **DatePicker** - Date/time selection
- **FilePicker** - Document upload
- **ImagePicker** - Photo selection/capture

### Layout
- **ScreenContainer** - Screen wrapper with SafeArea
- **Header** - Navigation header
- **SectionHeader** - Section titles

### Advanced
- **BottomSheet** - Modal bottom sheet
- **RefreshControl** - Pull-to-refresh

## Theme Values

```tsx
const { theme } = useTheme();

// Colors
theme.colors.primary
theme.colors.background
theme.colors.text
theme.colors.error

// Spacing
theme.spacing.xs   // 4
theme.spacing.sm   // 8
theme.spacing.md   // 16
theme.spacing.lg   // 24

// Typography
theme.typography.h1
theme.typography.body
theme.typography.caption

// Others
theme.borderRadius.md
theme.shadows.md
```

## Icons

Use MaterialCommunityIcons names:
- `check`, `close`, `menu`, `settings`
- `account`, `email`, `lock`, `phone`
- `calendar`, `clock`, `map-marker`
- `camera`, `image`, `file`

Browse: https://pictogrammers.com/library/mdi/

## Common Tasks

### Toggle Theme
```tsx
const { toggleTheme } = useTheme();
<Button title="Toggle Theme" onPress={toggleTheme} />
```

### Show Loading
```tsx
const [loading, setLoading] = useState(false);

if (loading) {
  return <LoadingSpinner fullScreen text="Loading..." />;
}
```

### Handle Errors
```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error(error);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Use Bottom Sheet
```tsx
const bottomSheetRef = useRef<BottomSheetModal>(null);

<Button
  title="Open Options"
  onPress={() => bottomSheetRef.current?.present()}
/>

<BottomSheet ref={bottomSheetRef} title="Options">
  <Text>Content here</Text>
</BottomSheet>
```

## Documentation

- **Full Component Docs**: `/mobile/src/components/shared/README.md`
- **Implementation Guide**: `/mobile/SHARED_COMPONENTS_GUIDE.md`
- **Examples**: `/mobile/SHARED_COMPONENTS_EXAMPLES.tsx`
- **Summary**: `/mobile/SHARED_COMPONENTS_IMPLEMENTATION.md`

## Tips

1. Always import from `@components/shared` or `@/theme`
2. Use `useTheme()` hook for theme values
3. Wrap screens with `ScreenContainer`
4. Use theme spacing values for consistency
5. All icons are MaterialCommunityIcons
6. Cards provide automatic elevation/shadows
7. Buttons handle loading states automatically

## Need Help?

Check the examples file for real-world usage patterns:
```tsx
import { ExampleLoginScreen, ComponentShowcaseScreen } from '../SHARED_COMPONENTS_EXAMPLES';
```
