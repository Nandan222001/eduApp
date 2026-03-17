# Testing Quick Reference Guide

## 🚀 Common Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:components    # Component tests only

# Run specific test file
npm test -- LoginScreen.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Update snapshots
npm test -- -u

# Debug tests
npm run test:debug

# E2E tests
npm run e2e:build:ios
npm run e2e:test:ios
npm run e2e:build:android
npm run e2e:test:android
```

## 📝 Writing Tests - Quick Templates

### Unit Test Template

```typescript
import reducer, { action } from '@store/slices/slice';
import { createMockStore } from '../utils';

describe('Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle action', () => {
    const state = reducer(initialState, action(payload));
    expect(state.property).toEqual(expected);
  });
});
```

### Component Test Template

```typescript
import { renderWithProviders } from '../utils';
import { Component } from '@screens/Component';

describe('Component', () => {
  it('should render correctly', () => {
    const { getByText } = renderWithProviders(<Component />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interaction', async () => {
    const { getByText } = renderWithProviders(<Component />);

    fireEvent.press(getByText('Button'));

    await waitFor(() => {
      expect(mockFunction).toHaveBeenCalled();
    });
  });
});
```

### Integration Test Template

```typescript
import { renderWithProviders } from '../utils';

describe('Feature Integration', () => {
  it('should complete full flow', async () => {
    // Setup
    mockApi.method.mockResolvedValueOnce(mockData);

    // Render
    const { getByText, getByPlaceholderText } = renderWithProviders(<Screen />);

    // Act
    fireEvent.changeText(getByPlaceholderText('Input'), 'value');
    fireEvent.press(getByText('Submit'));

    // Assert
    await waitFor(() => {
      expect(mockApi.method).toHaveBeenCalled();
    });
  });
});
```

### E2E Test Template

```javascript
describe('Feature E2E', () => {
  beforeEach(async () => {
    await device.launchApp();
  });

  it('should complete user journey', async () => {
    await element(by.id('input')).typeText('value');
    await element(by.id('button')).tap();

    await waitFor(element(by.id('result')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## 🔧 Common Test Utilities

### Rendering with Providers

```typescript
// Basic rendering
const { getByText } = renderWithProviders(<Component />);

// With preloaded state
const { getByText } = renderWithProviders(<Component />, {
  preloadedState: {
    auth: createAuthenticatedState(),
  },
});

// With custom query client
const queryClient = createTestQueryClient();
const { getByText } = renderWithProviders(<Component />, {
  queryClient,
});
```

### Creating Mock Data

```typescript
// User
const user = createMockUser();
const authenticatedUser = createMockUser({ role: 'student' });

// Assignment
const assignment = createMockAssignment();
const overdueAssignment = createMockAssignment({
  status: 'overdue',
  dueDate: new Date(Date.now() - 86400000).toISOString(),
});

// Dashboard data
const dashboardData = createMockDashboardData();

// Notification
const notification = createMockNotification();
```

### Mocking APIs

```typescript
// Setup mock
mockAuthApi.login.mockResolvedValueOnce({ data: loginResponse });

// Verify call
expect(mockAuthApi.login).toHaveBeenCalledWith({
  email: 'test@example.com',
  password: 'password123',
});

// Reset mocks
resetApiMocks();
```

### Working with Redux Store

```typescript
// Create store with initial state
const store = createMockStore({
  auth: createAuthenticatedState(),
});

// Get state
const state = store.getState();

// Dispatch action
await store.dispatch(login(credentials));
```

## 🎯 Common Assertions

### Component Rendering

```typescript
// Element exists
expect(getByText('Text')).toBeTruthy();
expect(getByPlaceholderText('Placeholder')).toBeTruthy();
expect(getByTestId('test-id')).toBeTruthy();

// Element is visible
expect(element(by.id('element'))).toBeVisible();

// Element has correct value
expect(input.props.value).toBe('expected');

// Element has correct style
expect(view.props.style).toMatchObject({ color: 'red' });
```

### User Interactions

```typescript
// Text input
fireEvent.changeText(input, 'new value');

// Button press
fireEvent.press(button);

// Scroll
fireEvent.scroll(scrollView, { y: 100 });
```

### Async Operations

```typescript
// Wait for element
await waitFor(() => {
  expect(getByText('Text')).toBeTruthy();
});

// Wait with timeout
await waitFor(
  () => {
    expect(element).toBeTruthy();
  },
  { timeout: 5000 }
);

// Find by text (async)
const element = await findByText('Text');
```

### Redux State

```typescript
// State value
expect(state.auth.isAuthenticated).toBe(true);
expect(state.user.profile).toEqual(expectedUser);

// Action dispatched
expect(mockDispatch).toHaveBeenCalledWith(expectedAction);
```

### API Calls

```typescript
// Called
expect(mockApi.method).toHaveBeenCalled();

// Called with args
expect(mockApi.method).toHaveBeenCalledWith(expectedArgs);

// Call count
expect(mockApi.method).toHaveBeenCalledTimes(1);

// Not called
expect(mockApi.method).not.toHaveBeenCalled();
```

## 🐛 Debugging

### View Test Output

```typescript
// Console log
console.log(screen.debug());

// Get tree structure
const tree = screen.toJSON();
console.log(JSON.stringify(tree, null, 2));

// Query helpers
screen.logTestingPlaygroundURL();
```

### Breakpoints

```typescript
// In test
debugger; // Will pause when running test:debug

// In VSCode, set breakpoint and use debug configuration
```

### Inspect Redux Store

```typescript
const { store } = renderWithProviders(<Component />);
console.log(store.getState());
```

## 🔍 Finding Elements

### By Text

```typescript
getByText('Exact Text');
getByText(/pattern/i);
queryByText('May Not Exist'); // Returns null if not found
findByText('Async Element'); // Returns promise
```

### By Placeholder

```typescript
getByPlaceholderText('Enter email');
```

### By Test ID

```typescript
getByTestId('unique-test-id');
```

### By Role (E2E)

```javascript
element(by.id('test-id'));
element(by.text('Text'));
element(by.label('Label'));
element(by.type('RCTTextInput'));
```

## ⚡ Performance Tips

1. Use `screen` instead of destructuring for better performance
2. Use `queryBy*` when element might not exist
3. Use `findBy*` for async elements
4. Clear mocks in `beforeEach` to prevent memory leaks
5. Use specific queries over generic ones

## 🎨 Best Practices

### DO ✅

- Write clear, descriptive test names
- Test user behavior, not implementation
- Use data-testid sparingly (prefer text/label)
- Mock external dependencies
- Clean up after tests
- Test error states and edge cases

### DON'T ❌

- Test implementation details
- Over-mock (mock only what's necessary)
- Test libraries/frameworks
- Write flaky tests
- Ignore warnings
- Skip cleanup

## 📊 Coverage Tips

```bash
# View coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# Check specific file coverage
npm test -- --coverage --collectCoverageFrom="src/screens/LoginScreen.tsx"

# Coverage in watch mode
npm test -- --watch --coverage
```

## 🆘 Common Issues

### Issue: "Cannot find module"

```bash
# Check jest.config.js moduleNameMapper
# Ensure it matches tsconfig.json paths
```

### Issue: Tests timeout

```typescript
// Increase timeout
jest.setTimeout(10000);

// Or in specific test
it('test', async () => {
  // ...
}, 10000);
```

### Issue: Act warnings

```typescript
// Wrap state updates in act()
await waitFor(() => {
  expect(element).toBeTruthy();
});
```

### Issue: Network request warnings

```typescript
// Mock all API calls
beforeEach(() => {
  mockApi.method.mockResolvedValue(mockData);
});
```

## 📱 E2E Specific

### Common Actions

```javascript
// Tap
await element(by.id('button')).tap();

// Type
await element(by.id('input')).typeText('text');

// Scroll
await element(by.id('scrollView')).scrollTo('bottom');

// Swipe
await element(by.id('list')).swipe('down');

// Wait for element
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(5000);
```

### Matchers

```javascript
// Visibility
.toBeVisible()
.toBeNotVisible()

// Existence
.toExist()
.toNotExist()

// Value
.toHaveText('text')
.toHaveValue('value')
```

---

**Quick Links:**

- [Full Testing Guide](./TESTING.md)
- [Test Summary](./TEST_SUMMARY.md)
- [Jest Docs](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Detox Docs](https://wix.github.io/Detox/)
