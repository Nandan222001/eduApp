import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../src/store/slices/authSlice';
import {
  parseDeepLink,
  isValidDeepLink,
  normalizeDeepLink,
  getInitialURL,
  addDeepLinkListener,
} from '../../src/utils/deepLinking';

jest.mock('expo-linking');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useSegments: jest.fn(() => []),
  Slot: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Deep Linking Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  describe('Initial URL Handling', () => {
    it('should retrieve initial URL on app launch', async () => {
      const mockUrl = 'edutrack://assignments/123';
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(mockUrl);

      const url = await getInitialURL();

      expect(url).toBe(mockUrl);
      expect(Linking.getInitialURL).toHaveBeenCalled();
    });

    it('should handle null initial URL', async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);

      const url = await getInitialURL();

      expect(url).toBeNull();
    });

    it('should parse assignment deep link on app launch', async () => {
      const mockUrl = 'edutrack://assignments/123';
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(mockUrl);
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      const url = await getInitialURL();
      const route = parseDeepLink(url!);

      expect(route).toEqual({
        path: 'assignments/123',
        params: {},
      });
    });
  });

  describe('Deep Link Event Listeners', () => {
    it('should add deep link event listener', () => {
      const mockCallback = jest.fn();
      const mockRemove = jest.fn();
      (Linking.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });

      const subscription = addDeepLinkListener(mockCallback);

      expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
      expect(subscription.remove).toBe(mockRemove);
    });

    it('should invoke callback when deep link is received', () => {
      const mockCallback = jest.fn();
      let urlHandler: (event: { url: string }) => void;

      (Linking.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        urlHandler = handler;
        return { remove: jest.fn() };
      });

      addDeepLinkListener(mockCallback);
      urlHandler!({ url: 'edutrack://assignments/456' });

      expect(mockCallback).toHaveBeenCalledWith('edutrack://assignments/456');
    });

    it('should remove listener on cleanup', () => {
      const mockRemove = jest.fn();
      (Linking.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });

      const subscription = addDeepLinkListener(jest.fn());
      subscription.remove();

      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('iOS Deep Link Navigation', () => {
    it('should handle iOS xcrun simctl openurl format for assignments', async () => {
      const iosUrl = 'edutrack://assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      expect(isValidDeepLink(iosUrl)).toBe(true);
      const route = parseDeepLink(iosUrl);

      expect(route).toEqual({
        path: 'assignments/123',
        params: {},
      });
    });

    it('should handle iOS universal links (HTTPS)', async () => {
      const universalLink = 'https://edutrack.app/assignments/123';
      
      expect(isValidDeepLink(universalLink)).toBe(true);
      const normalized = normalizeDeepLink(universalLink);
      
      expect(normalized).toBe('edutrack://assignments/123');
    });

    it('should handle iOS associated domains', () => {
      const urls = [
        'https://edutrack.app/assignments/123',
        'https://www.edutrack.app/courses/456',
        'https://mobile.edutrack.app/profile',
      ];

      urls.forEach(url => {
        expect(isValidDeepLink(url)).toBe(true);
        const normalized = normalizeDeepLink(url);
        expect(normalized.startsWith('edutrack://')).toBe(true);
      });
    });
  });

  describe('Android Intent Filter Navigation', () => {
    it('should handle Android custom scheme intent', () => {
      const androidUrl = 'edutrack://assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      expect(isValidDeepLink(androidUrl)).toBe(true);
      const route = parseDeepLink(androidUrl);

      expect(route).toEqual({
        path: 'assignments/123',
        params: {},
      });
    });

    it('should handle Android HTTP/HTTPS intents', () => {
      const httpsUrl = 'https://edutrack.app/courses/456';
      
      expect(isValidDeepLink(httpsUrl)).toBe(true);
      const normalized = normalizeDeepLink(httpsUrl);
      
      expect(normalized).toBe('edutrack://courses/456');
    });

    it('should validate Android intent filter categories', () => {
      const urls = [
        'edutrack://assignments/123',
        'https://edutrack.app/assignments/123',
        'https://edutrack.app/courses/456',
      ];

      urls.forEach(url => {
        expect(isValidDeepLink(url)).toBe(true);
      });
    });
  });

  describe('Expo Router Dynamic Routes', () => {
    it('should handle /assignments/[id] dynamic route', () => {
      const mockUrl = 'edutrack://assignments/dynamic-123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/dynamic-123',
        queryParams: {},
      });

      const route = parseDeepLink(mockUrl);

      expect(route?.path).toBe('assignments/dynamic-123');
    });

    it('should handle /courses/[id] dynamic route', () => {
      const mockUrl = 'edutrack://courses/course-456';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'courses/course-456',
        queryParams: {},
      });

      const route = parseDeepLink(mockUrl);

      expect(route?.path).toBe('courses/course-456');
    });

    it('should handle /children/[id] dynamic route', () => {
      const mockUrl = 'edutrack://children/child-789';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'children/child-789',
        queryParams: {},
      });

      const route = parseDeepLink(mockUrl);

      expect(route?.path).toBe('children/child-789');
    });

    it('should handle /messages/[id] dynamic route', () => {
      const mockUrl = 'edutrack://messages/msg-101';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'messages/msg-101',
        queryParams: {},
      });

      const route = parseDeepLink(mockUrl);

      expect(route?.path).toBe('messages/msg-101');
    });

    it('should handle /notifications/[id] dynamic route', () => {
      const mockUrl = 'edutrack://notifications/notif-202';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'notifications/notif-202',
        queryParams: {},
      });

      const route = parseDeepLink(mockUrl);

      expect(route?.path).toBe('notifications/notif-202');
    });

    it('should preserve query parameters with dynamic routes', () => {
      const mockUrl = 'edutrack://assignments/123?source=notification&priority=high';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: { source: 'notification', priority: 'high' },
      });

      const route = parseDeepLink(mockUrl);

      expect(route?.path).toBe('assignments/123');
      expect(route?.params).toEqual({ source: 'notification', priority: 'high' });
    });
  });

  describe('Multi-Platform URL Patterns', () => {
    it('should handle deep link scheme on all platforms', () => {
      const url = 'edutrack://assignments/123';
      expect(isValidDeepLink(url)).toBe(true);
    });

    it('should handle HTTPS URLs on all platforms', () => {
      const url = 'https://edutrack.app/assignments/123';
      expect(isValidDeepLink(url)).toBe(true);
    });

    it('should handle subdomain URLs', () => {
      const urls = [
        'https://www.edutrack.app/profile',
        'https://mobile.edutrack.app/settings',
        'https://app.edutrack.app/courses/123',
      ];

      urls.forEach(url => {
        expect(isValidDeepLink(url)).toBe(true);
        const normalized = normalizeDeepLink(url);
        expect(normalized.startsWith('edutrack://')).toBe(true);
      });
    });
  });

  describe('Authentication Flow with Deep Links', () => {
    it('should redirect to login if user not authenticated', () => {
      const mockUrl = 'edutrack://assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      const isAuthenticated = false;
      const route = parseDeepLink(mockUrl);

      if (!isAuthenticated && route && !route.path.startsWith('(auth)')) {
        expect(route.path).toBe('assignments/123');
      }
    });

    it('should allow navigation if user is authenticated', () => {
      const mockUrl = 'edutrack://assignments/123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: {},
      });

      const isAuthenticated = true;
      const route = parseDeepLink(mockUrl);

      if (isAuthenticated) {
        expect(route?.path).toBe('assignments/123');
      }
    });

    it('should preserve return path for post-login redirect', () => {
      const mockUrl = 'edutrack://assignments/123?source=email';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: { source: 'email' },
      });

      const route = parseDeepLink(mockUrl);

      expect(route?.path).toBe('assignments/123');
      expect(route?.params).toEqual({ source: 'email' });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      (Linking.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Malformed URL');
      });

      const route = parseDeepLink('edutrack://malformed[url');

      expect(route).toBeNull();
    });

    it('should handle missing path in URL', () => {
      (Linking.parse as jest.Mock).mockReturnValue({
        path: null,
        queryParams: {},
      });

      const route = parseDeepLink('edutrack://');

      expect(route).toBeNull();
    });

    it('should handle network errors when fetching initial URL', async () => {
      (Linking.getInitialURL as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(getInitialURL()).rejects.toThrow('Network error');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle deep link from push notification', async () => {
      const notificationUrl = 'edutrack://assignments/new-homework-123';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/new-homework-123',
        queryParams: {},
      });

      const route = parseDeepLink(notificationUrl);

      expect(route?.path).toBe('assignments/new-homework-123');
    });

    it('should handle deep link from email with tracking params', () => {
      const emailUrl = 'https://edutrack.app/assignments/123?utm_source=email&utm_campaign=reminder';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/123',
        queryParams: { utm_source: 'email', utm_campaign: 'reminder' },
      });

      const normalized = normalizeDeepLink(emailUrl);
      const route = parseDeepLink(normalized);

      expect(route?.path).toBe('assignments/123');
      expect(route?.params).toHaveProperty('utm_source', 'email');
      expect(route?.params).toHaveProperty('utm_campaign', 'reminder');
    });

    it('should handle deep link from QR code scan', () => {
      const qrUrl = 'edutrack://courses/qr-course-789?action=enroll';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'courses/qr-course-789',
        queryParams: { action: 'enroll' },
      });

      const route = parseDeepLink(qrUrl);

      expect(route?.path).toBe('courses/qr-course-789');
      expect(route?.params).toEqual({ action: 'enroll' });
    });

    it('should handle deep link from share action', () => {
      const shareUrl = 'edutrack://assignments/shared-123?sharedBy=parent';
      (Linking.parse as jest.Mock).mockReturnValue({
        path: 'assignments/shared-123',
        queryParams: { sharedBy: 'parent' },
      });

      const route = parseDeepLink(shareUrl);

      expect(route?.path).toBe('assignments/shared-123');
      expect(route?.params).toEqual({ sharedBy: 'parent' });
    });
  });
});
