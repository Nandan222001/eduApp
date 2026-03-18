# Testing Quick Reference

A quick reference guide for running tests in the mobile application.

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suites
npm run test:unit           # Unit tests only
npm run test:components     # Component tests only
npm run test:integration    # Integration tests only

# E2E tests
npm run test:e2e:ios        # iOS E2E
npm run test:e2e:android    # Android E2E

# CI mode
npm run test:ci
```

## 📁 File Locations

```
mobile/
├── jest.config.js              # Jest configuration
├── .detoxrc.js                 # Detox configuration
├── __tests__/                  # All tests
│   ├── setup.ts                # Test setup
│   ├── utils/                  # Test utilities
│   ├── unit/                   # Unit tests
│   ├── components/             # Component tests
│   └── integration/            # Integration tests
└── e2e/                        # E2E tests
```

## 🧪 Test Types

### Unit Tests (/__tests__/unit/)
Test individual functions and modules in isolation.

**Examples:**
- Redux slices (authSlice, assignmentsSlice)
- API functions (authApi, assignmentsApi)
- Utilities (validators, formatters)
- Services (secureStorage, offlineQueue)

**Run:** `npm run test:unit`

### Component Tests (/__tests__/components/)
Test React components with user interactions.

**Examples:**
- LoginScreen
- HomeScreen
- AssignmentDetailScreen
- Button, Input, Card components

**Run:** `npm run test:components`

### Integration Tests (/__tests__/integration/)
Test complete user flows across multiple components.

**Examples:**
- Authentication flow
- Assignment submission
- Offline synchronization

**Run:** `npm run test:integration`

### E2E Tests (/e2e/)
Test entire application in simulator/emulator.

**Examples:**
- Login flow
- Assignment workflow
- Navigation paths

**Run:** `npm run test:e2e:ios` or `npm run test:e2e:android`

## 🛠️ Test Utilities

### renderWithProviders
Render components with Redux, Theme, Navigation, and Query providers.

```typescript
import { renderWithProviders } from '../utils';

const { getByText } = renderWithProviders(<MyComponent />);
```

### createMockNavigation
Create mock navigation for screen components.

```typescript
import { createMockNavigation } from '../utils';

const mockNav = createMockNavigation();
```

### MSW Server
Mock API responses for tests.

```typescript
import { server } from '../utils';

beforeAll(() => server.listen());
afterAll(() => server.close());
```

## 📊 Coverage

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

**Targets:**
- Statements: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

## 📝 Writing Tests

### Basic Test Structure

```typescript
describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Test

```typescript
import { renderWithProviders } from '../utils';

it('should render and handle click', () => {
  const onPress = jest.fn();
  const { getByText } = renderWithProviders(
    <Button title="Click" onPress={onPress} />
  );
  
  fireEvent.press(getByText('Click'));
  expect(onPress).toHaveBeenCalled();
});
```

### Async Test

```typescript
it('should load data', async () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  
  await waitFor(() => {
    expect(getByText('Loaded')).toBeTruthy();
  });
});
```

## 🐛 Debugging

### Run Single Test File
```bash
npm test -- path/to/test.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- -t "pattern"
```

### Update Snapshots
```bash
npm test -- -u
```

### Clear Jest Cache
```bash
npx jest --clearCache
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `__tests__/README.md` | Comprehensive testing guide |
| `__tests__/EXAMPLES.md` | Code examples for all test types |
| `__tests__/QUICK_START_TESTING.md` | Quick start guide |
| `TESTING_SUITE_IMPLEMENTATION.md` | Implementation details |
| `TESTING_IMPLEMENTATION_CHECKLIST.md` | Complete checklist |

## 🔥 Common Tasks

### Before Committing
```bash
npm run test:coverage
npm run lint
npm run type-check
```

### Adding New Feature
1. Write tests first (TDD)
2. Implement feature
3. Run tests
4. Check coverage
5. Commit

### Fixing Bug
1. Write failing test
2. Fix bug
3. Test passes
4. Verify no regressions

### Reviewing PR
1. Check tests added
2. Run tests locally
3. Review coverage report
4. Check CI status

## ⚡ Tips

1. **Use watch mode** during development
2. **Run specific tests** to save time
3. **Check coverage** for gaps
4. **Mock external deps** properly
5. **Keep tests focused** and simple
6. **Update snapshots** carefully
7. **Write descriptive** test names

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout in jest.config.js |
| Mock not working | Check module path in jest.config.js |
| Coverage too low | Run with --coverage to see gaps |
| E2E tests fail | Rebuild app, check simulator |
| Flaky tests | Check for race conditions, add waits |

## 🔗 Resources

- [Jest Docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/react-native)
- [Detox Docs](https://wix.github.io/Detox/)
- [MSW Docs](https://mswjs.io/)

## Summary

**38 files created** with comprehensive testing infrastructure:
- ✅ 8 unit test files
- ✅ 6 component test files
- ✅ 3 integration test files
- ✅ 3 E2E test suites
- ✅ 6 test utility modules
- ✅ 6 documentation files
- ✅ 5 configuration files
- ✅ 1 CI/CD workflow

**Ready to test!** 🎉
