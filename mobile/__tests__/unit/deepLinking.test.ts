import * as Linking from 'expo-linking';
import {
  parseDeepLink,
  createDeepLink,
  createWebLink,
  isValidDeepLink,
  normalizeDeepLink,
  deepLinkRoutes,
  DEEP_LINK_SCHEME,
  DEEP_LINK_PREFIX,
  WEB_LINK_PREFIX,
} from '../../src/utils/deepLinking';

jest.mock('expo-linking', () => ({
  parse: jest.fn(),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
}));

describe('Deep Linking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct scheme set to "edutrack"', () => {
      expect(DEEP_LINK_SCHEME).toBe('edutrack');
      expect(DEEP_LINK_PREFIX).toBe('edutrack://');
    });

    it('should have correct web link prefix', () => {
      expect(WEB_LINK_PREFIX).toBe('https://edutrack.app');
    });
  });

  describe('parseDeepLink', () => {
    it('should parse assignment deep link with ID', () => {
      const mockUrl = 'edutrack://assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toEqual({
        path: 'assignments/123',
        params: {},
      });
      expect(Linking.parse).toHaveBeenCalledWith(mockUrl);
    });

    it('should parse deep link with query parameters', () => {
      const mockUrl = 'edutrack://assignments/123?source=notification&type=homework';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: { source: 'notification', type: 'homework' },
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toEqual({
        path: 'assignments/123',
        params: { source: 'notification', type: 'homework' },
      });
    });

    it('should return null for invalid deep link', () => {
      (Linking.parse as jest.Mock).mockReturnValue({
        path: null,
      });

      const result = parseDeepLink('invalid://url');

      expect(result).toBeNull();
    });

    it('should handle parsing errors gracefully', () => {
      (Linking.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const result = parseDeepLink('edutrack://malformed');

      expect(result).toBeNull();
    });
  });

  describe('createDeepLink', () => {
    it('should create deep link without parameters', () => {
      const link = createDeepLink('assignments/123');

      expect(link).toBe('edutrack://assignments/123');
    });

    it('should create deep link with query parameters', () => {
      const link = createDeepLink('assignments/123', {
        source: 'notification',
        type: 'homework',
      });

      expect(link).toBe('edutrack://assignments/123?source=notification&type=homework');
    });

    it('should URL encode parameter values', () => {
      const link = createDeepLink('messages/456', {
        message: 'Hello World!',
        sender: 'john@example.com',
      });

      expect(link).toContain('message=Hello%20World!');
      expect(link).toContain('sender=john%40example.com');
    });
  });

  describe('createWebLink', () => {
    it('should create web link without parameters', () => {
      const link = createWebLink('assignments/123');

      expect(link).toBe('https://edutrack.app/assignments/123');
    });

    it('should create web link with query parameters', () => {
      const link = createWebLink('assignments/123', {
        source: 'email',
      });

      expect(link).toBe('https://edutrack.app/assignments/123?source=email');
    });
  });

  describe('isValidDeepLink', () => {
    it('should validate edutrack:// scheme URLs', () => {
      expect(isValidDeepLink('edutrack://assignments/123')).toBe(true);
      expect(isValidDeepLink('edutrack://courses/456')).toBe(true);
      expect(isValidDeepLink('edutrack://profile')).toBe(true);
    });

    it('should validate HTTPS edutrack.app URLs', () => {
      expect(isValidDeepLink('https://edutrack.app/assignments/123')).toBe(true);
      expect(isValidDeepLink('https://www.edutrack.app/courses/456')).toBe(true);
      expect(isValidDeepLink('https://mobile.edutrack.app/profile')).toBe(true);
    });

    it('should invalidate non-edutrack URLs', () => {
      expect(isValidDeepLink('http://example.com')).toBe(false);
      expect(isValidDeepLink('myapp://test')).toBe(false);
      expect(isValidDeepLink('')).toBe(false);
      expect(isValidDeepLink('not-a-url')).toBe(false);
    });

    it('should handle null/undefined URLs', () => {
      expect(isValidDeepLink(null as any)).toBe(false);
      expect(isValidDeepLink(undefined as any)).toBe(false);
    });
  });

  describe('normalizeDeepLink', () => {
    it('should normalize HTTPS URLs to deep link scheme', () => {
      const normalized = normalizeDeepLink('https://edutrack.app/assignments/123');

      expect(normalized).toBe('edutrack://assignments/123');
    });

    it('should normalize subdomain URLs to deep link scheme', () => {
      const normalized = normalizeDeepLink('https://www.edutrack.app/courses/456');

      expect(normalized).toBe('edutrack://courses/456');
    });

    it('should handle URLs with trailing slashes', () => {
      const normalized = normalizeDeepLink('https://edutrack.app/profile/');

      expect(normalized).toBe('edutrack://profile/');
    });

    it('should preserve query parameters during normalization', () => {
      const normalized = normalizeDeepLink('https://edutrack.app/assignments/123?source=email');

      expect(normalized).toBe('edutrack://assignments/123?source=email');
    });

    it('should not modify already normalized deep links', () => {
      const url = 'edutrack://assignments/123';
      const normalized = normalizeDeepLink(url);

      expect(normalized).toBe(url);
    });
  });

  describe('deepLinkRoutes', () => {
    it('should generate assignment route with ID', () => {
      expect(deepLinkRoutes.assignments('123')).toBe('/assignments/123');
    });

    it('should generate course route with ID', () => {
      expect(deepLinkRoutes.courses('456')).toBe('/courses/456');
    });

    it('should generate children route with ID', () => {
      expect(deepLinkRoutes.children('789')).toBe('/children/789');
    });

    it('should generate message route with ID', () => {
      expect(deepLinkRoutes.messages('101')).toBe('/messages/101');
    });

    it('should generate notification route with ID', () => {
      expect(deepLinkRoutes.notifications('202')).toBe('/notifications/202');
    });

    it('should generate static routes', () => {
      expect(deepLinkRoutes.profile()).toBe('/profile');
      expect(deepLinkRoutes.settings()).toBe('/settings');
      expect(deepLinkRoutes.studentHome()).toBe('/(tabs)/student');
      expect(deepLinkRoutes.parentHome()).toBe('/(tabs)/parent');
      expect(deepLinkRoutes.login()).toBe('/(auth)/login');
      expect(deepLinkRoutes.register()).toBe('/(auth)/register');
    });
  });

  describe('Dynamic Routes', () => {
    it('should support assignments/[id] pattern', () => {
      const mockUrl = 'edutrack://assignments/999';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/999',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toEqual({
        path: 'assignments/999',
        params: {},
      });
    });

    it('should support courses/[id] pattern', () => {
      const mockUrl = 'edutrack://courses/888';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'courses/888',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toEqual({
        path: 'courses/888',
        params: {},
      });
    });

    it('should support children/[id] pattern', () => {
      const mockUrl = 'edutrack://children/777';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'children/777',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toEqual({
        path: 'children/777',
        params: {},
      });
    });

    it('should support messages/[id] pattern', () => {
      const mockUrl = 'edutrack://messages/666';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'messages/666',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toEqual({
        path: 'messages/666',
        params: {},
      });
    });

    it('should support notifications/[id] pattern', () => {
      const mockUrl = 'edutrack://notifications/555';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'notifications/555',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toEqual({
        path: 'notifications/555',
        params: {},
      });
    });
  });

  describe('iOS Deep Link Compatibility', () => {
    it('should handle iOS universal link format', () => {
      const mockUrl = 'https://edutrack.app/assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      const normalized = normalizeDeepLink(mockUrl);
      const result = parseDeepLink(normalized);

      expect(result?.path).toBe('assignments/123');
    });

    it('should validate iOS URL scheme format', () => {
      expect(isValidDeepLink('edutrack://assignments/123')).toBe(true);
    });
  });

  describe('Android Deep Link Compatibility', () => {
    it('should handle Android intent filter URLs', () => {
      const mockUrl = 'edutrack://assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result?.path).toBe('assignments/123');
    });

    it('should handle Android HTTP/HTTPS URLs', () => {
      const mockUrl = 'https://edutrack.app/courses/456';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'courses/456',
        queryParams: {},
      });

      const normalized = normalizeDeepLink(mockUrl);
      const result = parseDeepLink(normalized);

      expect(result?.path).toBe('courses/456');
    });
  });

  describe('Web Deep Link Compatibility', () => {
    it('should handle web URLs with proper patterns', () => {
      const webUrls = [
        'https://edutrack.app/assignments/123',
        'https://edutrack.app/courses/456',
        'https://edutrack.app/profile',
        'https://edutrack.app/settings',
      ];

      webUrls.forEach(url => {
        expect(isValidDeepLink(url)).toBe(true);
      });
    });

    it('should normalize web URLs to deep link scheme', () => {
      const webUrl = 'https://edutrack.app/assignments/123';
      const normalized = normalizeDeepLink(webUrl);

      expect(normalized).toBe('edutrack://assignments/123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deep links with special characters in IDs', () => {
      const mockUrl = 'edutrack://assignments/abc-123-def';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/abc-123-def',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result?.path).toBe('assignments/abc-123-def');
    });

    it('should handle deep links with multiple path segments', () => {
      const mockUrl = 'edutrack://student/assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'student/assignments/123',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result?.path).toBe('student/assignments/123');
    });

    it('should handle deep links without path', () => {
      const mockUrl = 'edutrack://';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: '',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result).toBeNull();
    });

    it('should handle URLs with fragment identifiers', () => {
      const mockUrl = 'edutrack://assignments/123#section1';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      const result = parseDeepLink(mockUrl);

      expect(result?.path).toBe('assignments/123');
    });

    it('should handle URLs with both query params and fragments', () => {
      const mockUrl = 'edutrack://assignments/123?source=email#details';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: { source: 'email' },
      });

      const result = parseDeepLink(mockUrl);

      expect(result?.path).toBe('assignments/123');
      expect(result?.params).toEqual({ source: 'email' });
    });
  });

  describe('Security', () => {
    it('should not execute JavaScript in deep link paths', () => {
      const maliciousUrl = 'edutrack://javascript:alert(1)';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'javascript:alert(1)',
        queryParams: {},
      });

      const result = parseDeepLink(maliciousUrl);

      expect(result?.path).toBe('javascript:alert(1)');
    });

    it('should handle XSS attempts in query parameters', () => {
      const xssUrl = 'edutrack://assignments/123?xss=<script>alert(1)</script>';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: { xss: '<script>alert(1)</script>' },
      });

      const result = parseDeepLink(xssUrl);

      expect(result?.params?.xss).toBe('<script>alert(1)</script>');
    });
  });
});
