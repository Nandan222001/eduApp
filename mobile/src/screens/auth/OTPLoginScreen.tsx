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
import { requestOTP, clearError } from '@store/slices/authSlice';
import { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type OTPLoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTPLogin'>;
};

export const OTPLoginScreen: React.FC<OTPLoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [institutionId, setInstitutionId] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRequestOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const data = {
      email: email.trim(),
      institution_id: institutionId ? parseInt(institutionId) : undefined,
    };

    try {
      await dispatch(requestOTP(data)).unwrap();
      Alert.alert('Success', 'OTP has been sent to your email', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('OTPVerify', { 
            email: email.trim(), 
            institution_id: institutionId ? parseInt(institutionId) : undefined 
          }),
        },
      ]);
    } catch (err) {
      // Error is handled by the effect above
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
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
          <Text style={styles.title}>Sign In with OTP</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a one-time password
          </Text>

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
            label="Institution ID (Optional)"
            placeholder="Enter institution ID"
            value={institutionId}
            onChangeText={setInstitutionId}
            keyboardType="numeric"
          />

          <Button
            title="Send OTP"
            onPress={handleRequestOTP}
            loading={isLoading}
            style={styles.sendButton}
          />

          <TouchableOpacity onPress={handleBackToLogin} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Password Login</Text>
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
  sendButton: {
    marginTop: 24,
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});
