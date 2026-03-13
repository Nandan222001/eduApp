# Contributing to E2E Tests

## Guidelines for Writing E2E Tests

### 1. Test Structure

Each test should follow the AAA pattern:
- **Arrange**: Set up test data and navigate to the page
- **Act**: Perform the action being tested
- **Assert**: Verify the expected outcome

```typescript
test('should submit assignment', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
  
  // Act
  const dashboardPage = new StudentDashboardPage(page);
  await dashboardPage.submitAssignment(0, 'test-file.pdf');
  
  // Assert
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### 2. Page Object Model

Always use Page Object Model to encapsulate page logic:

```typescript
export class MyPage {
  readonly page: Page;
  readonly myButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.myButton = page.locator('[data-testid="my-button"]');
  }

  async clickButton() {
    await this.myButton.click();
  }
}
```

### 3. Selector Best Practices

Prefer selectors in this order:
1. `data-testid` attributes (most stable)
2. ARIA roles and labels
3. Text content
4. CSS selectors (least stable)

```typescript
// Good
page.locator('[data-testid="submit-button"]')
page.locator('button[aria-label="Submit"]')

// Avoid
page.locator('.btn-primary.submit')
```

### 4. Wait Strategies

Use appropriate wait strategies:

```typescript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific element
await page.locator('[data-testid="content"]').waitFor({ state: 'visible' });

// Wait for API response
await page.waitForResponse(response => response.url().includes('/api/'));
```

### 5. Test Independence

Each test should be independent:
- Don't rely on test execution order
- Clean up test data after each test
- Use beforeEach/afterEach hooks appropriately

```typescript
test.beforeEach(async ({ page }) => {
  // Set up for each test
  await clearTestData();
});

test.afterEach(async ({ page }) => {
  // Clean up after each test
  await resetState();
});
```

### 6. Flakiness Prevention

Avoid flaky tests:
- Use auto-waiting locators
- Avoid hard-coded timeouts
- Use `waitForStable()` before screenshots
- Handle race conditions properly

```typescript
// Bad
await page.waitForTimeout(1000);

// Good
await page.locator('[data-testid="element"]').waitFor({ state: 'visible' });
```

### 7. Test Data Management

Use fixtures for test data:

```typescript
// fixtures/test-data.ts
export const TEST_USERS = {
  student: {
    email: 'student@test.com',
    password: 'TestPass123!',
  },
};

// In test
import { TEST_USERS } from '../fixtures/test-data';
await loginPage.login(TEST_USERS.student.email, TEST_USERS.student.password);
```

### 8. Error Handling

Handle expected errors gracefully:

```typescript
test('should show error for invalid input', async ({ page }) => {
  await loginPage.login('invalid', 'wrong');
  
  const errorMessage = await loginPage.getErrorMessage();
  expect(errorMessage).toContain('Invalid credentials');
});
```

### 9. Visual Regression Testing

For visual tests:
- Use stable viewport sizes
- Wait for animations to complete
- Set appropriate diff thresholds

```typescript
test('visual snapshot', async ({ page }) => {
  await page.goto('/dashboard');
  await waitForStable(page, 'main');
  
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixels: 100,
  });
});
```

### 10. Mobile Testing

For mobile tests:
- Test touch interactions
- Verify responsive layouts
- Test orientation changes

```typescript
test.use({ ...devices['iPhone 12'] });

test('mobile navigation', async ({ page }) => {
  const menuButton = page.locator('[data-testid="mobile-menu"]');
  await menuButton.click();
  
  await expect(page.locator('[data-testid="nav-drawer"]')).toBeVisible();
});
```

## Code Review Checklist

Before submitting:
- [ ] Tests follow AAA pattern
- [ ] Page objects used for page interactions
- [ ] Stable selectors (prefer data-testid)
- [ ] No hard-coded waits
- [ ] Test data in fixtures
- [ ] Tests are independent
- [ ] Error cases covered
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No console errors

## Running Tests Locally

```bash
# Install dependencies
npm install

# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/tests/student/login-and-assignment.spec.ts

# Run in UI mode
npm run test:e2e:ui

# Run with debug
npx playwright test --debug

# Generate report
npx playwright show-report
```

## Debugging Tips

1. **Use headed mode**: `npx playwright test --headed`
2. **Use UI mode**: `npm run test:e2e:ui`
3. **Add pause**: `await page.pause()`
4. **View trace**: `npx playwright show-trace trace.zip`
5. **Screenshot on demand**: `await page.screenshot({ path: 'debug.png' })`
6. **Console logs**: `page.on('console', msg => console.log(msg.text()))`

## Common Issues

### Test timeout
- Increase timeout: `test.setTimeout(60000)`
- Check for network issues
- Verify element selectors

### Element not found
- Use proper wait strategies
- Check selector stability
- Verify element is in DOM

### Flaky tests
- Use auto-waiting locators
- Avoid race conditions
- Wait for animations to complete

## Performance Considerations

- Use parallel execution (default)
- Limit browser instances in CI
- Share authentication state where possible
- Clean up resources after tests

## Documentation

Update documentation when:
- Adding new page objects
- Creating new test categories
- Adding new utilities
- Changing test patterns
