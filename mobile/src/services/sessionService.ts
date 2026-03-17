import { AppState, AppStateStatus } from 'react-native';
import { secureStorage } from '@utils/secureStorage';
import { biometricService } from './biometricService';
import { pinService } from './pinService';

export interface SessionData {
  lastActiveTime: number;
  backgroundTime?: number;
  isLocked: boolean;
}

type SessionTimeoutCallback = () => void;
type SessionLockCallback = () => void;

class SessionService {
  private sessionTimeoutMinutes = 30;
  private autoLockMinutes = 5;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private sessionTimeoutCallback: SessionTimeoutCallback | null = null;
  private sessionLockCallback: SessionLockCallback | null = null;
  private appStateSubscription: any = null;

  async initialize(
    timeoutCallback: SessionTimeoutCallback,
    lockCallback: SessionLockCallback
  ): Promise<void> {
    this.sessionTimeoutCallback = timeoutCallback;
    this.sessionLockCallback = lockCallback;

    await this.loadSettings();

    this.setupAppStateListener();

    await this.updateActivity();
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await secureStorage.getObject<{
        sessionTimeoutMinutes?: number;
        autoLockMinutes?: number;
      }>('session_settings');

      if (settings) {
        this.sessionTimeoutMinutes = settings.sessionTimeoutMinutes || 30;
        this.autoLockMinutes = settings.autoLockMinutes || 5;
      }
    } catch (error) {
      console.error('Error loading session settings:', error);
    }
  }

  async updateSettings(sessionTimeoutMinutes: number, autoLockMinutes: number): Promise<void> {
    this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    this.autoLockMinutes = autoLockMinutes;

    await secureStorage.setObject('session_settings', {
      sessionTimeoutMinutes,
      autoLockMinutes,
    });

    this.resetTimer();
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    const sessionData = await this.getSessionData();

    if (nextAppState === 'background') {
      sessionData.backgroundTime = Date.now();
      await this.saveSessionData(sessionData);
    } else if (nextAppState === 'active') {
      if (sessionData.backgroundTime) {
        const backgroundDuration = Date.now() - sessionData.backgroundTime;
        const autoLockMs = this.autoLockMinutes * 60 * 1000;

        if (backgroundDuration >= autoLockMs) {
          await this.lockSession();
        }

        sessionData.backgroundTime = undefined;
        await this.saveSessionData(sessionData);
      }

      await this.checkSessionTimeout();
    }
  }

  async updateActivity(): Promise<void> {
    const sessionData = await this.getSessionData();
    sessionData.lastActiveTime = Date.now();
    await this.saveSessionData(sessionData);

    this.resetTimer();
  }

  private resetTimer(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    const timeoutMs = this.sessionTimeoutMinutes * 60 * 1000;
    this.timeoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeoutMs);
  }

  private async handleSessionTimeout(): Promise<void> {
    await this.lockSession();

    if (this.sessionTimeoutCallback) {
      this.sessionTimeoutCallback();
    }
  }

  private async checkSessionTimeout(): Promise<void> {
    const sessionData = await this.getSessionData();
    const now = Date.now();
    const timeSinceActive = now - sessionData.lastActiveTime;
    const timeoutMs = this.sessionTimeoutMinutes * 60 * 1000;

    if (timeSinceActive >= timeoutMs) {
      await this.handleSessionTimeout();
    }
  }

  async lockSession(): Promise<void> {
    const sessionData = await this.getSessionData();
    sessionData.isLocked = true;
    await this.saveSessionData(sessionData);

    if (this.sessionLockCallback) {
      this.sessionLockCallback();
    }
  }

  async unlockSession(): Promise<boolean> {
    const biometricEnabled = await biometricService.isBiometricEnabled();
    const pinEnabled = await pinService.isPinEnabled();

    let authenticated = false;

    if (biometricEnabled) {
      authenticated = await biometricService.authenticate('Unlock to continue');
    } else if (pinEnabled) {
      return false;
    }

    if (authenticated) {
      const sessionData = await this.getSessionData();
      sessionData.isLocked = false;
      sessionData.lastActiveTime = Date.now();
      await this.saveSessionData(sessionData);

      this.resetTimer();
      return true;
    }

    return false;
  }

  async isSessionLocked(): Promise<boolean> {
    const sessionData = await this.getSessionData();
    return sessionData.isLocked;
  }

  async requireReauthForSensitiveOperation(operationType: string): Promise<boolean> {
    try {
      const requireBiometric = await secureStorage.getItem('require_biometric_for_sensitive');

      if (requireBiometric !== 'true') {
        return true;
      }

      const biometricEnabled = await biometricService.isBiometricEnabled();
      const pinEnabled = await pinService.isPinEnabled();

      if (biometricEnabled) {
        return await biometricService.authenticateForSensitiveOperation(operationType);
      } else if (pinEnabled) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in reauth for sensitive operation:', error);
      return false;
    }
  }

  private async getSessionData(): Promise<SessionData> {
    try {
      const data = await secureStorage.getObject<SessionData>('session_data');
      return (
        data || {
          lastActiveTime: Date.now(),
          isLocked: false,
        }
      );
    } catch (error) {
      return {
        lastActiveTime: Date.now(),
        isLocked: false,
      };
    }
  }

  private async saveSessionData(data: SessionData): Promise<void> {
    try {
      await secureStorage.setObject('session_data', data);
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  async clearSession(): Promise<void> {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    await secureStorage.removeItem('session_data');
  }

  destroy(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export const sessionService = new SessionService();
