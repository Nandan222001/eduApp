import type { AuthTokens } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const TOKEN_TYPE_KEY = 'token_type';

class TokenManager {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading access token from localStorage:', error);
      return null;
    }
  }

  setAccessToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving access token to localStorage:', error);
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading refresh token from localStorage:', error);
      return null;
    }
  }

  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving refresh token to localStorage:', error);
    }
  }

  getTokenType(): string {
    try {
      return localStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';
    } catch (error) {
      console.error('Error reading token type from localStorage:', error);
      return 'Bearer';
    }
  }

  setTokenType(type: string): void {
    try {
      localStorage.setItem(TOKEN_TYPE_KEY, type);
    } catch (error) {
      console.error('Error saving token type to localStorage:', error);
    }
  }

  getTokenExpiry(): number | null {
    try {
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      return expiry ? parseInt(expiry, 10) : null;
    } catch (error) {
      console.error('Error reading token expiry from localStorage:', error);
      return null;
    }
  }

  setTokenExpiry(expiresIn: number): void {
    try {
      const expiryTimestamp = Date.now() + expiresIn * 1000;
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
    } catch (error) {
      console.error('Error saving token expiry to localStorage:', error);
    }
  }

  setTokens(tokens: AuthTokens): void {
    this.setAccessToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
    this.setTokenType(tokens.tokenType);
    this.setTokenExpiry(tokens.expiresIn);
  }

  getTokens(): AuthTokens | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiry() || 0,
      tokenType: this.getTokenType(),
    };
  }

  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem(TOKEN_TYPE_KEY);
    } catch (error) {
      console.error('Error clearing tokens from localStorage:', error);
    }
  }

  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();

    if (!expiry) {
      return true;
    }

    const bufferTime = 60 * 1000;
    return Date.now() >= expiry - bufferTime;
  }

  hasValidToken(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken && !this.isTokenExpired();
  }

  getAuthHeader(): string | null {
    const token = this.getAccessToken();
    const tokenType = this.getTokenType();

    if (!token) {
      return null;
    }

    return `${tokenType} ${token}`;
  }
}

export const tokenManager = new TokenManager();
