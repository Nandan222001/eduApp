# Quick Start - Testing Guide

Get up and running with the mobile app test suite in minutes.

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- For E2E tests: Xcode (iOS) or Android Studio (Android)

## Installation

```bash
# Install dependencies (if not already done)
cd mobile
npm install
```

All testing dependencies are already configured in `package.json`.

## Running Your First Test

### 1. Run All Tests

```bash
npm test
```

This runs all unit, component, and integration tests.

### 2. Run Tests in Watch Mode

```bash
npm run test:watch
```

Great for development - automatically reruns tests when files change.

### 3. Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Component tests only
npm run test:components

# Integration tests only
npm run test:integration
```

### 4. Generate Coverage Report

```bash
npm run test:coverage
```

View the HTML report at `coverage/lcov-report/index.html`.

## Writing Your First Test

### 1. Create a Test File

Create a new file in the appropriate directory:
- Unit tests: `__tests__/unit/yourTest.test.ts`
- Component tests: `__tests__/components/YourComponent.test.tsx`
- Integration tests: `__tests__/integration/yourFlow.test.tsx`

### 2. Write a Simple Unit Test

```typescript
// __tests__/unit/myFunction.test.ts
import { myFunction } from '../../src/utils/myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### 3. Write a Component Test

```typescript
// __tests__/components/MyComponent.test.tsx
import React from 'react';
import { MyComponent } from '../../src/components/MyComponent';
import { renderWithProviders } from '../utils';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });
});
```

### 4. Run Your Test

```bash
npm test -- myFunction.test
```

## Running E2E Tests

### iOS

```bash
# Build the app
npm run test:e2e:build:ios

# Run E2E tests
npm run test:e2e:ios
```

### Android

```bash
# Build the app
npm run test:e2e:build:android

# Run E2E tests
npm run test:e2e:android
```

## Common Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:unit` | Run unit tests only |
| `npm run test:components` | Run component tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:ci` | Run tests in CI mode |

## Test Utilities

### renderWithProviders

Renders components with all necessary providers (Redux, Theme, Navigation, Query Client).

```typescript
import { renderWithProviders } from '../utils';

const { getByText } = renderWithProviders(<MyComponent />);
```

### createMockNavigation

Creates a mock navigation object for testing screens.

```typescript
import { createMockNavigation } from '../utils';

const mockNavigation = createMockNavigation();
```

### createTestQueryClient

Creates a test Query Client with optimized settings.

```typescript
import { createTestQueryClient } from '../utils';

const queryClient = createTestQueryClient();
```

### MSW Server

Mock API responses for tests.

```typescript
import { server } from '../utils';
import { rest } from 'msw';

beforeAll(() => server.listen());
afterAll(() => server.close());

// Override response
server.use(
  rest.get('/api/endpoint', (req, res, ctx) => {
    return res(ctx.json({ data: 'mocked' }));
  })
);
```

## Tips for Success

1. **Start with Unit Tests**: They're fastest and easiest to write
2. **Use Test-Driven Development**: Write tests before implementation
3. **Keep Tests Isolated**: Each test should be independent
4. **Mock External Dependencies**: Don't make real API calls
5. **Use Descriptive Names**: Test names should describe behavior
6. **Follow AAA Pattern**: Arrange, Act, Assert

## Getting Help

- Check the [README](__tests__/README.md) for comprehensive documentation
- See [EXAMPLES](__tests__/EXAMPLES.md) for code examples
- Review existing tests for patterns
- Ask the team for help!

## Next Steps

1. ✅ Run `npm test` to see existing tests
2. ✅ Run `npm run test:coverage` to see coverage
3. ✅ Write a simple unit test for a utility function
4. ✅ Write a component test for a UI component
5. ✅ Run your tests and see them pass!

## Troubleshooting

### Tests are failing

- Check that dependencies are installed: `npm install`
- Clear Jest cache: `npx jest --clearCache`
- Check for syntax errors in test files

### Coverage is too low

- Run `npm run test:coverage` to see which files need tests
- Focus on critical business logic first
- Aim for 70%+ coverage on new code

### E2E tests won't run

- Ensure simulator/emulator is set up correctly
- Check Detox configuration in `.detoxrc.js`
- Build the app first before running tests

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [MSW Documentation](https://mswjs.io/)
