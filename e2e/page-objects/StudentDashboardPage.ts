import { Page, Locator } from '@playwright/test';

export class StudentDashboardPage {
  readonly page: Page;
  readonly assignmentsTab: Locator;
  readonly assignmentsList: Locator;
  readonly submitAssignmentButton: Locator;
  readonly fileUpload: Locator;
  readonly aiPredictionLink: Locator;
  readonly pomodoroTimerLink: Locator;
  readonly notificationBell: Locator;
  readonly chatButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.assignmentsTab = page.locator('[role="tab"]', { hasText: /assignments/i });
    this.assignmentsList = page.locator('[data-testid="assignments-list"]');
    this.submitAssignmentButton = page.locator('button', { hasText: /submit/i });
    this.fileUpload = page.locator('input[type="file"]');
    this.aiPredictionLink = page.locator('a[href*="ai-prediction"]');
    this.pomodoroTimerLink = page.locator('a[href*="pomodoro"]');
    this.notificationBell = page.locator('[aria-label*="notification"]');
    this.chatButton = page.locator('[aria-label*="chat"]');
    this.searchInput = page.locator('input[aria-label*="search"]');
  }

  async goto() {
    await this.page.goto('/student/dashboard');
  }

  async viewAssignments() {
    await this.assignmentsTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async submitAssignment(assignmentIndex: number, filePath: string) {
    const assignment = this.assignmentsList.locator('.assignment-item').nth(assignmentIndex);
    await assignment.locator('button', { hasText: /submit/i }).click();
    
    await this.fileUpload.setInputFiles(filePath);
    await this.submitAssignmentButton.click();
  }

  async openAIPrediction() {
    await this.aiPredictionLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async openChat() {
    await this.chatButton.click();
  }

  async searchContent(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }
}
