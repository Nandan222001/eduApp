import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { verifyOTP, requestOTP, clearError } from '@store/slices/authSlice';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const OTPVerifyScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const email = params.email as string;
  const institution_id = params.institution_id ? parseInt(params.institution_id as string) : undefined;
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    const data = {
      email,
      otp: otp.trim(),
      institution_id,
    };

    dispatch(verifyOTP(data));
  };

  const handleResendOTP = async () => {
    const data = {
      email,
      institution_id,
    };

    try {
      await dispatch(requestOTP(data)).unwrap();
      Alert.alert('Success', 'New OTP has been sent to your email');
      setOtp('');
    } catch (err) {
      // Error is handled by the effect above
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
        <View style={styles.content}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <Input
            label="OTP Code"
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <Button
            title="Verify OTP"
            onPress={handleVerifyOTP}
            loading={isLoading}
            style={styles.verifyButton}
          />

          <TouchableOpacity onPress={handleResendOTP} style={styles.resendLink}>
            <Text style={styles.resendLinkText}>Didn't receive the code? Resend</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  email: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
  verifyButton: {
    marginTop: 24,
  },
  resendLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
