/**
 * Deep Linking Helper Functions
 * Provides utilities for creating and handling deep links throughout the app
 */

import { createDeepLink, createWebLink, deepLinkRoutes } from './deepLinking';
import { Share, Clipboard } from 'react-native';

/**
 * Share an assignment via deep link
 */
export async function shareAssignment(assignmentId: string, assignmentTitle: string): Promise<void> {
  const webLink = createWebLink(deepLinkRoutes.assignments(assignmentId));

  try {
    await Share.share({
      message: `Check out this assignment: ${assignmentTitle}\n${webLink}`,
      url: webLink,
      title: `Share Assignment: ${assignmentTitle}`,
    });
  } catch (error) {
    console.error('Error sharing assignment:', error);
    throw error;
  }
}

/**
 * Share a course via deep link
 */
export async function shareCourse(courseId: string, courseTitle: string): Promise<void> {
  const webLink = createWebLink(deepLinkRoutes.courses(courseId));

  try {
    await Share.share({
      message: `Check out this course: ${courseTitle}\n${webLink}`,
      url: webLink,
      title: `Share Course: ${courseTitle}`,
    });
  } catch (error) {
    console.error('Error sharing course:', error);
    throw error;
  }
}

/**
 * Copy assignment link to clipboard
 */
export async function copyAssignmentLink(assignmentId: string): Promise<void> {
  const webLink = createWebLink(deepLinkRoutes.assignments(assignmentId));
  Clipboard.setString(webLink);
}

/**
 * Copy course link to clipboard
 */
export async function copyCourseLink(courseId: string): Promise<void> {
  const webLink = createWebLink(deepLinkRoutes.courses(courseId));
  Clipboard.setString(webLink);
}

/**
 * Generate a notification deep link
 * Used when creating push notifications with deep link actions
 */
export function createNotificationDeepLink(
  type: 'assignment' | 'course' | 'message' | 'notification',
  id: string,
  additionalParams?: Record<string, string>
): string {
  let path: string;
  
  switch (type) {
    case 'assignment':
      path = deepLinkRoutes.assignments(id);
      break;
    case 'course':
      path = deepLinkRoutes.courses(id);
      break;
    case 'message':
      path = deepLinkRoutes.messages(id);
      break;
    case 'notification':
      path = deepLinkRoutes.notifications(id);
      break;
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }

  const params = {
    source: 'notification',
    ...additionalParams,
  };

  return createDeepLink(path, params);
}

/**
 * Generate an email deep link
 * Used when creating email links with tracking parameters
 */
export function createEmailDeepLink(
  type: 'assignment' | 'course' | 'profile' | 'settings',
  id?: string,
  campaign?: string
): string {
  let path: string;
  
  switch (type) {
    case 'assignment':
      if (!id) throw new Error('Assignment ID required');
      path = deepLinkRoutes.assignments(id);
      break;
    case 'course':
      if (!id) throw new Error('Course ID required');
      path = deepLinkRoutes.courses(id);
      break;
    case 'profile':
      path = deepLinkRoutes.profile();
      break;
    case 'settings':
      path = deepLinkRoutes.settings();
      break;
    default:
      throw new Error(`Unknown email link type: ${type}`);
  }

  const params: Record<string, string> = {
    utm_source: 'email',
    utm_medium: 'deep_link',
  };

  if (campaign) {
    params.utm_campaign = campaign;
  }

  return createWebLink(path, params);
}

/**
 * Generate a QR code deep link
 * Used when creating QR codes for quick access
 */
export function createQRCodeDeepLink(
  type: 'course' | 'assignment',
  id: string,
  action?: 'enroll' | 'view' | 'submit'
): string {
  let path: string;
  
  switch (type) {
    case 'assignment':
      path = deepLinkRoutes.assignments(id);
      break;
    case 'course':
      path = deepLinkRoutes.courses(id);
      break;
    default:
      throw new Error(`Unknown QR code type: ${type}`);
  }

  const params: Record<string, string> = {
    source: 'qr_code',
  };

  if (action) {
    params.action = action;
  }

  return createDeepLink(path, params);
}

/**
 * Create a parent invitation link
 * Used when inviting parents to view their child's profile
 */
export function createParentInvitationLink(childId: string, invitationToken: string): string {
  const path = deepLinkRoutes.children(childId);
  const params = {
    invitation_token: invitationToken,
    source: 'parent_invitation',
  };

  return createWebLink(path, params);
}

