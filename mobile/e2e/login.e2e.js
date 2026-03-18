describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen', async () => {
    await expect(element(by.text('Welcome Back'))).toBeVisible();
    await expect(element(by.text('Sign in to continue'))).toBeVisible();
  });

  it('should allow user to type email and password', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    
    await expect(element(by.id('email-input'))).toHaveText('test@example.com');
  });

  it('should show error for empty fields', async () => {
    await element(by.text('Login')).tap();
    
    await expect(element(by.text(/fill in all required fields/i))).toBeVisible();
  });

  it('should navigate to forgot password screen', async () => {
    await element(by.text('Forgot Password?')).tap();
    
    await expect(element(by.text('Forgot Password'))).toBeVisible();
    await device.pressBack();
  });

  it('should navigate to register screen', async () => {
    await element(by.text('Sign Up')).tap();
    
    await expect(element(by.text('Create Account'))).toBeVisible();
    await device.pressBack();
  });

  it('should toggle password visibility', async () => {
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('toggle-password-visibility')).tap();
    
    // Password should be visible
    await element(by.id('toggle-password-visibility')).tap();
    // Password should be hidden again
  });

  it('should switch to OTP login', async () => {
    await element(by.text('Login with OTP')).tap();
    
    await expect(element(by.id('otp-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).not.toBeVisible();
  });

  it('should complete successful login', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Login')).tap();
    
    // Wait for navigation to home screen
    await waitFor(element(by.text('Welcome')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
