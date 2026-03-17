import { secureStorage } from '@utils/secureStorage';
import { Alert } from 'react-native';

export interface PinAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

class PinService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000;
  private readonly ATTEMPT_WINDOW = 15 * 60 * 1000;

  private async hashPin(pin: string): Promise<string> {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async setupPin(pin: string): Promise<boolean> {
    try {
      if (pin.length < 4 || pin.length > 6) {
        Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
        return false;
      }

      if (!/^\d+$/.test(pin)) {
        Alert.alert('Invalid PIN', 'PIN must contain only numbers');
        return false;
      }

      const hashedPin = await this.hashPin(pin);
      await secureStorage.setItem('pin_hash', hashedPin);
      await secureStorage.setItem('pin_enabled', 'true');

      await this.clearAttempts();

      return true;
    } catch (error) {
      console.error('Error setting up PIN:', error);
      return false;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const isLocked = await this.isLocked();
      if (isLocked) {
        const lockTime = await this.getLockTimeRemaining();
        Alert.alert(
          'Account Locked',
          `Too many failed attempts. Try again in ${Math.ceil(lockTime / 60000)} minutes.`
        );
        return false;
      }

      const storedHash = await secureStorage.getItem('pin_hash');
      if (!storedHash) {
        return false;
      }

      const inputHash = await this.hashPin(pin);
      const isValid = inputHash === storedHash;

      if (isValid) {
        await this.clearAttempts();
        return true;
      } else {
        await this.recordFailedAttempt();

        const attempts = await this.getAttempts();
        const remainingAttempts = this.MAX_ATTEMPTS - attempts.count;

        if (remainingAttempts > 0) {
          Alert.alert(
            'Invalid PIN',
            `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`
          );
        }

        return false;
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  async changePin(oldPin: string, newPin: string): Promise<boolean> {
    try {
      const isValid = await this.verifyPin(oldPin);
      if (!isValid) {
        Alert.alert('Error', 'Current PIN is incorrect');
        return false;
      }

      return await this.setupPin(newPin);
    } catch (error) {
      console.error('Error changing PIN:', error);
      return false;
    }
  }

  async disablePin(): Promise<void> {
    try {
      await secureStorage.removeItem('pin_hash');
      await secureStorage.removeItem('pin_enabled');
      await this.clearAttempts();
    } catch (error) {
      console.error('Error disabling PIN:', error);
    }
  }

  async isPinEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getItem('pin_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  private async getAttempts(): Promise<PinAttempt> {
    try {
      const attemptsData = await secureStorage.getObject<PinAttempt>('pin_attempts');
      if (!attemptsData) {
        return { count: 0, lastAttempt: Date.now() };
      }

      if (Date.now() - attemptsData.lastAttempt > this.ATTEMPT_WINDOW) {
        return { count: 0, lastAttempt: Date.now() };
      }

      return attemptsData;
    } catch (error) {
      return { count: 0, lastAttempt: Date.now() };
    }
  }

  private async recordFailedAttempt(): Promise<void> {
    try {
      const attempts = await this.getAttempts();
      const newCount = attempts.count + 1;

      const newAttempts: PinAttempt = {
        count: newCount,
        lastAttempt: Date.now(),
      };

      if (newCount >= this.MAX_ATTEMPTS) {
        newAttempts.lockedUntil = Date.now() + this.LOCKOUT_DURATION;
      }

      await secureStorage.setObject('pin_attempts', newAttempts);
    } catch (error) {
      console.error('Error recording failed attempt:', error);
    }
  }

  private async clearAttempts(): Promise<void> {
    try {
      await secureStorage.removeItem('pin_attempts');
    } catch (error) {
      console.error('Error clearing attempts:', error);
    }
  }

  async isLocked(): Promise<boolean> {
    try {
      const attempts = await this.getAttempts();

      if (!attempts.lockedUntil) {
        return false;
      }

      if (Date.now() >= attempts.lockedUntil) {
        await this.clearAttempts();
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async getLockTimeRemaining(): Promise<number> {
    try {
      const attempts = await this.getAttempts();

      if (!attempts.lockedUntil) {
        return 0;
      }

      const remaining = attempts.lockedUntil - Date.now();
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      return 0;
    }
  }
}

export const pinService = new PinService();
