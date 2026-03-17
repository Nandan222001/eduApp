import React, { useState } from 'react';
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
import { authApi } from '@api/auth';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { AuthStackScreenProps } from '@types';

type Props = AuthStackScreenProps<'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token } = route.params || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePassword()) {
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Invalid reset token. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });

      Alert.alert('Success', 'Your password has been reset successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { text: 'Weak', color: COLORS.error };
    if (strength <= 3) return { text: 'Medium', color: COLORS.warning };
    return { text: 'Strong', color: COLORS.success };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.iconContainer}>
          <Icon name="lock-open" type="material" color={COLORS.primary} size={80} />
        </View>

        <View style={styles.header}>
          <Text h2 style={styles.title}>
            Reset Password
          </Text>
          <Text style={styles.subtitle}>Enter your new password below</Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="New Password"
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
            containerStyle={styles.inputContainer}
          />

          {passwordStrength && (
            <View style={styles.strengthContainer}>
              <Text style={styles.strengthLabel}>Password Strength: </Text>
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.text}
              </Text>
            </View>
          )}

          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Icon name="lock" type="material" color={COLORS.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  type="material"
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            }
            errorMessage={
              confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''
            }
            containerStyle={styles.inputContainer}
          />

          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirement}>
              <Icon
                name={password.length >= 8 ? 'check-circle' : 'cancel'}
                type="material"
                color={password.length >= 8 ? COLORS.success : COLORS.textSecondary}
                size={16}
              />
              <Text style={styles.requirementText}>At least 8 characters</Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'check-circle' : 'cancel'}
                type="material"
                color={
                  /[a-z]/.test(password) && /[A-Z]/.test(password)
                    ? COLORS.success
                    : COLORS.textSecondary
                }
                size={16}
              />
              <Text style={styles.requirementText}>Uppercase and lowercase letters</Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/\d/.test(password) ? 'check-circle' : 'cancel'}
                type="material"
                color={/\d/.test(password) ? COLORS.success : COLORS.textSecondary}
                size={16}
              />
              <Text style={styles.requirementText}>At least one number</Text>
            </View>
          </View>

          <Button
            title="Reset Password"
            onPress={handleSubmit}
            loading={isLoading}
            buttonStyle={styles.submitButton}
            titleStyle={styles.submitButtonText}
          />

          <Button
            title="Back to Login"
            type="clear"
            onPress={() => navigation.navigate('Login')}
            titleStyle={styles.backButtonText}
            containerStyle={styles.backButton}
          />
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  strengthLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  strengthText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  requirementsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  requirementsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  requirementText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: SPACING.lg,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
  },
});
