import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Input, Button, Icon } from '@rneui/themed';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  login,
  enableBiometric,
  disableBiometric,
  loadStoredAuth,
} from '@store/slices/authSlice';
import { secureStorage } from '@utils/secureStorage';
import { authService } from '@utils/authService';
import { STORAGE_KEYS, COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { AuthStackScreenProps } from '@types';

type Props = AuthStackScreenProps<'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error, biometricEnabled } = useAppSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useOTP, setUseOTP] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometricAvailability();
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (biometricEnabled) {
      tryBiometricLogin();
    }
  }, [biometricEnabled]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else {
          setBiometricType('Biometric');
        }
      }
    } catch (err) {
      console.error('Biometric check error:', err);
    }
  };

  const tryBiometricLogin = async () => {
    if (biometricAvailable && biometricEnabled) {
      setTimeout(() => {
        handleBiometricLogin();
      }, 500);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Login with ${biometricType}`,
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const credentials = await authService.getBiometricCredentials();

        if (credentials) {
          await dispatch(
            login({
              email: credentials.email,
              password: credentials.password,
            })
          ).unwrap();
        } else {
          Alert.alert('Error', 'No saved credentials found. Please login manually.');
        }
      }
    } catch (err) {
      console.error('Biometric login error:', err);
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async () => {
    if (!email || (!password && !otp)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await dispatch(
        login({
          email: email.trim(),
          password: useOTP ? '' : password,
          otp: useOTP ? otp : undefined,
        })
      ).unwrap();

      if (rememberMe && password && !useOTP) {
        await dispatch(enableBiometric({ email: email.trim(), password }));
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err || 'An error occurred during login');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      await dispatch(disableBiometric());
      setRememberMe(false);
      Alert.alert('Success', 'Biometric login disabled');
    } else {
      setRememberMe(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text h2 style={styles.title}>
            Welcome Back
          </Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Icon name="email" type="material" color={COLORS.textSecondary} />}
            errorMessage={error && !email ? 'Email is required' : ''}
            containerStyle={styles.inputContainer}
          />

          {!useOTP ? (
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Icon name="lock" type="material" color={COLORS.textSecondary} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    type="material"
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
              errorMessage={error && !password ? 'Password is required' : ''}
              containerStyle={styles.inputContainer}
            />
          ) : (
            <Input
              placeholder="OTP Code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon={<Icon name="dialpad" type="material" color={COLORS.textSecondary} />}
              errorMessage={error && !otp ? 'OTP is required' : ''}
              containerStyle={styles.inputContainer}
            />
          )}

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={!biometricAvailable}
            >
              <Icon
                name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                type="material"
                color={biometricAvailable ? COLORS.primary : COLORS.disabled}
                size={24}
              />
              <Text
                style={[
                  styles.checkboxLabel,
                  !biometricAvailable && styles.disabledText,
                ]}
              >
                Enable {biometricType}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error" type="material" color={COLORS.error} size={20} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            buttonStyle={styles.loginButton}
            titleStyle={styles.loginButtonText}
          />

          <TouchableOpacity
            style={styles.otpToggle}
            onPress={() => {
              setUseOTP(!useOTP);
              setOtp('');
              setPassword('');
            }}
          >
            <Text style={styles.linkText}>
              {useOTP ? 'Login with Password' : 'Login with OTP'}
            </Text>
          </TouchableOpacity>

          {biometricAvailable && biometricEnabled && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {biometricAvailable && biometricEnabled && (
            <Button
              title={`Login with ${biometricType}`}
              onPress={handleBiometricLogin}
              type="outline"
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
            />
          )}

          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity style={styles.disableBiometric} onPress={toggleBiometric}>
              <Text style={styles.disableBiometricText}>
                Disable {biometricType}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.linkTextBold}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: SPACING.xs,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  disabledText: {
    color: COLORS.disabled,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  loginButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  otpToggle: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
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
  biometricButton: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  biometricButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  disableBiometric: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  disableBiometricText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
});
