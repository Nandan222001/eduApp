import { Page, Locator } from '@playwright/test';

export class ParentDashboardPage {
  readonly page: Page;
  readonly childSelector: Locator;
  readonly progressTab: Locator;
  readonly attendanceTab: Locator;
  readonly gradesTab: Locator;
  readonly progressChart: Locator;
  readonly attendanceSummary: Locator;
  readonly gradesList: Locator;
  readonly notificationsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.childSelector = page.locator('select[name="child"]');
    this.progressTab = page.locator('[role="tab"]', { hasText: /progress/i });
    this.attendanceTab = page.locator('[role="tab"]', { hasText: /attendance/i });
    this.gradesTab = page.locator('[role="tab"]', { hasText: /grades/i });
    this.progressChart = page.locator('[data-testid="progress-chart"]');
    this.attendanceSummary = page.locator('[data-testid="attendance-summary"]');
    this.gradesList = page.locator('[data-testid="grades-list"]');
    this.notificationsList = page.locator('[data-testid="notifications-list"]');
  }

  async goto() {
    await this.page.goto('/parent/dashboard');
  }

  async selectChild(childName: string) {
    await this.childSelector.selectOption({ label: childName });
    await this.page.waitForLoadState('networkidle');
  }

  async viewProgress() {
    await this.progressTab.click();
    await this.page.waitForSelector('[data-testid="progress-chart"]');
  }

  async viewAttendance() {
    await this.attendanceTab.click();
    await this.page.waitForSelector('[data-testid="attendance-summary"]');
  }

  async viewGrades() {
    await this.gradesTab.click();
    await this.page.waitForSelector('[data-testid="grades-list"]');
  }

  async getAttendancePercentage(): Promise<string> {
    const percentageElement = this.attendanceSummary.locator('[data-testid="attendance-percentage"]');
    return (await percentageElement.textContent()) || '';
  }
}
