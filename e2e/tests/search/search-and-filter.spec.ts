import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { SearchPage } from '../../page-objects/SearchPage';
import { TEST_USERS } from '../../fixtures/test-data';
import { waitForNetworkIdle } from '../../utils/helpers';

test.describe('Search and Filtering Across Pages', () => {
  let loginPage: LoginPage;
  let searchPage: SearchPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    searchPage = new SearchPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await waitForNetworkIdle(page);
  });

  test('should perform basic search', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('mathematics');
    
    await expect(searchPage.resultsContainer).toBeVisible();
    
    const resultsCount = await searchPage.getResultsCount();
    expect(resultsCount).toBeGreaterThan(0);
  });

  test('should filter search results by type', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('assignment');
    
    await searchPage.filterByTypeOption('assignments');
    
    const results = await searchPage.resultItems.all();
    for (const result of results) {
      const type = await result.getAttribute('data-type');
      expect(type).toBe('assignments');
    }
  });

  test('should sort search results', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('test');
    
    await searchPage.sortBy('date-desc');
    
    await expect(searchPage.resultsContainer).toBeVisible();
  });

  test('should paginate through search results', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('student');
    
    const firstPageResults = await searchPage.getResultsCount();
    
    await searchPage.goToNextPage();
    
    const secondPageResults = await searchPage.getResultsCount();
    expect(secondPageResults).toBeGreaterThan(0);
  });

  test('should show no results message for invalid search', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('xyzabc123nonexistent');
    
    const noResults = page.locator('text=/no results found/i');
    await expect(noResults).toBeVisible();
  });

  test('should highlight search term in results', async ({ page }) => {
    const searchTerm = 'mathematics';
    await searchPage.goto();
    await searchPage.search(searchTerm);
    
    const highlighted = page.locator('mark, .highlight');
    const count = await highlighted.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search with keyboard shortcut', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    await page.keyboard.press('Alt+s');
    
    const searchInput = page.locator('input[aria-label*="search"]');
    await expect(searchInput).toBeFocused();
  });

  test('should show recent searches', async ({ page }) => {
    await searchPage.goto();
    
    await searchPage.search('physics');
    await page.waitForTimeout(500);
    
    await searchPage.searchInput.click();
    
    const recentSearches = page.locator('[data-testid="recent-searches"]');
    await expect(recentSearches).toBeVisible();
  });

  test('should clear search filters', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('chemistry');
    await searchPage.filterByTypeOption('assignments');
    
    const clearButton = page.locator('button', { hasText: /clear filters/i });
    await clearButton.click();
    
    const filterValue = await searchPage.filterByType.inputValue();
    expect(filterValue).toBe('');
  });

  test('should search across multiple entity types', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('john');
    
    const studentResults = page.locator('[data-type="students"]');
    const teacherResults = page.locator('[data-type="teachers"]');
    
    const totalResults = (await studentResults.count()) + (await teacherResults.count());
    expect(totalResults).toBeGreaterThan(0);
  });

  test('should export search results', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('assignments');
    
    const exportButton = page.locator('button', { hasText: /export/i });
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click(),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/search-results/i);
  });

  test('should display search suggestions', async ({ page }) => {
    await searchPage.goto();
    
    await searchPage.searchInput.fill('math');
    
    const suggestions = page.locator('[data-testid="search-suggestions"]');
    await expect(suggestions).toBeVisible({ timeout: 2000 });
  });
});
