import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Input, Button, Icon } from '@rneui/themed';
import { biometricService, pinService, sessionService } from '@services';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';

interface SessionLockScreenProps {
  onUnlock: () => void;
}

export const SessionLockScreen: React.FC<SessionLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [useBiometric, setUseBiometric] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);

  useEffect(() => {
    checkAuthMethods();
    tryBiometricUnlock();
  }, []);

  const checkAuthMethods = async () => {
    const capabilities = await biometricService.checkBiometricCapabilities();
    setBiometricAvailable(capabilities.isAvailable);
    setBiometricType(capabilities.biometricType);

    const bioEnabled = await biometricService.isBiometricEnabled();
    setUseBiometric(bioEnabled);

    const pinEn = await pinService.isPinEnabled();
    setPinEnabled(pinEn);
  };

  const tryBiometricUnlock = async () => {
    const bioEnabled = await biometricService.isBiometricEnabled();
    
    if (bioEnabled) {
      const success = await sessionService.unlockSession();
      if (success) {
        onUnlock();
      }
    }
  };

  const handleBiometricUnlock = async () => {
    setLoading(true);
    try {
      const success = await sessionService.unlockSession();
      if (success) {
        onUnlock();
      } else {
        Alert.alert('Authentication Failed', 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handlePinUnlock = async () => {
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    setLoading(true);
    try {
      const success = await pinService.verifyPin(pin);
      if (success) {
        await sessionService.unlockSession();
        onUnlock();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify PIN');
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon
          name="lock"
          type="material"
          size={80}
          color={COLORS.primary}
          containerStyle={styles.lockIcon}
        />
        
        <Text h3 style={styles.title}>
          Session Locked
        </Text>
        
        <Text style={styles.subtitle}>
          Please authenticate to continue
        </Text>

        {useBiometric && biometricAvailable && (
          <>
            <Button
              title={`Unlock with ${biometricType}`}
              onPress={handleBiometricUnlock}
              loading={loading}
              buttonStyle={styles.biometricButton}
              titleStyle={styles.biometricButtonText}
              icon={
                <Icon
                  name="fingerprint"
                  type="material"
                  color={COLORS.primary}
                  size={24}
                  containerStyle={{ marginRight: 10 }}
                />
              }
              type="outline"
            />

            {pinEnabled && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            )}
          </>
        )}

        {pinEnabled && (
          <View style={styles.pinContainer}>
            <Input
              placeholder="Enter PIN"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              containerStyle={styles.pinInput}
              leftIcon={
                <Icon name="dialpad" type="material" color={COLORS.textSecondary} />
              }
            />

            <Button
              title="Unlock"
              onPress={handlePinUnlock}
              loading={loading}
              buttonStyle={styles.unlockButton}
            />
          </View>
        )}

        {!useBiometric && !pinEnabled && (
          <Text style={styles.noAuthText}>
            No authentication method available. Please restart the app.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  lockIcon: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  biometricButton: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    width: '100%',
  },
  biometricButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  pinContainer: {
    width: '100%',
  },
  pinInput: {
    marginBottom: SPACING.md,
  },
  unlockButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  noAuthText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
