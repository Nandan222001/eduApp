describe('Assignments Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    // Login before each test
    await element(by.id('email-input')).typeText('student@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  describe('Assignment List', () => {
    it('should navigate to assignments screen', async () => {
      await element(by.id('assignments-tab')).tap();

      await expect(element(by.id('assignments-screen'))).toBeVisible();
    });

    it('should display pending assignments', async () => {
      await element(by.id('assignments-tab')).tap();

      await waitFor(element(by.id('assignment-list')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('assignment-card')).atIndex(0)).toBeVisible();
    });

    it('should switch between assignment tabs', async () => {
      await element(by.id('assignments-tab')).tap();

      await element(by.text('Submitted')).tap();
      await expect(element(by.id('submitted-assignments-list'))).toBeVisible();

      await element(by.text('Graded')).tap();
      await expect(element(by.id('graded-assignments-list'))).toBeVisible();

      await element(by.text('Pending')).tap();
      await expect(element(by.id('pending-assignments-list'))).toBeVisible();
    });

    it('should search assignments', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('search-input')).typeText('Math');

      await waitFor(element(by.text('Math Homework')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should filter assignments by subject', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('filter-button')).tap();
      await element(by.text('Mathematics')).tap();

      await waitFor(element(by.id('assignment-list')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Assignment Detail', () => {
    it('should open assignment detail', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await expect(element(by.id('assignment-detail-screen'))).toBeVisible();
    });

    it('should display assignment information', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await expect(element(by.id('assignment-title'))).toBeVisible();
      await expect(element(by.id('assignment-description'))).toBeVisible();
      await expect(element(by.id('assignment-due-date'))).toBeVisible();
      await expect(element(by.id('assignment-total-marks'))).toBeVisible();
    });

    it('should download assignment attachment', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('download-attachment-button')).tap();

      await waitFor(element(by.text('Download complete')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Assignment Submission', () => {
    it('should submit assignment with file upload', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('upload-file-button')).tap();
      // File picker would open - simulated in E2E

      await element(by.id('submit-button')).tap();

      await waitFor(element(by.text('Assignment submitted successfully')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should submit assignment with text answer', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('text-answer-input')).typeText(
        'This is my answer to the assignment question.'
      );
      await element(by.id('submit-button')).tap();

      await waitFor(element(by.text('Assignment submitted successfully')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show confirmation dialog before submission', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('upload-file-button')).tap();
      await element(by.id('submit-button')).tap();

      await expect(element(by.text('Confirm Submission'))).toBeVisible();
      await element(by.text('Confirm')).tap();

      await waitFor(element(by.text('Assignment submitted successfully')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should prevent submission without required content', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('submit-button')).tap();

      await expect(element(by.text('Please upload a file or provide an answer'))).toBeVisible();
    });

    it('should save draft assignment', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('text-answer-input')).typeText('Draft answer');
      await element(by.id('save-draft-button')).tap();

      await expect(element(by.text('Draft saved'))).toBeVisible();
    });
  });

  describe('Assignment Feedback', () => {
    it('should view graded assignment feedback', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.text('Graded')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await expect(element(by.id('assignment-grade'))).toBeVisible();
      await expect(element(by.id('teacher-feedback'))).toBeVisible();
    });

    it('should view assignment score breakdown', async () => {
      await element(by.id('assignments-tab')).tap();
      await element(by.text('Graded')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('view-rubric-button')).tap();

      await expect(element(by.id('rubric-breakdown'))).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh assignment list', async () => {
      await element(by.id('assignments-tab')).tap();

      await element(by.id('assignment-list')).swipe('down', 'slow', 0.9);

      await waitFor(element(by.id('assignment-list')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Offline Mode', () => {
    it('should queue assignment submission when offline', async () => {
      // Set device to offline mode
      await device.setStatusBar({ networkConnectivity: 'airplane' });

      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();

      await element(by.id('text-answer-input')).typeText('Offline answer');
      await element(by.id('submit-button')).tap();

      await expect(element(by.text('Submission queued for sync'))).toBeVisible();

      // Restore network
      await device.setStatusBar({ networkConnectivity: 'wifi' });
    });

    it('should sync queued submissions when back online', async () => {
      // Queue a submission while offline
      await device.setStatusBar({ networkConnectivity: 'airplane' });

      await element(by.id('assignments-tab')).tap();
      await element(by.id('assignment-card')).atIndex(0).tap();
      await element(by.id('text-answer-input')).typeText('Offline answer');
      await element(by.id('submit-button')).tap();

      // Go back online
      await device.setStatusBar({ networkConnectivity: 'wifi' });

      await waitFor(element(by.text('Syncing submissions...')))
        .toBeVisible()
        .withTimeout(3000);

      await waitFor(element(by.text('All submissions synced')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});
