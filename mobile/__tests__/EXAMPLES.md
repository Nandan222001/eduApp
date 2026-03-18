# Testing Examples

This document provides practical examples for writing different types of tests in the mobile application.

## Table of Contents

- [Unit Testing Examples](#unit-testing-examples)
- [Component Testing Examples](#component-testing-examples)
- [Integration Testing Examples](#integration-testing-examples)
- [E2E Testing Examples](#e2e-testing-examples)
- [Common Testing Patterns](#common-testing-patterns)

## Unit Testing Examples

### Testing Redux Slices

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout } from '../../src/store/slices/authSlice';

describe('authSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  it('should handle login success', async () => {
    // Mock the API response
    const mockUser = { id: 1, email: 'test@example.com' };
    
    // Dispatch the action
    await store.dispatch(login({ email: 'test@example.com', password: 'pass' }));
    
    // Verify the state
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
  });
});
```

### Testing API Functions

```typescript
import { authApi } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';

jest.mock('../../src/api/client');

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call login endpoint with credentials', async () => {
    const mockResponse = { data: { access_token: 'token' } };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authApi.login({ 
      email: 'test@example.com', 
      password: 'password' 
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
    expect(result).toEqual(mockResponse);
  });
});
```

### Testing Utility Functions

```typescript
import { validators } from '../../src/utils/validators';

describe('validators', () => {
  describe('email validation', () => {
    it.each([
      ['test@example.com', true],
      ['invalid.email', false],
      ['test@', false],
      ['', false],
    ])('should validate %s as %s', (email, expected) => {
      expect(validators.email(email)).toBe(expected);
    });
  });

  describe('password validation', () => {
    it('should require minimum 8 characters', () => {
      expect(validators.password('short')).toBe(false);
      expect(validators.password('longpassword')).toBe(true);
    });
  });
});
```

### Testing Async Functions

```typescript
import { backgroundSyncService } from '../../src/utils/backgroundSync';

describe('backgroundSyncService', () => {
  it('should trigger manual sync', async () => {
    const mockResult = { success: true, synced: 5 };
    
    jest.spyOn(backgroundSyncService, 'triggerManualSync')
      .mockResolvedValue(mockResult);

    const result = await backgroundSyncService.triggerManualSync();

    expect(result).toEqual(mockResult);
  });

  it('should handle sync errors', async () => {
    jest.spyOn(backgroundSyncService, 'triggerManualSync')
      .mockRejectedValue(new Error('Sync failed'));

    await expect(backgroundSyncService.triggerManualSync())
      .rejects.toThrow('Sync failed');
  });
});
```

## Component Testing Examples

### Testing Screen Components

```typescript
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';
import { renderWithProviders, createMockNavigation } from '../utils';

describe('LoginScreen', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = { key: 'Login', name: 'Login' as const, params: undefined };

  it('should render and handle user input', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Check if elements are rendered
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();

    // Simulate user input
    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should validate form and show errors', async () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText(/required/i)).toBeTruthy();
    });
  });

  it('should navigate on successful login', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalled();
    });
  });
});
```

### Testing Components with Redux

```typescript
import React from 'react';
import { HomeScreen } from '../../src/screens/student/HomeScreen';
import { renderWithProviders, mockAuthState } from '../utils';

describe('HomeScreen with Redux', () => {
  it('should display user data from store', () => {
    const preloadedState = {
      auth: mockAuthState,
    };

    const { getByText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />,
      { preloadedState }
    );

    expect(getByText(mockAuthState.user.first_name)).toBeTruthy();
  });
});
```

### Testing Components with React Query

```typescript
import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { AssignmentDetailScreen } from '../../src/screens/student/AssignmentDetailScreen';
import { renderWithProviders, createTestQueryClient } from '../utils';

