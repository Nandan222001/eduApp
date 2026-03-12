# E2E Testing Quick Start Guide

## Overview

This guide will help you quickly get started with running the comprehensive E2E test suite for the educational platform.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository cloned

## Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

3. **Install system dependencies (if needed)**
   ```bash
   npx playwright install-deps
   ```

## Running Tests

### Quick Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run specific test suite
npx playwright test e2e/tests/student
npx playwright test e2e/tests/teacher
npx playwright test e2e/tests/admin
npx playwright test e2e/tests/visual

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project="Mobile Chrome"

# Run in headed mode (see browser)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug
```

### Test Categories

1. **Student Tests** (`e2e/tests/student/`)
   - Login and authentication
   - Assignment submission
   - AI prediction dashboard
   - What-if scenarios

2. **Teacher Tests** (`e2e/tests/teacher/`)
   - Attendance marking
   - Grading workflow
   - Bulk operations

3. **Parent Tests** (`e2e/tests/parent/`)
   - Child progress viewing
   - Attendance monitoring
   - Grade tracking

4. **Admin Tests** (`e2e/tests/admin/`)
   - Subscription management
   - Plan upgrades
   - User management

5. **Real-time Tests** (`e2e/tests/realtime/`)
   - Chat messaging
   - Notifications
   - Live updates

6. **Search Tests** (`e2e/tests/search/`)
   - Search functionality
   - Filtering
   - Pagination

7. **Mobile Tests** (`e2e/tests/mobile/`)
   - Responsive layouts
   - Touch interactions
   - Mobile navigation

8. **Visual Tests** (`e2e/tests/visual/`)
   - Screenshot comparisons
   - UI consistency
   - Dark mode

9. **Accessibility Tests** (`e2e/tests/accessibility/`)
   - Keyboard navigation
   - Screen reader support
   - WCAG compliance

10. **Performance Tests** (`e2e/tests/performance/`)
    - Load times
    - Core Web Vitals
    - API response times

## Viewing Results

### HTML Report

After tests run, view the HTML report:

```bash
npx playwright show-report
```

This opens an interactive report in your browser with:
- Test results
- Screenshots
- Videos
- Traces
- Error details

### View Trace

For detailed debugging:

```bash
npx playwright show-trace test-results/.../trace.zip
```

## Configuration

### Environment Variables

Create `e2e/.env` file (optional):

```env
BASE_URL=http://localhost:5173
TEST_TIMEOUT=30000
HEADLESS=true
```

### Update Test Data

Edit `e2e/fixtures/test-data.ts` to update:
- Test user credentials
- Assignment data
- Subscription plans
- Other test data

## Development Workflow

### 1. Write a New Test

Create a new test file:

```typescript
// e2e/tests/my-feature/my-test.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Your test logic here
  });
});
```

### 2. Run Your Test

```bash
npx playwright test e2e/tests/my-feature/my-test.spec.ts
```

### 3. Debug if Needed

```bash
npx playwright test e2e/tests/my-feature/my-test.spec.ts --debug
```

### 4. Update Baselines (for visual tests)

```bash
npx playwright test --update-snapshots
```

## Common Tasks

### Running Tests in CI

Tests automatically run in CI when:
- Pushing to main/develop
- Creating pull requests
- Nightly scheduled runs

### Parallel Execution

Tests run in parallel by default. Control workers:

```bash
# Run with specific number of workers
npx playwright test --workers=4

# Run serially
npx playwright test --workers=1
```

### Retry Failed Tests

```bash
# Retry failed tests only
npx playwright test --last-failed

# Retry with specific count
npx playwright test --retries=2
```

### Filter Tests

```bash
# Run tests with specific tag
npx playwright test --grep @smoke

# Skip tests with tag
npx playwright test --grep-invert @skip

# Run by file pattern
npx playwright test login
```

## Debugging Tips

1. **Use UI Mode** - Best for development
   ```bash
   npm run test:e2e:ui
   ```

2. **Add Breakpoints** - Use `await page.pause()`
   ```typescript
   await page.pause(); // Test execution will pause here
   ```

3. **Screenshot on Demand**
   ```typescript
   await page.screenshot({ path: 'debug.png', fullPage: true });
   ```

4. **Console Logs**
   ```typescript
   page.on('console', msg => console.log(msg.text()));
   ```

5. **Network Inspection**
   ```typescript
   page.on('request', request => console.log(request.url()));
   page.on('response', response => console.log(response.status()));
   ```

## Best Practices

1. ✅ Use Page Object Model
2. ✅ Use `data-testid` for selectors
3. ✅ Wait for network idle after navigation
4. ✅ Use test fixtures for data
5. ✅ Keep tests independent
6. ✅ Clean up after tests
7. ✅ Handle asynchronous operations properly
8. ✅ Use meaningful test descriptions

## Troubleshooting

### Tests Timeout

- Increase timeout in test
- Check network connectivity
- Verify selectors are correct

### Element Not Found

- Use proper wait strategies
- Check element is in DOM
- Verify selector stability

### Flaky Tests

- Use auto-waiting locators
- Wait for animations to complete
- Avoid hard-coded timeouts

### Visual Differences

- Update baselines if intentional changes
- Check for animation timing issues
- Verify viewport consistency

## Resources

- [Playwright Documentation](https://playwright.dev)
- [E2E Test README](./e2e/README.md)
- [Contributing Guide](./e2e/CONTRIBUTING.md)
- [CI/CD Configuration](./.github/workflows/e2e-tests.yml)

## Support

For issues or questions:
1. Check existing test files for examples
2. Review Playwright documentation
3. Check GitHub issues
4. Contact the testing team

## Next Steps

1. **Run your first test**
   ```bash
   npm run test:e2e:ui
   ```

2. **Explore test files** in `e2e/tests/`

3. **Read the full documentation** in `e2e/README.md`

4. **Contribute** using guidelines in `e2e/CONTRIBUTING.md`

Happy Testing! 🚀
