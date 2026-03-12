import { Page, Locator } from '@playwright/test';

export class TeacherDashboardPage {
  readonly page: Page;
  readonly attendanceLink: Locator;
  readonly markAttendanceButton: Locator;
  readonly gradingLink: Locator;
  readonly classSelect: Locator;
  readonly studentCheckboxes: Locator;
  readonly saveAttendanceButton: Locator;
  readonly assignmentsList: Locator;
  readonly gradeInput: Locator;
  readonly submitGradeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.attendanceLink = page.locator('a[href*="attendance"]');
    this.markAttendanceButton = page.locator('button', { hasText: /mark attendance/i });
    this.gradingLink = page.locator('a[href*="grading"]');
    this.classSelect = page.locator('select[name="class"]');
    this.studentCheckboxes = page.locator('input[type="checkbox"][name*="student"]');
    this.saveAttendanceButton = page.locator('button[type="submit"]', { hasText: /save|submit/i });
    this.assignmentsList = page.locator('[data-testid="assignments-list"]');
    this.gradeInput = page.locator('input[name*="grade"]');
    this.submitGradeButton = page.locator('button', { hasText: /submit grade/i });
  }

  async goto() {
    await this.page.goto('/teacher/dashboard');
  }

  async navigateToAttendance() {
    await this.attendanceLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async markAttendance(classId: string, presentStudentIds: string[]) {
    await this.navigateToAttendance();
    await this.markAttendanceButton.click();
    
    if (classId) {
      await this.classSelect.selectOption(classId);
      await this.page.waitForTimeout(500);
    }

    const checkboxes = await this.studentCheckboxes.all();
    for (const checkbox of checkboxes) {
      const studentId = await checkbox.getAttribute('data-student-id');
      const shouldCheck = presentStudentIds.includes(studentId || '');
      
      if (shouldCheck) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }

    await this.saveAttendanceButton.click();
  }

  async gradeAssignment(assignmentIndex: number, grade: number, feedback?: string) {
    const assignment = this.assignmentsList.locator('.assignment-item').nth(assignmentIndex);
    await assignment.locator('button', { hasText: /grade/i }).click();
    
    await this.gradeInput.fill(grade.toString());
    
    if (feedback) {
      const feedbackInput = this.page.locator('textarea[name="feedback"]');
      await feedbackInput.fill(feedback);
    }
    
    await this.submitGradeButton.click();
  }
}
