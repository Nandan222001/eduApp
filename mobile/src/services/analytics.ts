import { apiClient } from '@api/client';
import { Sentry } from '@config/sentry';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface AnalyticsEvent {
  event_name: string;
  event_category: string;
  event_properties?: Record<string, any>;
  timestamp?: string;
  user_id?: string;
  session_id?: string;
}

export interface PerformanceMetric {
  metric_name: string;
  metric_type: 'app_launch' | 'screen_render' | 'api_response' | 'custom';
  value: number;
  unit: 'ms' | 'seconds' | 'bytes' | 'count';
  metadata?: Record<string, any>;
  timestamp?: string;
}

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 30000;
  private readonly MAX_QUEUE_SIZE = 50;
  private appLaunchTime: number;
  private screenStartTimes: Map<string, number> = new Map();
  private apiRequestStartTimes: Map<string, number> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.appLaunchTime = Date.now();
    this.startAutoFlush();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoFlush() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public clearUserId() {
    this.userId = null;
  }

  public async trackEvent(
    eventName: string,
    category: string,
    properties?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      event_name: eventName,
      event_category: category,
      event_properties: {
        ...properties,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version || '1.0.0',
        device_model: Device.modelName,
        device_brand: Device.brand,
        os_version: Device.osVersion,
      },
      timestamp: new Date().toISOString(),
      user_id: this.userId || undefined,
      session_id: this.sessionId,
    };

    this.eventQueue.push(event);

    Sentry.addBreadcrumb({
      category: 'analytics',
      message: `Event: ${eventName}`,
      level: 'info',
      data: properties,
    });

    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      await this.flush();
    }
  }

  public async trackScreenView(screenName: string, previousScreen?: string): Promise<void> {
    await this.trackEvent(
      'screen_view',
      'navigation',
      {
        screen_name: screenName,
        previous_screen: previousScreen,
      }
    );

    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Screen: ${screenName}`,
      level: 'info',
    });
  }

  public async trackButtonClick(
    buttonName: string,
    screenName: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(
      'button_click',
      'interaction',
      {
        button_name: buttonName,
        screen_name: screenName,
        ...additionalData,
      }
    );
  }

  public async trackAssignmentSubmission(
    assignmentId: string,
    assignmentTitle: string,
    submissionType: string
  ): Promise<void> {
    await this.trackEvent(
      'assignment_submission',
      'academic',
      {
        assignment_id: assignmentId,
        assignment_title: assignmentTitle,
        submission_type: submissionType,
      }
    );
  }

  public async trackLogin(method: string, success: boolean): Promise<void> {
    await this.trackEvent(
      'login',
      'authentication',
      {
        method,
        success,
      }
    );
  }

  public async trackLogout(): Promise<void> {
    await this.trackEvent('logout', 'authentication', {});
    await this.flush();
  }

  public async trackFeatureUsage(
    featureName: string,
    featureCategory: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(
      'feature_usage',
      'feature',
      {
        feature_name: featureName,
        feature_category: featureCategory,
        ...metadata,
      }
    );
  }

  public async trackSearch(
    searchQuery: string,
    searchCategory: string,
    resultCount: number
  ): Promise<void> {
    await this.trackEvent(
      'search',
      'search',
      {
        query: searchQuery,
        category: searchCategory,
        result_count: resultCount,
      }
    );
  }

  public async trackError(
    errorMessage: string,
    errorCode?: string,
    stackTrace?: string
  ): Promise<void> {
    await this.trackEvent(
      'error',
      'error',
      {
        message: errorMessage,
        code: errorCode,
        stack_trace: stackTrace,
      }
    );
  }

  public trackAppLaunchTime(): void {
    const launchTime = Date.now() - this.appLaunchTime;
    this.trackPerformanceMetric({
      metric_name: 'app_launch_time',
      metric_type: 'app_launch',
      value: launchTime,
      unit: 'ms',
    });

    Sentry.setMeasurement('app_launch_time', launchTime, 'millisecond');
  }

  public startScreenRender(screenName: string): void {
    this.screenStartTimes.set(screenName, Date.now());
  }

  public endScreenRender(screenName: string): void {
    const startTime = this.screenStartTimes.get(screenName);
    if (startTime) {
      const renderTime = Date.now() - startTime;
      this.trackPerformanceMetric({
        metric_name: 'screen_render_time',
        metric_type: 'screen_render',
        value: renderTime,
        unit: 'ms',
        metadata: {
          screen_name: screenName,
        },
      });

      Sentry.setMeasurement(`screen_render_${screenName}`, renderTime, 'millisecond');
      this.screenStartTimes.delete(screenName);
    }
  }

  public startApiRequest(requestId: string, endpoint: string, method: string): void {
    this.apiRequestStartTimes.set(requestId, Date.now());

    Sentry.addBreadcrumb({
      category: 'api',
      message: `API Request: ${method} ${endpoint}`,
      level: 'info',
      data: { request_id: requestId },
    });
  }

  public endApiRequest(
    requestId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    success: boolean
  ): void {
    const startTime = this.apiRequestStartTimes.get(requestId);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      this.trackPerformanceMetric({
        metric_name: 'api_response_time',
        metric_type: 'api_response',
        value: responseTime,
        unit: 'ms',
        metadata: {
          endpoint,
          method,
          status_code: statusCode,
          success,
        },
      });

      Sentry.addBreadcrumb({
        category: 'api',
        message: `API Response: ${method} ${endpoint}`,
        level: success ? 'info' : 'error',
        data: {
          request_id: requestId,
          status_code: statusCode,
          response_time: responseTime,
        },
      });

      this.apiRequestStartTimes.delete(requestId);
    }
  }

  private trackPerformanceMetric(metric: PerformanceMetric): void {
    const completeMetric: PerformanceMetric = {
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
    };

    this.performanceQueue.push(completeMetric);

    if (this.performanceQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushPerformanceMetrics();
    }
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await apiClient.post('/analytics/track', {
        events: eventsToSend,
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      this.eventQueue.unshift(...eventsToSend.slice(-10));
    }
  }

  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceQueue.length === 0) {
      return;
    }

    const metricsToSend = [...this.performanceQueue];
    this.performanceQueue = [];

    try {
      await apiClient.post('/analytics/performance', {
        metrics: metricsToSend,
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      this.performanceQueue.unshift(...metricsToSend.slice(-10));
    }
  }

  public async forceFlush(): Promise<void> {
    await Promise.all([this.flush(), this.flushPerformanceMetrics()]);
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.forceFlush();
  }
}

export const analyticsService = new AnalyticsService();
