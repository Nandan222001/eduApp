# E2E Test Suite

Comprehensive end-to-end testing suite using Playwright for the educational platform.

## Overview

This test suite covers:
- **Student workflows**: Login, assignment submission, AI prediction dashboard
- **Teacher workflows**: Attendance marking, grading assignments
- **Parent workflows**: Viewing child progress, attendance, grades
- **Admin workflows**: Subscription management, analytics
- **Real-time features**: Chat, notifications
- **Search & filtering**: Cross-page search functionality
- **Mobile responsive**: Touch interactions, responsive layouts
- **Visual regression**: Screenshot comparisons for key pages

## Directory Structure

```
e2e/
├── fixtures/              # Test data and mock responses
│   ├── test-data.ts      # Test user credentials, assignments, etc.
│   ├── auth-state.ts     # Authentication state helpers
│   └── mock-api-responses.ts
├── page-objects/          # Page Object Model classes
│   ├── LoginPage.ts
│   ├── StudentDashboardPage.ts
│   ├── TeacherDashboardPage.ts
│   ├── ParentDashboardPage.ts
│   ├── AdminDashboardPage.ts
│   ├── AIPredictionPage.ts
│   ├── ChatPage.ts
│   └── SearchPage.ts
├── tests/                 # Test specifications
│   ├── student/          # Student workflow tests
│   ├── teacher/          # Teacher workflow tests
│   ├── parent/           # Parent workflow tests
│   ├── admin/            # Admin workflow tests
│   ├── realtime/         # Real-time feature tests
│   ├── search/           # Search and filter tests
│   ├── mobile/           # Mobile responsive tests
│   └── visual/           # Visual regression tests
├── utils/                 # Helper utilities
│   └── helpers.ts
└── setup/                 # Global setup/teardown
    ├── global-setup.ts
    └── global-teardown.ts
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test suite
```bash
npx playwright test e2e/tests/student
npx playwright test e2e/tests/teacher
npx playwright test e2e/tests/visual
```

### Run tests in UI mode
```bash
npm run test:e2e:ui
```

### Run tests in headed mode
```bash
npx playwright test --headed
```

### Run specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"
```

### Run with debug
```bash
npx playwright test --debug
```

### Generate test report
```bash
npx playwright show-report
```

## Test Categories

### 1. Student Workflow Tests
- Login authentication
- Assignment viewing and submission
- File upload functionality
- Dashboard navigation
- AI prediction dashboard interaction
- What-if scenario analysis

### 2. Teacher Workflow Tests
- Attendance marking
- Bulk attendance operations
- Assignment grading
- Student performance tracking
- Report generation

### 3. Parent Workflow Tests
- Child selection
- Progress monitoring
- Attendance viewing
- Grade tracking
- Notification management

### 4. Admin Workflow Tests
- Subscription plan viewing
- Plan upgrades
- Billing history
- Invoice downloads
- Feature comparison

### 5. Real-time Feature Tests
- Chat messaging
- Typing indicators
- Online status
- Real-time notifications
- Notification badges
- Message persistence

### 6. Search & Filter Tests
- Basic search
- Advanced filtering
- Sorting
- Pagination
- Multi-entity search
- Search suggestions
- Result export

### 7. Mobile Responsive Tests
- Touch interactions
- Mobile navigation
- Responsive layouts
- Orientation changes
- Touch-friendly buttons
- Mobile-specific UI elements

### 8. Visual Regression Tests
- Page snapshots
- Component snapshots
- Dark mode
- Mobile layouts
- Modal dialogs
- Interactive states

## Writing New Tests

### 1. Create a Page Object

```typescript
// e2e/page-objects/MyPage.ts
import { Page, Locator } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly element: Locator;

  constructor(page: Page) {
    this.page = page;
    this.element = page.locator('[data-testid="my-element"]');
  }

  async goto() {
    await this.page.goto('/my-page');
  }

  async performAction() {
    await this.element.click();
  }
}
```

### 2. Write Test Spec

```typescript
// e2e/tests/my-test.spec.ts
import { test, expect } from '@playwright/test';
import { MyPage } from '../page-objects/MyPage';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    const myPage = new MyPage(page);
    await myPage.goto();
    await myPage.performAction();
    
    await expect(myPage.element).toBeVisible();
  });
});
```

## Best Practices

1. **Use Page Object Model**: Encapsulate page logic in page objects
2. **Use data-testid**: Prefer `data-testid` attributes for stable selectors
3. **Wait for stability**: Use `waitForStable()` before screenshots
4. **Handle network**: Use `waitForNetworkIdle()` after navigation
5. **Reuse fixtures**: Use test data from fixtures
6. **Parallel execution**: Tests run in parallel by default
7. **Retry on failure**: Tests retry 2 times in CI
8. **Take screenshots**: On failure, screenshots are automatically captured
9. **Video recording**: Videos recorded on failure

## CI/CD Integration

Tests are configured to run in CI with:
- Parallel execution (1 worker in CI)
- Automatic retries (2 retries)
- Multiple browsers (Chrome, Firefox, Safari)
- Mobile devices (Pixel 5, iPhone 12)
- HTML, JUnit, and JSON reporters
- Screenshot and video artifacts

## Debugging

### View trace
```bash
npx playwright show-trace trace.zip
```

### Inspect element
```bash
npx playwright test --debug
```

### Pause execution
```typescript
await page.pause();
```

### Screenshot on demand
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

## Configuration

The test configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:5173`
- Timeout: 30 seconds per test
- Screenshot: On failure
- Video: On failure
- Trace: On first retry

## Environment Variables

- `BASE_URL`: Override base URL (default: http://localhost:5173)
- `CI`: Set to true for CI mode
- `HEADED`: Run in headed mode

## Visual Regression

Visual regression tests compare screenshots:
- Baseline screenshots stored in repository
- Differences highlighted in test results
- Maximum allowed pixel difference: 100-300 pixels
- Full page and component-level snapshots

### Update baselines
```bash
npx playwright test --update-snapshots
```

## Mobile Testing

Tests run on:
- iPhone 12 (390x844)
- Pixel 5 (393x851)
- iPad Pro (1024x1366)

Mobile-specific features tested:
- Touch interactions
- Swipe gestures
- Responsive layouts
- Mobile navigation
- Bottom navigation
- Hamburger menus

## Accessibility Testing

Basic accessibility checks included:
- Missing alt attributes
- Missing ARIA labels
- Keyboard navigation
- Focus management

## Performance

Network conditions can be simulated:
```typescript
await setSlowNetwork(page);  // 500kb/s, 400ms latency
await resetNetwork(page);     // Reset to normal
```

## Troubleshooting

### Test timeouts
Increase timeout in test:
```typescript
test('long running test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
});
```

### Flaky tests
Use auto-waiting and stable selectors:
```typescript
await waitForStable(page, selector);
```

### Element not found
Use `waitFor` with explicit state:
```typescript
await page.locator(selector).waitFor({ state: 'visible' });
```
