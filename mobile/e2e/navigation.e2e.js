describe('Navigation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
    
    // Login first
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Login')).tap();
    
    await waitFor(element(by.text('Welcome')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to assignments screen', async () => {
    await element(by.text('Assignments')).tap();
    await expect(element(by.text('My Assignments'))).toBeVisible();
  });

  it('should navigate to grades screen', async () => {
    await element(by.text('Grades')).tap();
    await expect(element(by.text('Academic Performance'))).toBeVisible();
  });

  it('should navigate to profile screen', async () => {
    await element(by.text('Profile')).tap();
    await expect(element(by.text('My Profile'))).toBeVisible();
  });

  it('should navigate to settings screen', async () => {
    await element(by.text('Settings')).tap();
    await expect(element(by.text('App Settings'))).toBeVisible();
  });

  it('should return to home screen from bottom tab', async () => {
    await element(by.text('Assignments')).tap();
    await element(by.text('Home')).tap();
    
    await expect(element(by.text('Welcome'))).toBeVisible();
  });

  it('should handle deep navigation', async () => {
    await element(by.text('Assignments')).tap();
    await element(by.id('assignment-item-0')).tap();
    
    await device.pressBack();
    await expect(element(by.text('My Assignments'))).toBeVisible();
    
    await device.pressBack();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });

  it('should open drawer navigation (if available)', async () => {
    // This would depend on your navigation structure
    await element(by.id('menu-button')).tap();
    await expect(element(by.id('drawer-content'))).toBeVisible();
  });

  it('should handle logout', async () => {
    await element(by.text('Profile')).tap();
    await element(by.text('Logout')).tap();
    
    await waitFor(element(by.text('Welcome Back')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
