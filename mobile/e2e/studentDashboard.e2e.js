describe('Student Dashboard Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    // Login
    await element(by.id('email-input')).typeText('student@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  describe('Dashboard Overview', () => {
    it('should display dashboard widgets', async () => {
      await expect(element(by.id('welcome-card'))).toBeVisible();
      await expect(element(by.id('attendance-card'))).toBeVisible();
      await expect(element(by.id('upcoming-assignments-card'))).toBeVisible();
      await expect(element(by.id('gamification-widget'))).toBeVisible();
    });

    it('should display student name in welcome card', async () => {
      await expect(element(by.id('welcome-card'))).toBeVisible();
      await expect(element(by.text(/Welcome back,/))).toBeVisible();
    });

    it('should show attendance percentage', async () => {
      await expect(element(by.id('attendance-percentage'))).toBeVisible();
    });

    it('should display gamification points', async () => {
      await expect(element(by.id('points-display'))).toBeVisible();
      await expect(element(by.id('rank-display'))).toBeVisible();
    });
  });

  describe('Navigation', () => {
    it('should navigate to assignments from dashboard', async () => {
      await element(by.id('upcoming-assignments-card')).tap();

      await expect(element(by.id('assignments-screen'))).toBeVisible();
    });

    it('should navigate to grades from dashboard', async () => {
      await element(by.id('recent-grades-card')).tap();

      await expect(element(by.id('grades-screen'))).toBeVisible();
    });

    it('should navigate to gamification from widget', async () => {
      await element(by.id('gamification-widget')).tap();

      await expect(element(by.id('gamification-screen'))).toBeVisible();
    });

    it('should navigate to AI features', async () => {
      await element(by.id('ai-features-quick-access')).tap();

      await expect(element(by.id('ai-features-menu'))).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh dashboard data', async () => {
      await element(by.id('dashboard-scroll-view')).swipe('down', 'slow', 0.9);

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Quick Actions', () => {
    it('should access schedule from dashboard', async () => {
      await element(by.id('schedule-quick-action')).tap();

      await expect(element(by.id('schedule-screen'))).toBeVisible();
    });

    it('should access courses from dashboard', async () => {
      await element(by.id('courses-quick-action')).tap();

      await expect(element(by.id('courses-screen'))).toBeVisible();
    });

    it('should access notifications', async () => {
      await element(by.id('notifications-bell')).tap();

      await expect(element(by.id('notifications-screen'))).toBeVisible();
    });
  });

  describe('AI Predictions Widget', () => {
    it('should display AI prediction', async () => {
      await expect(element(by.id('ai-prediction-widget'))).toBeVisible();
    });

    it('should show predicted grade', async () => {
      await expect(element(by.id('predicted-grade'))).toBeVisible();
    });

    it('should navigate to detailed AI predictions', async () => {
      await element(by.id('ai-prediction-widget')).tap();

      await expect(element(by.id('ai-predictions-detail-screen'))).toBeVisible();
    });
  });

  describe('Weak Areas Panel', () => {
    it('should display weak areas', async () => {
      await element(by.id('dashboard-scroll-view')).scrollTo('bottom');

      await expect(element(by.id('weak-areas-panel'))).toBeVisible();
    });

    it('should show improvement suggestions', async () => {
      await element(by.id('dashboard-scroll-view')).scrollTo('bottom');
      await element(by.id('weak-areas-panel')).tap();

      await expect(element(by.id('improvement-suggestions'))).toBeVisible();
    });
  });

  describe('Streak Tracker', () => {
    it('should display current streak', async () => {
      await expect(element(by.id('streak-tracker'))).toBeVisible();
      await expect(element(by.id('current-streak'))).toBeVisible();
    });

    it('should show streak details', async () => {
      await element(by.id('streak-tracker')).tap();

      await expect(element(by.id('streak-detail-modal'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should show retry button on error', async () => {
      // Simulate network error by going offline
      await device.setStatusBar({ networkConnectivity: 'airplane' });
      await device.reloadReactNative();

      await waitFor(element(by.text('Retry')))
        .toBeVisible()
        .withTimeout(5000);

      // Restore network
      await device.setStatusBar({ networkConnectivity: 'wifi' });
    });

    it('should reload data after retry', async () => {
      await device.setStatusBar({ networkConnectivity: 'airplane' });
      await device.reloadReactNative();

      await waitFor(element(by.text('Retry')))
        .toBeVisible()
        .withTimeout(5000);

      await device.setStatusBar({ networkConnectivity: 'wifi' });
      await element(by.text('Retry')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator on initial load', async () => {
      await device.reloadReactNative();

      await expect(element(by.id('loading-indicator'))).toBeVisible();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Active Goals Widget', () => {
    it('should display active goals', async () => {
      await element(by.id('dashboard-scroll-view')).scrollTo('bottom');

      await expect(element(by.id('active-goals-widget'))).toBeVisible();
    });

    it('should navigate to goals screen', async () => {
      await element(by.id('dashboard-scroll-view')).scrollTo('bottom');
      await element(by.id('active-goals-widget')).tap();

      await expect(element(by.id('goals-screen'))).toBeVisible();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      await element(by.id('courses-tab')).tap();
      await expect(element(by.id('courses-screen'))).toBeVisible();

      await element(by.id('schedule-tab')).tap();
      await expect(element(by.id('schedule-screen'))).toBeVisible();

      await element(by.id('profile-tab')).tap();
      await expect(element(by.id('profile-screen'))).toBeVisible();

      await element(by.id('home-tab')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible();
    });
  });
});
