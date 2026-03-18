describe('Assignment Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES', photos: 'YES' },
    });
    
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Login')).tap();
    
    await waitFor(element(by.text('Welcome')))
      .toBeVisible()
      .withTimeout(5000);
  });

  beforeEach(async () => {
    // Navigate to assignments screen
    await element(by.text('Assignments')).tap();
    await waitFor(element(by.text('My Assignments')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should display list of assignments', async () => {
    await expect(element(by.id('assignments-list'))).toBeVisible();
  });

  it('should filter assignments by status', async () => {
    await element(by.text('Pending')).tap();
    await expect(element(by.id('assignments-list'))).toBeVisible();
    
    await element(by.text('Submitted')).tap();
    await expect(element(by.id('assignments-list'))).toBeVisible();
  });

  it('should open assignment detail', async () => {
    await element(by.id('assignment-item-0')).tap();
    
    await expect(element(by.id('assignment-detail'))).toBeVisible();
    await expect(element(by.text('Description'))).toBeVisible();
  });

  it('should submit assignment with comments', async () => {
    await element(by.id('assignment-item-0')).tap();
    
    await element(by.id('comments-input')).typeText('This is my submission');
    await element(by.id('document-picker-button')).tap();
    
    // Simulate file selection (this would need to be mocked)
    await element(by.text('Submit Assignment')).tap();
    
    await waitFor(element(by.text('Assignment Submitted!')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should view submitted assignment', async () => {
    await element(by.text('Submitted')).tap();
    await element(by.id('assignment-item-0')).tap();
    
    await expect(element(by.text('Your Submission'))).toBeVisible();
    await expect(element(by.text('Submitted on'))).toBeVisible();
  });

  it('should handle camera capture', async () => {
    await element(by.id('assignment-item-0')).tap();
    
    await element(by.id('camera-button')).tap();
    await expect(element(by.id('camera-view'))).toBeVisible();
    
    await element(by.id('capture-button')).tap();
    await element(by.id('close-camera')).tap();
  });

  it('should handle document scanning', async () => {
    await element(by.id('assignment-item-0')).tap();
    
    await element(by.id('scan-button')).tap();
    await expect(element(by.text('Scan Homework'))).toBeVisible();
  });

  it('should display overdue assignments', async () => {
    await element(by.text('Overdue')).tap();
    await expect(element(by.id('assignments-list'))).toBeVisible();
  });

  it('should navigate back from assignment detail', async () => {
    await element(by.id('assignment-item-0')).tap();
    await device.pressBack();
    
    await expect(element(by.text('My Assignments'))).toBeVisible();
  });
});
