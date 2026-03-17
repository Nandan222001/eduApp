# Mobile App Testing Documentation

## Overview

This document describes the comprehensive testing infrastructure for the mobile application. The testing strategy includes unit tests, integration tests, component tests, and end-to-end (E2E) tests to ensure code quality and prevent regressions.

## Test Coverage Goals

- **Overall Coverage**: 70%+
- **Redux Slices**: 80%+
- **Components**: 70%+
- **Integration Tests**: Key user flows

## Testing Stack

### Unit & Integration Testing

- **Jest**: Test runner and assertion library
- **@testing-library/react-native**: Component testing utilities
- **@testing-library/jest-native**: Custom matchers for React Native

### E2E Testing

- **Detox**: End-to-end testing framework for React Native

## Project Structure

```
mobile/
├── __tests__/
│   ├── setup.ts                    # Jest setup and global mocks
│   ├── utils/                      # Test utilities
│   │   ├── mockNavigation.ts       # Navigation mocks
│   │   ├── mockStore.tsx           # Redux store test helpers
│   │   ├── mockApi.ts              # API mocking utilities
│   │   └── testHelpers.tsx         # Rendering helpers
│   ├── unit/                       # Unit tests
│   │   ├── authSlice.test.ts
│   │   ├── userSlice.test.ts
│   │   └── notificationSlice.test.ts
│   ├── integration/                # Integration tests
│   │   ├── authentication.test.tsx
│   │   ├── assignmentSubmission.test.tsx
│   │   └── offlineSync.test.ts
│   └── components/                 # Component tests
│       ├── LoginScreen.test.tsx
│       ├── DashboardScreen.test.tsx
│       └── AssignmentsScreen.test.tsx
├── e2e/                            # End-to-end tests
│   ├── config.json
│   ├── firstTest.e2e.js
│   ├── authentication.e2e.js
│   ├── assignments.e2e.js
│   └── studentDashboard.e2e.js
└── jest.config.js                  # Jest configuration
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Component Tests Only

```bash
npm run test:components
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### CI Mode

```bash
npm run test:ci
```

## E2E Tests

### iOS E2E Tests

```bash
# Build the app
npm run e2e:build:ios

# Run tests
npm run e2e:test:ios
```

### Android E2E Tests

```bash
# Build the app
npm run e2e:build:android

# Run tests
npm run e2e:test:android
```

### Run All Tests (Unit + E2E)

```bash
npm run test:all
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions, reducers, and utilities in isolation.

**Example: Testing a Redux Slice**

```typescript
import authReducer, { login, setUser } from '@store/slices/authSlice';
import { createMockStore, createMockUser } from '../utils';

describe('authSlice', () => {
  it('should handle setUser', () => {
    const user = createMockUser();
    const state = authReducer(initialState, setUser(user));
    expect(state.user).toEqual(user);
  });
});
```

### Component Tests

Component tests verify that components render correctly and handle user interactions.

**Example: Testing a Screen Component**

```typescript
import { renderWithProviders } from '../utils';
import { LoginScreen } from '@screens/auth/LoginScreen';

describe('LoginScreen', () => {
  it('should render login form', () => {
    const { getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
  });

  it('should handle login submission', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockAuthApi.login).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests

Integration tests verify that multiple components/modules work together correctly.

**Example: Authentication Flow**

```typescript
describe('Authentication Flow Integration', () => {
  it('should complete full login flow successfully', async () => {
    // Setup mocks
    mockAuthApi.login.mockResolvedValueOnce(loginResponse);

    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

    // Perform login
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    // Verify results
    await waitFor(() => {
      expect(mockAuthService.saveSession).toHaveBeenCalled();
    });
  });
});
```

### E2E Tests

E2E tests simulate real user interactions with the application.

**Example: E2E Test**

```javascript
describe('Login Flow', () => {
  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('student@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Test Utilities

### Mock Store Helper

```typescript
import { createMockStore } from '__tests__/utils';

const store = createMockStore({
  auth: createAuthenticatedState(),
});
```

### Rendering Helper

```typescript
import { renderWithProviders } from '__tests__/utils';

const { getByText } = renderWithProviders(<Component />, {
  preloadedState: { auth: authenticatedState },
});
```

### API Mocking

```typescript
import { mockAuthApi, resetApiMocks } from '__tests__/utils';

mockAuthApi.login.mockResolvedValueOnce({ data: loginResponse });
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory after running tests with coverage enabled.

View HTML coverage report:

```bash
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html  # Windows
```

## CI/CD Integration

The testing infrastructure is integrated with GitHub Actions. Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/mobile-tests.yml` for CI configuration.

## Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow the Arrange-Act-Assert pattern

### 2. Mocking

- Mock external dependencies (API calls, navigation, etc.)
- Use the provided mock utilities for consistency
- Reset mocks between tests

### 3. Async Testing

- Always use `await` with async operations
- Use `waitFor` for asynchronous assertions
- Set appropriate timeouts for slow operations

### 4. Test Data

- Use the provided factory functions for test data
- Keep test data minimal and focused
- Use realistic data when testing edge cases

### 5. Coverage

- Aim for 70%+ overall coverage
- Focus on critical paths and business logic
- Don't sacrifice quality for coverage numbers

## Debugging Tests

### Debug Mode

```bash
npm run test:debug
```

### VSCode Debugging

Add this configuration to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/mobile/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "cwd": "${workspaceFolder}/mobile",
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View Test Output

```bash
npm test -- --verbose
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Check that path aliases in `jest.config.js` match `tsconfig.json`

**Issue**: Async tests timeout
**Solution**: Increase timeout or check for unresolved promises

**Issue**: Detox tests fail to launch app
**Solution**: Rebuild the app with `npm run e2e:build:ios` or `npm run e2e:build:android`

**Issue**: Snapshots mismatch
**Solution**: Update snapshots with `npm test -- -u`

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Testing Redux](https://redux.js.org/usage/writing-tests)

## Contributing

When adding new features:

1. Write tests for new code
2. Maintain or improve coverage
3. Update test documentation if needed
4. Ensure all tests pass before submitting PR

## Support

For questions or issues with tests, contact the development team or open an issue in the repository.
