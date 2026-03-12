import { trackEvent, trackFeatureUsage, trackConversion, trackClick } from '@/lib/analytics';

export const AnalyticsEvents = {
  AUTH: {
    LOGIN: 'auth_login',
    LOGOUT: 'auth_logout',
    SIGNUP: 'auth_signup',
    PASSWORD_RESET: 'auth_password_reset',
  },
  ASSIGNMENT: {
    CREATE: 'assignment_create',
    SUBMIT: 'assignment_submit',
    VIEW: 'assignment_view',
    GRADE: 'assignment_grade',
  },
  ATTENDANCE: {
    MARK: 'attendance_mark',
    VIEW: 'attendance_view',
    EXPORT: 'attendance_export',
  },
  EXAM: {
    CREATE: 'exam_create',
    TAKE: 'exam_take',
    SUBMIT: 'exam_submit',
    VIEW_RESULTS: 'exam_view_results',
  },
  SUBSCRIPTION: {
    VIEW_PLANS: 'subscription_view_plans',
    UPGRADE: 'subscription_upgrade',
    CANCEL: 'subscription_cancel',
  },
  COMMUNICATION: {
    SEND_MESSAGE: 'communication_send_message',
    CREATE_ANNOUNCEMENT: 'communication_create_announcement',
  },
  ANALYTICS: {
    VIEW_DASHBOARD: 'analytics_view_dashboard',
    EXPORT_REPORT: 'analytics_export_report',
  },
} as const;

export const AnalyticsFeatures = {
  POMODORO_TIMER: 'pomodoro_timer',
  STUDY_PLANNER: 'study_planner',
  FLASHCARDS: 'flashcards',
  QUIZ: 'quiz',
  CHATBOT: 'ai_chatbot',
  GAMIFICATION: 'gamification',
  GOAL_TRACKING: 'goal_tracking',
  PREDICTIONS: 'ml_predictions',
  DOUBT_FORUM: 'doubt_forum',
  STUDY_GROUPS: 'study_groups',
  VIDEO_LIBRARY: 'video_library',
  NOTES: 'notes',
} as const;

export const ConversionTypes = {
  SUBSCRIPTION_PURCHASE: 'subscription_purchase',
  TRIAL_START: 'trial_start',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  FEATURE_ACTIVATION: 'feature_activation',
} as const;

export class AnalyticsHelper {
  static trackAuth(
    action: keyof typeof AnalyticsEvents.AUTH,
    properties?: Record<string, unknown>
  ) {
    trackEvent({
      event_name: AnalyticsEvents.AUTH[action],
      event_type: 'authentication',
      properties,
    });
  }

  static trackAssignment(
    action: keyof typeof AnalyticsEvents.ASSIGNMENT,
    properties?: Record<string, unknown>
  ) {
    trackEvent({
      event_name: AnalyticsEvents.ASSIGNMENT[action],
      event_type: 'assignment',
      properties,
    });
  }

  static trackAttendance(
    action: keyof typeof AnalyticsEvents.ATTENDANCE,
    properties?: Record<string, unknown>
  ) {
    trackEvent({
      event_name: AnalyticsEvents.ATTENDANCE[action],
      event_type: 'attendance',
      properties,
    });
  }

  static trackExam(
    action: keyof typeof AnalyticsEvents.EXAM,
    properties?: Record<string, unknown>
  ) {
    trackEvent({
      event_name: AnalyticsEvents.EXAM[action],
      event_type: 'exam',
      properties,
    });
  }

  static trackSubscription(
    action: keyof typeof AnalyticsEvents.SUBSCRIPTION,
    properties?: Record<string, unknown>
  ) {
    trackEvent({
      event_name: AnalyticsEvents.SUBSCRIPTION[action],
      event_type: 'subscription',
      properties,
    });
  }

  static trackFeature(
    feature: keyof typeof AnalyticsFeatures,
    properties?: Record<string, unknown>
  ) {
    trackFeatureUsage(AnalyticsFeatures[feature], properties);
  }

  static trackConversionEvent(
    type: keyof typeof ConversionTypes,
    value?: number,
    properties?: Record<string, unknown>
  ) {
    trackConversion(ConversionTypes[type], value, properties);
  }

  static trackButtonClick(buttonId: string, properties?: Record<string, unknown>) {
    trackClick(`button_${buttonId}`, properties);
  }

  static trackLinkClick(linkId: string, url?: string, properties?: Record<string, unknown>) {
    trackClick(`link_${linkId}`, { ...properties, url });
  }

  static trackFormSubmission(formName: string, properties?: Record<string, unknown>) {
    trackEvent({
      event_name: `form_submit_${formName}`,
      event_type: 'form_submission',
      properties,
    });
  }

  static trackError(errorType: string, errorMessage: string, properties?: Record<string, unknown>) {
    trackEvent({
      event_name: `error_${errorType}`,
      event_type: 'error',
      properties: {
        ...properties,
        error_message: errorMessage,
      },
    });
  }

  static trackSearch(query: string, resultsCount: number, properties?: Record<string, unknown>) {
    trackEvent({
      event_name: 'search',
      event_type: 'search',
      properties: {
        ...properties,
        query,
        results_count: resultsCount,
      },
    });
  }

  static trackDownload(fileName: string, fileType: string, properties?: Record<string, unknown>) {
    trackEvent({
      event_name: 'file_download',
      event_type: 'download',
      properties: {
        ...properties,
        file_name: fileName,
        file_type: fileType,
      },
    });
  }

  static trackShare(platform: string, contentType: string, properties?: Record<string, unknown>) {
    trackEvent({
      event_name: 'content_share',
      event_type: 'share',
      properties: {
        ...properties,
        platform,
        content_type: contentType,
      },
    });
  }

  static trackVideoPlay(videoId: string, properties?: Record<string, unknown>) {
    trackEvent({
      event_name: 'video_play',
      event_type: 'media',
      properties: {
        ...properties,
        video_id: videoId,
      },
    });
  }

  static trackVideoComplete(
    videoId: string,
    duration: number,
    properties?: Record<string, unknown>
  ) {
    trackEvent({
      event_name: 'video_complete',
      event_type: 'media',
      properties: {
        ...properties,
        video_id: videoId,
        duration,
      },
    });
  }
}

export default AnalyticsHelper;