/**
 * Create a student enrollment link
 * Used when enrolling students in courses
 */
export function createEnrollmentLink(courseId: string, enrollmentCode: string): string {
  const path = deepLinkRoutes.courses(courseId);
  const params = {
    enrollment_code: enrollmentCode,
    action: 'enroll',
    source: 'enrollment_link',
  };

  return createWebLink(path, params);
}

/**
 * Create an assignment reminder link
 * Used in reminder notifications and emails
 */
export function createAssignmentReminderLink(
  assignmentId: string,
  dueDate: Date,
  priority: 'low' | 'medium' | 'high' = 'medium'
): string {
  const path = deepLinkRoutes.assignments(assignmentId);
  const params = {
    source: 'reminder',
    priority,
    due_date: dueDate.toISOString(),
  };

  return createWebLink(path, params);
}

/**
 * Create a message thread deep link
 * Used when navigating to specific message threads
 */
export function createMessageThreadLink(
  messageId: string,
  replyTo?: string
): string {
  const path = deepLinkRoutes.messages(messageId);
  const params: Record<string, string> = {
    source: 'message_thread',
  };

  if (replyTo) {
    params.reply_to = replyTo;
  }

  return createDeepLink(path, params);
}

/**
 * Extract deep link parameters from URL search params
 * Useful for tracking and analytics
 */
export function extractDeepLinkTracking(params: Record<string, any>): {
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  action?: string;
} {
  return {
    source: params.source as string | undefined,
    utm_source: params.utm_source as string | undefined,
    utm_medium: params.utm_medium as string | undefined,
    utm_campaign: params.utm_campaign as string | undefined,
    action: params.action as string | undefined,
  };
}

/**
 * Log deep link navigation for analytics
 */
export function logDeepLinkNavigation(
  path: string,
  params: Record<string, any>,
  userId?: string
): void {
  const tracking = extractDeepLinkTracking(params);
  
  console.log('[Deep Link Navigation]', {
    path,
    userId,
    ...tracking,
    timestamp: new Date().toISOString(),
  });

  // TODO: Send to analytics service
  // analytics.track('deep_link_navigation', { path, userId, ...tracking });
}

/**
 * Validate and sanitize deep link ID parameter
 * Prevents injection attacks
 */
export function sanitizeDeepLinkId(id: string | string[] | undefined): string | null {
  if (!id || Array.isArray(id)) {
    return null;
  }

  // Remove any potentially malicious characters
  const sanitized = id.replace(/[^a-zA-Z0-9-_]/g, '');
  
  if (sanitized.length === 0 || sanitized.length > 100) {
    return null;
  }

  return sanitized;
}

/**
 * Check if a deep link requires authentication
 */
export function requiresAuthentication(path: string): boolean {
  const publicPaths = [
    '/(auth)/login',
    '/(auth)/register',
    '/(auth)/forgot-password',
    '/(auth)/reset-password',
  ];

  return !publicPaths.some(publicPath => path.startsWith(publicPath));
}

/**
 * Get the appropriate home route based on user role
 */
export function getHomeRouteForRole(role: 'student' | 'parent' | 'teacher'): string {
  switch (role) {
    case 'student':
      return deepLinkRoutes.studentHome();
    case 'parent':
      return deepLinkRoutes.parentHome();
    case 'teacher':
      return deepLinkRoutes.studentHome(); // Default to student for now
    default:
      return deepLinkRoutes.studentHome();
  }
}

/**
 * Create a deferred deep link for post-authentication navigation
 */
export function createDeferredDeepLink(targetPath: string, params?: Record<string, string>): string {
  const loginPath = deepLinkRoutes.login();
  const deferredParams = {
    returnPath: targetPath,
    ...(params && { returnParams: JSON.stringify(params) }),
  };

  return createDeepLink(loginPath, deferredParams);
}

/**
 * Parse deferred deep link parameters after authentication
 */
export function parseDeferredDeepLink(params: Record<string, any>): {
  returnPath?: string;
  returnParams?: Record<string, string>;
} {
  const returnPath = params.returnPath as string | undefined;
  const returnParamsStr = params.returnParams as string | undefined;
  
  let returnParams: Record<string, string> | undefined;
  if (returnParamsStr) {
    try {
      returnParams = JSON.parse(returnParamsStr);
    } catch (error) {
      console.error('Failed to parse returnParams:', error);
    }
  }

  return { returnPath, returnParams };
}
