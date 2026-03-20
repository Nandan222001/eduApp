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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login, loginWithBiometric, clearError } from '@store/slices/authSlice';
import { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { biometricUtils } from '../../utils/biometric';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error, biometricEnabled } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');

  useEffect(() => {
    checkBiometric();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const checkBiometric = async () => {
    const available = await biometricUtils.isAvailable();
    setBiometricAvailable(available);
    if (available) {
      const type = await biometricUtils.getBiometricType();
      setBiometricType(type);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    const credentials = {
      email: email.trim(),
      password,
      institution_id: institutionId ? parseInt(institutionId) : undefined,
    };

    dispatch(login(credentials));
  };

  const handleBiometricLogin = async () => {
    dispatch(loginWithBiometric());
  };

  const handleOTPLogin = () => {
    navigation.navigate('OTPLogin');
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
          <Text style={styles.title}>Welcome to EduTrack</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Institution ID (Optional)"
            placeholder="Enter institution ID"
            value={institutionId}
            onChangeText={setInstitutionId}
            keyboardType="numeric"
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          {biometricAvailable && biometricEnabled && (
            <Button
              title={`Sign In with ${biometricType}`}
              onPress={handleBiometricLogin}
              variant="outline"
              style={styles.biometricButton}
            />
          )}

          <TouchableOpacity onPress={handleOTPLogin} style={styles.otpLink}>
            <Text style={styles.otpLinkText}>Sign in with OTP instead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
  loginButton: {
    marginTop: 24,
  },
  biometricButton: {
    marginTop: 12,
  },
  otpLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  otpLinkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
