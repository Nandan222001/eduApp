export { offlineQueueManager } from './offlineQueue';
export type { QueuedRequest } from './offlineQueue';

// Platform-specific exports will resolve to .native or .web automatically
export { backgroundSyncService } from './backgroundSync';
export { cameraUtils } from './camera';
export { biometricsService } from './biometrics';
export { notificationsService } from './notifications';
export { documentScannerService } from './documentScanner';

export { networkStatusManager } from './networkStatus';

export { cacheManager } from './cacheManager';

export { biometricUtils } from './biometric';

export { secureStorage } from './secureStorage';

export { fileManager } from './fileManager';

export { authService } from './authService';

export {
  parseDeepLink,
  createDeepLink,
  createWebLink,
  getInitialURL,
  addDeepLinkListener,
  isValidDeepLink,
  normalizeDeepLink,
  deepLinkRoutes,
  linkingConfig,
  DEEP_LINK_SCHEME,
  DEEP_LINK_PREFIX,
  WEB_LINK_PREFIX,
} from './deepLinking';
export type { DeepLinkRoute } from './deepLinking';

export {
  shareAssignment,
  shareCourse,
  copyAssignmentLink,
  copyCourseLink,
  createNotificationDeepLink,
  createEmailDeepLink,
  createQRCodeDeepLink,
  createParentInvitationLink,
  createEnrollmentLink,
  createAssignmentReminderLink,
  createMessageThreadLink,
  extractDeepLinkTracking,
  logDeepLinkNavigation,
  sanitizeDeepLinkId,
  requiresAuthentication,
  getHomeRouteForRole,
  createDeferredDeepLink,
  parseDeferredDeepLink,
} from './deepLinkingHelpers';