describe('AssignmentDetailScreen with React Query', () => {
  it('should load and display assignment data', async () => {
    const queryClient = createTestQueryClient();

    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient }
    );

    await waitFor(() => {
      expect(getByText('Math Homework')).toBeTruthy();
    });
  });
});
```

### Testing User Interactions

```typescript
it('should handle button press', () => {
  const onPress = jest.fn();
  const { getByText } = renderWithProviders(
    <Button title="Submit" onPress={onPress} />
  );

  fireEvent.press(getByText('Submit'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('should handle text input change', () => {
  const onChangeText = jest.fn();
  const { getByPlaceholderText } = renderWithProviders(
    <Input placeholder="Name" onChangeText={onChangeText} />
  );

  fireEvent.changeText(getByPlaceholderText('Name'), 'John Doe');
  expect(onChangeText).toHaveBeenCalledWith('John Doe');
});

it('should handle scroll', () => {
  const onScroll = jest.fn();
  const { getByTestId } = renderWithProviders(
    <ScrollView onScroll={onScroll} testID="scroll-view">
      <Text>Content</Text>
    </ScrollView>
  );

  fireEvent.scroll(getByTestId('scroll-view'), {
    nativeEvent: { contentOffset: { y: 100 } },
  });
  expect(onScroll).toHaveBeenCalled();
});
```

## Integration Testing Examples

### Testing Authentication Flow

```typescript
import { server } from '../utils';
import { rest } from 'msw';

describe('Complete Authentication Flow', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should complete full login to home flow', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Enter credentials
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    // Submit form
    fireEvent.press(getByText('Login'));

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  it('should handle login failure gracefully', async () => {
    server.use(
      rest.post('http://localhost:8000/auth/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
      })
    );

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText(/invalid/i)).toBeTruthy();
    });
  });
});
```

### Testing Data Synchronization

```typescript
describe('Offline Sync Integration', () => {
  it('should sync pending requests when online', async () => {
    const { result } = renderHook(() => useOfflineSync());

    // Simulate offline state with pending requests
    act(() => {
      // Add some requests to queue
    });

    // Trigger sync
    await act(async () => {
      await result.current.triggerManualSync();
    });

    // Verify queue is cleared
    expect(result.current.queueState.totalPending).toBe(0);
  });
});
```

## E2E Testing Examples

### Testing Login Flow

```javascript
describe('E2E: Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should complete login successfully', async () => {
    // Wait for login screen
    await expect(element(by.text('Welcome Back'))).toBeVisible();

    // Enter credentials
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');

    // Tap login button
    await element(by.text('Login')).tap();

    // Wait for home screen
    await waitFor(element(by.text('Home')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).typeText('wrongpass');
    await element(by.text('Login')).tap();

    await expect(element(by.text(/invalid/i))).toBeVisible();
  });
});
```

### Testing Navigation

```javascript
describe('E2E: Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Login')).tap();
    await waitFor(element(by.text('Home'))).toBeVisible();
  });

  it('should navigate through app screens', async () => {
    // Navigate to Assignments
    await element(by.text('Assignments')).tap();
    await expect(element(by.text('My Assignments'))).toBeVisible();

    // Navigate to Profile
    await element(by.text('Profile')).tap();
    await expect(element(by.text('My Profile'))).toBeVisible();

    // Go back to Home
    await element(by.text('Home')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });
});
```

### Testing Forms

```javascript
describe('E2E: Assignment Submission', () => {
  it('should submit assignment with file', async () => {
    // Navigate to assignment
    await element(by.text('Assignments')).tap();
    await element(by.id('assignment-item-0')).tap();

    // Add comments
    await element(by.id('comments-input')).typeText('My submission');

    // Upload file (mocked)
    await element(by.id('document-picker-button')).tap();

    // Submit
    await element(by.text('Submit Assignment')).tap();

    // Verify success
    await waitFor(element(by.text('Assignment Submitted!')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Common Testing Patterns

### Mocking Navigation

```typescript
const mockNavigation = createMockNavigation({
  navigate: jest.fn(),
  goBack: jest.fn(),
});
```

### Mocking API Responses

```typescript
// Using MSW
server.use(
  rest.get('/api/v1/assignments', (req, res, ctx) => {
    return res(ctx.json({ data: mockAssignments }));
  })
);
```

### Testing Async State

```typescript
it('should handle loading state', async () => {
  const { getByTestId, getByText } = renderWithProviders(<Component />);

  // Check loading indicator
  expect(getByTestId('loading-indicator')).toBeTruthy();

  // Wait for data to load
  await waitFor(() => {
    expect(getByText('Data Loaded')).toBeTruthy();
  });
});
```

### Testing Error States

```typescript
it('should display error message', async () => {
  server.use(
    rest.get('/api/endpoint', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ message: 'Server Error' }));
    })
  );

  const { getByText } = renderWithProviders(<Component />);

  await waitFor(() => {
    expect(getByText(/error/i)).toBeTruthy();
  });
});
```

### Testing with Timers

```typescript
it('should debounce search input', async () => {
  jest.useFakeTimers();
  const onSearch = jest.fn();

  const { getByPlaceholderText } = renderWithProviders(
    <SearchInput onSearch={onSearch} />
  );

  fireEvent.changeText(getByPlaceholderText('Search'), 'test');
  
  jest.advanceTimersByTime(300);

  expect(onSearch).toHaveBeenCalledWith('test');
  jest.useRealTimers();
});
```

### Snapshot Testing

```typescript
it('should match snapshot', () => {
  const { toJSON } = renderWithProviders(<Component />);
  expect(toJSON()).toMatchSnapshot();
});
```

## Best Practices Demonstrated

1. **Always clean up after tests**
```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

2. **Use data-testid for stable selectors**
```typescript
<View testID="component-container">
```

3. **Test user behavior, not implementation**
```typescript
// Good
fireEvent.press(getByText('Submit'));

// Bad
component.instance().handleSubmit();
```

4. **Use meaningful test descriptions**
```typescript
it('should display error when email is invalid', () => {
  // Test implementation
});
```

5. **Group related tests**
```typescript
describe('Login validation', () => {
  describe('email field', () => {
    it('should validate format', () => {});
    it('should show error for empty', () => {});
  });
});
```
