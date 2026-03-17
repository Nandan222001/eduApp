import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { pinService } from '@services';
import { mobileAuthApi } from '@api/mobileAuth';
import { deviceFingerprintService } from '@utils/deviceFingerprint';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

export const PinSetupScreen: React.FC = () => {
  const router = useRouter();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const enabled = await pinService.isPinEnabled();
    setPinEnabled(enabled);
  };

  const handleSetupPin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const success = await pinService.setupPin(newPin);

      if (success) {
        const deviceInfo = await deviceFingerprintService.getDeviceInfo();

        try {
          await mobileAuthApi.setupPin({
            pin: newPin,
            enabled: true,
            device_fingerprint: deviceInfo.fingerprint,
          });
        } catch (error) {
          console.error('Error syncing PIN setup:', error);
        }

        Alert.alert('Success', 'PIN has been set up successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set up PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin) {
      Alert.alert('Error', 'Please enter your current PIN');
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const success = await pinService.changePin(currentPin, newPin);

      if (success) {
        const deviceInfo = await deviceFingerprintService.getDeviceInfo();

        try {
          await mobileAuthApi.setupPin({
            pin: newPin,
            enabled: true,
            device_fingerprint: deviceInfo.fingerprint,
          });
        } catch (error) {
          console.error('Error syncing PIN change:', error);
        }

        Alert.alert('Success', 'PIN has been changed successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePin = () => {
    Alert.alert('Disable PIN', 'Are you sure you want to disable PIN authentication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await pinService.disablePin();

            const deviceInfo = await deviceFingerprintService.getDeviceInfo();

            try {
              await mobileAuthApi.setupPin({
                pin: '',
                enabled: false,
                device_fingerprint: deviceInfo.fingerprint,
              });
            } catch (error) {
              console.error('Error syncing PIN disable:', error);
            }

            Alert.alert('Success', 'PIN has been disabled', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (error) {
            Alert.alert('Error', 'Failed to disable PIN');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text h3 style={styles.title}>
          {pinEnabled ? 'Change PIN' : 'Set Up PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {pinEnabled
            ? 'Enter your current PIN and choose a new one'
            : 'Choose a 4-6 digit PIN for quick access'}
        </Text>
      </View>

      <View style={styles.form}>
        {pinEnabled && (
          <Input
            placeholder="Current PIN"
            value={currentPin}
            onChangeText={setCurrentPin}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            containerStyle={styles.inputContainer}
          />
        )}

        <Input
          placeholder="New PIN"
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          containerStyle={styles.inputContainer}
        />

        <Input
          placeholder="Confirm New PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          containerStyle={styles.inputContainer}
        />

        <Button
          title={pinEnabled ? 'Change PIN' : 'Set Up PIN'}
          onPress={pinEnabled ? handleChangePin : handleSetupPin}
          loading={loading}
          buttonStyle={styles.button}
        />

        {pinEnabled && (
          <TouchableOpacity style={styles.disableButton} onPress={handleDisablePin}>
            <Text style={styles.disableText}>Disable PIN</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • PIN must be 4-6 digits{'\n'}• After 5 failed attempts, you'll be locked out for 30
          minutes{'\n'}• PIN can be used as an alternative to biometric authentication
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    marginTop: SPACING.md,
  },
  disableButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  disableText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  info: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
});
