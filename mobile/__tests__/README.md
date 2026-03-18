# Mobile App Testing Guide

This document provides comprehensive information about the testing suite for the mobile application.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

## Overview

The testing suite includes:

- **Unit Tests**: Testing Redux slices, API functions, and utility functions
- **Component Tests**: Testing React components with React Native Testing Library
- **Integration Tests**: Testing complete user flows (auth, assignment submission, offline sync)
- **E2E Tests**: End-to-end testing with Detox

### Coverage Goals

- Statements: 70%+
- Branches: 65%+
- Functions: 70%+
- Lines: 70%+

## Setup

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Required Dev Dependencies

- `jest` - Test runner
- `@testing-library/react-native` - Testing utilities for React Native
- `@testing-library/jest-native` - Additional matchers
- `msw` - Mock Service Worker for API mocking
- `detox` - E2E testing framework

## Test Structure

```
mobile/
├── __tests__/
│   ├── setup.ts                  # Global test setup
│   ├── utils/                    # Test utilities
│   │   ├── mockNavigation.ts     # Navigation mocks
│   │   ├── mockStore.tsx         # Redux store mocks
│   │   ├── mockTheme.tsx         # Theme provider mocks
│   │   ├── testRenderer.tsx      # Custom render function
│   │   └── mswServer.ts          # MSW server configuration
│   ├── __mocks__/                # Module mocks
│   │   └── fileMock.js
│   ├── unit/                     # Unit tests
│   │   ├── authSlice.test.ts
│   │   ├── assignmentsSlice.test.ts
│   │   ├── authApi.test.ts
│   │   ├── assignmentsApi.test.ts
│   │   ├── validators.test.ts
│   │   └── formatters.test.ts
│   ├── components/               # Component tests
│   │   ├── LoginScreen.test.tsx
│   │   ├── HomeScreen.test.tsx
│   │   └── AssignmentDetailScreen.test.tsx
│   └── integration/              # Integration tests
│       ├── authFlow.test.tsx
│       ├── assignmentSubmission.test.tsx
│       └── offlineSync.test.ts
└── e2e/                          # E2E tests
    ├── config.json
    ├── jest.config.js
    ├── environment.js
    ├── login.e2e.js
    ├── assignment.e2e.js
    └── navigation.e2e.js
```

## Running Tests

### All Tests

```bash
npm test
# or
yarn test
```

### Watch Mode

```bash
npm run test:watch
# or
yarn test:watch
```

### Coverage Report

```bash
npm run test:coverage
# or
yarn test:coverage
```

### Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Component tests only
npm run test:components

# Integration tests only
npm run test:integration
```

### E2E Tests

```bash
# Build the app first
npm run test:e2e:build:ios
npm run test:e2e:build:android

# Run E2E tests
npm run test:e2e:ios
npm run test:e2e:android

# Or combined
npm run test:e2e
```

### CI/CD

```bash
npm run test:ci
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions or modules in isolation.

```typescript
import { validators } from '../../src/utils/validators';

describe('validators', () => {
  describe('email', () => {
    it('should validate correct email', () => {
      expect(validators.email('test@example.com')).toBe(true);
    });

    it('should invalidate incorrect email', () => {
      expect(validators.email('invalid')).toBe(false);
    });
  });
});
```

### Component Tests

Component tests verify that UI components render correctly and handle user interactions.

```typescript
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { renderWithProviders, createMockNavigation } from '../utils';

describe('LoginScreen', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = { key: 'Login', name: 'Login' as const, params: undefined };

  it('should render login form', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('should handle email input', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });
});
```

### Integration Tests

Integration tests verify that multiple components or modules work together correctly.

```typescript
import { server } from '../utils';
import { rest } from 'msw';

describe('Authentication Flow', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should complete successful login flow', async () => {
    // Test implementation
  });
});
```

### E2E Tests

E2E tests verify complete user journeys in a real device/simulator environment.

```javascript
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  it('should display login screen', async () => {
    await expect(element(by.text('Welcome Back'))).toBeVisible();
  });

  it('should complete login', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Login')).tap();

    await waitFor(element(by.text('Welcome')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Best Practices

### General

1. **Keep tests focused**: Each test should verify one specific behavior
2. **Use descriptive names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
4. **Clean up**: Reset mocks and state between tests
5. **Avoid implementation details**: Test behavior, not implementation

### Component Testing

1. **Use renderWithProviders**: Always wrap components with necessary providers
2. **Test user interactions**: Focus on what users can see and do
3. **Avoid testing implementation**: Don't test internal state or methods
4. **Use accessible queries**: Prefer queries like `getByText`, `getByRole` over `getByTestId`
5. **Mock external dependencies**: Mock API calls, navigation, and other external services

### E2E Testing

1. **Test critical paths**: Focus on the most important user journeys
2. **Use stable selectors**: Prefer testID over text-based selectors
3. **Handle async operations**: Use `waitFor` for loading states
4. **Keep tests independent**: Each test should be able to run in isolation
5. **Clean state between tests**: Reset app state before each test

### Mocking

1. **Mock external services**: Don't make real API calls in tests
2. **Use MSW for API mocking**: Consistent API mocking across tests
3. **Mock complex dependencies**: Simplify tests by mocking heavy dependencies
4. **Keep mocks realistic**: Mocks should behave like real implementations
5. **Update mocks with code**: Keep mocks in sync with actual implementations

## Debugging Tests

### Debug Individual Test

```bash
# Run specific test file
jest __tests__/components/LoginScreen.test.tsx

# Run specific test case
jest -t "should render login form"
```

### Debug with Chrome DevTools

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### Debug E2E Tests

```bash
# Run with debug mode
detox test --configuration ios.debug --loglevel trace

# Take screenshots on failure
detox test --take-screenshots failing
```

## Continuous Integration

Tests are automatically run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase jest timeout or check for unresolved promises
2. **Flaky tests**: Ensure proper cleanup and avoid race conditions
3. **Mock not working**: Verify mock path matches module path
4. **E2E tests failing**: Ensure device/simulator is properly configured

### Getting Help

- Check Jest documentation: https://jestjs.io/
- Check Testing Library docs: https://testing-library.com/react-native
- Check Detox documentation: https://wix.github.io/Detox/

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [MSW Documentation](https://mswjs.io/)
- [Detox Documentation](https://wix.github.io/Detox/)
