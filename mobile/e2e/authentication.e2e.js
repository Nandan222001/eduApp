describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      await element(by.id('email-input')).typeText('student@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show error with invalid credentials', async () => {
      await element(by.id('email-input')).typeText('wrong@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.text('Login Failed')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show validation error when fields are empty', async () => {
      await element(by.id('login-button')).tap();

      await expect(element(by.text('Please fill in all required fields'))).toBeVisible();
    });

    it('should toggle password visibility', async () => {
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('toggle-password-visibility')).tap();

      // Password should be visible
      await element(by.id('toggle-password-visibility')).tap();
      // Password should be hidden again
    });

    it('should navigate to forgot password screen', async () => {
      await element(by.text('Forgot Password?')).tap();

      await expect(element(by.id('forgot-password-screen'))).toBeVisible();
    });

    it('should navigate to registration screen', async () => {
      await element(by.text('Sign Up')).tap();

      await expect(element(by.id('register-screen'))).toBeVisible();
    });
  });

  describe('OTP Login', () => {
    it('should switch to OTP login mode', async () => {
      await element(by.text('Login with OTP')).tap();

      await expect(element(by.id('otp-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).not.toBeVisible();
    });

    it('should login with OTP', async () => {
      await element(by.text('Login with OTP')).tap();
      await element(by.id('email-input')).typeText('student@example.com');
      await element(by.id('otp-input')).typeText('123456');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('email-input')).typeText('student@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should logout successfully', async () => {
      await element(by.id('profile-menu')).tap();
      await element(by.text('Logout')).tap();

      await waitFor(element(by.text('Welcome Back')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Biometric Authentication', () => {
    it('should enable biometric login', async () => {
      await element(by.id('email-input')).typeText('student@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('enable-biometric-checkbox')).tap();
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Logout and verify biometric is available
      await element(by.id('profile-menu')).tap();
      await element(by.text('Logout')).tap();

      await waitFor(element(by.id('biometric-login-button')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });
});
