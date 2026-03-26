// Web stub implementation for biometric authentication
export const biometricsService = {
  async isAvailable(): Promise<boolean> {
    // Check for Web Authentication API
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  },

  async authenticate(_reason?: string): Promise<boolean> {
    console.warn('Biometric authentication not fully supported on web');
    return false;
  },

  async getSupportedTypes(): Promise<string[]> {
    return [];
  },
};

export default biometricsService;
