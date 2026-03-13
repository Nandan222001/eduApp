import { Page, Locator } from '@playwright/test';

export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resultsContainer: Locator;
  readonly filterByType: Locator;
  readonly filterByDate: Locator;
  readonly sortSelect: Locator;
  readonly resultItems: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[aria-label*="search"]');
    this.searchButton = page.locator('button[aria-label*="search"]');
    this.resultsContainer = page.locator('[data-testid="search-results"]');
    this.filterByType = page.locator('select[name="type"]');
    this.filterByDate = page.locator('input[name="date"]');
    this.sortSelect = page.locator('select[name="sort"]');
    this.resultItems = page.locator('[data-testid="result-item"]');
    this.paginationNext = page.locator('button[aria-label*="next"]');
    this.paginationPrev = page.locator('button[aria-label*="previous"]');
  }

  async goto() {
    await this.page.goto('/admin/search');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByTypeOption(type: string) {
    await this.filterByType.selectOption(type);
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(sortOption: string) {
    await this.sortSelect.selectOption(sortOption);
    await this.page.waitForLoadState('networkidle');
  }

  async getResultsCount(): Promise<number> {
    return await this.resultItems.count();
  }

  async goToNextPage() {
    await this.paginationNext.click();
    await this.page.waitForLoadState('networkidle');
  }
}
