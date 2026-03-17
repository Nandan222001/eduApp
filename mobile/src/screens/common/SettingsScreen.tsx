import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Text, ListItem, Icon, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { biometricService, pinService, sessionService } from '@services';
import { mobileAuthApi } from '@api/mobileAuth';
import { deviceFingerprintService } from '@utils/deviceFingerprint';
import { COLORS, SPACING } from '@constants';

export const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [autoLockTime, setAutoLockTime] = useState(5);
  const [requireBiometricForSensitive, setRequireBiometricForSensitive] = useState(true);
  const [deviceId, setDeviceId] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const capabilities = await biometricService.checkBiometricCapabilities();
      setBiometricAvailable(capabilities.isAvailable);
      setBiometricType(capabilities.biometricType);

      const bioEnabled = await biometricService.isBiometricEnabled();
      setBiometricEnabled(bioEnabled);

      const pinEn = await pinService.isPinEnabled();
      setPinEnabled(pinEn);

      try {
        const settingsResponse = await mobileAuthApi.getSecuritySettings();
        const settings = settingsResponse.data;
        setSessionTimeout(settings.session_timeout_minutes);
        setAutoLockTime(settings.auto_lock_minutes);
        setRequireBiometricForSensitive(settings.require_biometric_for_sensitive);
      } catch (error) {
        console.error('Error loading security settings:', error);
      }

      const deviceInfo = await deviceFingerprintService.getDeviceInfo();
      try {
        const deviceResponse = await mobileAuthApi.registerDevice({
          device_name: deviceInfo.deviceName,
          device_type: deviceInfo.deviceType,
          device_fingerprint: deviceInfo.fingerprint,
          device_model: deviceInfo.deviceModel || undefined,
          os_version: deviceInfo.osVersion,
          app_version: deviceInfo.appVersion,
        });
        setDeviceId(deviceResponse.data.device_id);
      } catch (error) {
        console.error('Error registering device:', error);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      Alert.prompt(
        'Enable Biometric Login',
        'Please enter your password to enable biometric authentication',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async password => {
              if (!password) {
                Alert.alert('Error', 'Password is required');
                return;
              }

              const success = await biometricService.enableBiometric('user@example.com', password);
              if (success) {
                setBiometricEnabled(true);

                const deviceInfo = await deviceFingerprintService.getDeviceInfo();
                try {
                  await mobileAuthApi.setupBiometric({
                    enabled: true,
                    biometric_type: biometricType,
                    device_id: deviceId || undefined,
                    device_fingerprint: deviceInfo.fingerprint,
                  });
                } catch (error) {
                  console.error('Error updating biometric settings:', error);
                }

                Alert.alert('Success', 'Biometric authentication enabled');
              } else {
                Alert.alert('Error', 'Failed to enable biometric authentication');
              }
            },
          },
        ],
        'secure-text'
      );
    } else {
      await biometricService.disableBiometric();
      setBiometricEnabled(false);

      const deviceInfo = await deviceFingerprintService.getDeviceInfo();
      try {
        await mobileAuthApi.setupBiometric({
          enabled: false,
          biometric_type: biometricType,
          device_id: deviceId || undefined,
          device_fingerprint: deviceInfo.fingerprint,
        });
      } catch (error) {
        console.error('Error updating biometric settings:', error);
      }

      Alert.alert('Success', 'Biometric authentication disabled');
    }
  };

  const setupPin = () => {
    router.push('/settings/pin-setup' as any);
  };

  const updateSessionTimeout = async (minutes: number) => {
    try {
      await mobileAuthApi.updateSecuritySettings({
        session_timeout_minutes: minutes,
      });
      await sessionService.updateSettings(minutes, autoLockTime);
      setSessionTimeout(minutes);
      Alert.alert('Success', `Session timeout updated to ${minutes} minutes`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update session timeout');
    }
  };

  const updateAutoLock = async (minutes: number) => {
    try {
      await mobileAuthApi.updateSecuritySettings({
        auto_lock_minutes: minutes,
      });
      await sessionService.updateSettings(sessionTimeout, minutes);
      setAutoLockTime(minutes);
      Alert.alert('Success', `Auto-lock updated to ${minutes} minutes`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto-lock time');
    }
  };

  const toggleRequireBiometric = async (value: boolean) => {
    try {
      await mobileAuthApi.updateSecuritySettings({
        require_biometric_for_sensitive: value,
      });
      setRequireBiometricForSensitive(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const viewDevices = () => {
    router.push('/settings/devices' as any);
  };

  const viewAuthHistory = () => {
    router.push('/settings/auth-history' as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>

        {biometricAvailable && (
          <ListItem bottomDivider>
            <Icon name="fingerprint" type="material" color={COLORS.primary} />
            <ListItem.Content>
              <ListItem.Title>{biometricType} Login</ListItem.Title>
              <ListItem.Subtitle>
                Use {biometricType.toLowerCase()} for quick login
              </ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            />
          </ListItem>
        )}

        <ListItem bottomDivider onPress={setupPin}>
          <Icon name="dialpad" type="material" color={COLORS.primary} />
          <ListItem.Content>
            <ListItem.Title>PIN Code</ListItem.Title>
            <ListItem.Subtitle>
              {pinEnabled ? 'Change or disable PIN' : 'Set up PIN for quick access'}
            </ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>

        <ListItem bottomDivider>
          <Icon name="timer" type="material" color={COLORS.primary} />
          <ListItem.Content>
            <ListItem.Title>Session Timeout</ListItem.Title>
            <ListItem.Subtitle>{sessionTimeout} minutes</ListItem.Subtitle>
          </ListItem.Content>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Session Timeout', 'Select timeout duration', [
                { text: '15 minutes', onPress: () => updateSessionTimeout(15) },
                { text: '30 minutes', onPress: () => updateSessionTimeout(30) },
                { text: '60 minutes', onPress: () => updateSessionTimeout(60) },
                { text: '120 minutes', onPress: () => updateSessionTimeout(120) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </ListItem>

        <ListItem bottomDivider>
          <Icon name="lock-clock" type="material" color={COLORS.primary} />
          <ListItem.Content>
            <ListItem.Title>Auto-Lock</ListItem.Title>
            <ListItem.Subtitle>Lock after {autoLockTime} minutes in background</ListItem.Subtitle>
          </ListItem.Content>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Auto-Lock Time', 'Select auto-lock duration', [
                { text: '1 minute', onPress: () => updateAutoLock(1) },
                { text: '5 minutes', onPress: () => updateAutoLock(5) },
                { text: '15 minutes', onPress: () => updateAutoLock(15) },
                { text: '30 minutes', onPress: () => updateAutoLock(30) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </ListItem>

        {(biometricEnabled || pinEnabled) && (
          <ListItem bottomDivider>
            <Icon name="security" type="material" color={COLORS.primary} />
            <ListItem.Content>
              <ListItem.Title>Require Auth for Sensitive Operations</ListItem.Title>
              <ListItem.Subtitle>
                Re-authenticate for payments, profile changes, etc.
              </ListItem.Subtitle>
            </ListItem.Content>
            <Switch
              value={requireBiometricForSensitive}
              onValueChange={toggleRequireBiometric}
              trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            />
          </ListItem>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Management</Text>

        <ListItem bottomDivider onPress={viewDevices}>
          <Icon name="devices" type="material" color={COLORS.primary} />
          <ListItem.Content>
            <ListItem.Title>Manage Devices</ListItem.Title>
            <ListItem.Subtitle>View and remove trusted devices</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>

        <ListItem bottomDivider onPress={viewAuthHistory}>
          <Icon name="history" type="material" color={COLORS.primary} />
          <ListItem.Content>
            <ListItem.Title>Authentication History</ListItem.Title>
            <ListItem.Subtitle>View recent login activity</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  changeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
