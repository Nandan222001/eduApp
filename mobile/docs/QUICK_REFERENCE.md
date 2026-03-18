# Quick Reference Guide

A condensed reference for common tasks and information in the EDU Mobile app development.

## Essential Commands

### Development
```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Run with dev client
npm run dev
```

### Code Quality
```bash
# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check

# Run all checks
npm run lint && npm run type-check && npm test
```

### Testing
```bash
# Unit tests
npm test
npm run test:watch
npm run test:coverage

# E2E tests
npm run test:e2e:ios
npm run test:e2e:android
```

### Building
```bash
# Development builds
npm run build:dev:ios
npm run build:dev:android

# Production builds
npm run build:prod:ios
npm run build:prod:android

# Submit to stores
npm run submit:ios
npm run submit:android
```

### Maintenance
```bash
# Clear cache
npm start -- --reset-cache

# Clean project
rm -rf node_modules
npm install

# Clear Watchman (macOS)
watchman watch-del-all

# Clean iOS
cd ios && pod install && cd ..

# Clean Android
cd android && ./gradlew clean && cd ..
```

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation setup
│   ├── store/            # State management (Zustand)
│   ├── services/         # Business logic services
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── constants/        # Constants and configs
│   └── theme/            # Theme configuration
├── assets/               # Images, fonts, etc.
├── docs/                 # Documentation
└── __tests__/            # Test files
```

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | App entry point |
| `app.json` | Expo configuration |
| `eas.json` | EAS Build config |
| `package.json` | Dependencies |
| `tsconfig.json` | TypeScript config |
| `.env.development` | Dev environment |
| `.env.production` | Prod environment |

## API Endpoints Quick Reference

### Base URL
- Development: `http://localhost:8000`
- Production: `https://api.edu.app`

### Authentication
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

### Student
- `GET /api/v1/assignments` - List assignments
- `POST /api/v1/submissions` - Submit assignment
- `GET /api/v1/grades` - Get grades
- `GET /api/v1/schedule` - Get schedule
- `GET /api/v1/attendance` - Get attendance

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PUT /api/v1/notifications/{id}/read` - Mark read
- `POST /api/v1/notifications/register-device` - Register push token

## State Management

### Zustand Store Usage
```typescript
// Define store
export const useMyStore = create<MyState>((set) => ({
  data: [],
  fetchData: async () => {
    const result = await api.getData();
    set({ data: result });
  },
}));

// Use in component
const { data, fetchData } = useMyStore();

// Selective subscription
const data = useMyStore((state) => state.data);
```

## Navigation

### Navigate Between Screens
```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

// Navigate to screen
navigation.navigate('ScreenName', { param: value });

// Go back
navigation.goBack();

// Replace current screen
navigation.replace('ScreenName');
```

## API Integration

### Making API Calls
```typescript
import { apiClient } from '@api/client';

// GET request
const response = await apiClient.get<DataType>('/endpoint');

// POST request
const response = await apiClient.post<DataType>('/endpoint', data);

// With params
const response = await apiClient.get('/endpoint', {
  params: { page: 1, limit: 20 }
});

// Error handling
try {
  const response = await apiClient.get('/data');
  setData(response.data);
} catch (error: any) {
  Alert.alert('Error', error.message);
}
```

## Common Patterns

### Loading State
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const response = await api.getData();
    setData(response.data);
  } catch (error: any) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};

if (isLoading) return <Loading />;
if (error) return <ErrorView message={error} />;
```

### FlatList Optimization
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Memoization
```typescript
// Memoize component
const MyComponent = React.memo(({ data }) => {
  return <View>{/* ... */}</View>;
});

// Memoize callback
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize value
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

## Styling

### StyleSheet
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});

<View style={styles.container}>
  <Text style={styles.text}>Hello</Text>
</View>
```

### Conditional Styles
```typescript
<View style={[
  styles.container,
  isActive && styles.active,
  { marginTop: spacing }
]}>
```

## Environment Variables

### Access in Code
```typescript
import { API_URL } from '@env';

console.log('API URL:', API_URL);
```

### Available Variables
- `API_URL` - Backend API URL
- `API_TIMEOUT` - Request timeout
- `SENTRY_DSN` - Sentry DSN
- `ENABLE_BIOMETRIC_AUTH` - Feature flag

## Debugging

### Console Logs
```typescript
console.log('Debug:', data);
console.warn('Warning:', message);
console.error('Error:', error);
```

### React Native Debugger
```bash
# Open debug menu
# iOS: Cmd + D
# Android: Cmd + M (or shake device)

# Enable:
# - Debug JS Remotely
# - Show Performance Monitor
# - Show Inspector
```

### Network Debugging
```typescript
// In src/api/client.ts
console.log('Request:', config);
console.log('Response:', response);
console.log('Error:', error);
```

## Testing

### Unit Test Template
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('ComponentName', () => {
  it('should render correctly', () => {
    const { getByText } = render(<ComponentName />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should handle press', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ComponentName onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## TypeScript

### Common Types
```typescript
// Component props
interface MyComponentProps {
  title: string;
  count?: number;
  onPress: () => void;
}

// API response
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Navigation params
type StackParamList = {
  Home: undefined;
  Detail: { id: number };
};
```

## Git Workflow

### Branch Naming
```bash
feature/assignment-submission
fix/login-error
refactor/api-client
docs/readme-update
```

### Commit Messages
```bash
feat(assignments): add file upload
fix(auth): resolve token refresh
docs(api): update endpoint documentation
refactor(navigation): simplify routing
test(components): add Button tests
```

### Common Git Commands
```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat(scope): description"

# Push branch
git push origin feature/my-feature

# Update from main
git checkout main
git pull
git checkout feature/my-feature
git rebase main
```

## Troubleshooting Quick Fixes

### App won't start
```bash
npm start -- --reset-cache
rm -rf node_modules && npm install
```

### Build fails
```bash
# iOS
cd ios && pod install && cd ..

# Android
cd android && ./gradlew clean && cd ..
```

### TypeScript errors
```bash
rm -rf tsconfig.tsbuildinfo
npx tsc --build --clean
```

### Metro bundler issues
```bash
watchman watch-del-all
npx react-native start --reset-cache
```

## Performance Tips

1. **Use FlatList** for long lists, not ScrollView
2. **Memoize components** with React.memo
3. **Use useCallback** for event handlers
4. **Optimize images** - compress and use appropriate sizes
5. **Lazy load** non-critical features
6. **Remove console.logs** in production
7. **Enable Hermes** for Android
8. **Profile with** React DevTools Profiler

## Security Checklist

- [ ] Use HTTPS for all API calls
- [ ] Store tokens in Expo Secure Store
- [ ] Validate all user inputs
- [ ] Don't log sensitive data
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement proper error handling
- [ ] Test authentication flows

## Resources

### Documentation
- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [API Integration](./API_INTEGRATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### External Links
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Docs](https://www.typescriptlang.org/)

### Team Channels
- Slack: #mobile-dev
- Email: dev-team@edu.app
- Issues: GitHub Issues

---

**Pro Tip**: Bookmark this page for quick reference during development!
