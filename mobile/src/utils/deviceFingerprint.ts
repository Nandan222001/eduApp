import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';

export interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
  deviceType: string;
  deviceModel: string | null;
  osVersion: string;
  appVersion: string;
}

class DeviceFingerprintService {
  private fingerprintKey = 'device_fingerprint';

  async generateFingerprint(): Promise<string> {
    const components = [
      Device.modelId || 'unknown',
      Device.osName || Platform.OS,
      Device.osVersion || 'unknown',
      Device.brand || 'unknown',
      Device.deviceName || 'unknown',
      Platform.OS,
    ];

    const baseFingerprint = components.join('|');

    const hash = await this.simpleHash(baseFingerprint);

    return hash;
  }

  private async simpleHash(str: string): Promise<string> {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const timestamp = Date.now().toString(36);
    return Math.abs(hash).toString(36) + timestamp;
  }

  async getOrCreateFingerprint(): Promise<string> {
    try {
      let fingerprint = await secureStorage.getItem(this.fingerprintKey);

      if (!fingerprint) {
        fingerprint = await this.generateFingerprint();
        await secureStorage.setItem(this.fingerprintKey, fingerprint);
      }

      return fingerprint;
    } catch (error) {
      console.error('Error getting/creating fingerprint:', error);
      return await this.generateFingerprint();
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const fingerprint = await this.getOrCreateFingerprint();

    let deviceType = 'unknown';
    if (Device.deviceType === Device.DeviceType.PHONE) {
      deviceType = 'phone';
    } else if (Device.deviceType === Device.DeviceType.TABLET) {
      deviceType = 'tablet';
    } else if (Device.deviceType === Device.DeviceType.DESKTOP) {
      deviceType = 'desktop';
    }

    return {
      fingerprint,
      deviceName: Device.deviceName || `${Device.brand} ${Device.modelName}` || 'Unknown Device',
      deviceType,
      deviceModel: Device.modelName || null,
      osVersion: Device.osVersion || 'unknown',
      appVersion: '1.0.0',
    };
  }

  async resetFingerprint(): Promise<void> {
    await secureStorage.removeItem(this.fingerprintKey);
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();
