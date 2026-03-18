import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  Card,
  Button,
  Input,
  Avatar,
  Badge,
  EmptyState,
  LoadingSpinner,
  RefreshControl,
  DatePicker,
  FilePicker,
  ImagePicker,
  ErrorBoundary,
} from '@components/shared';
import { BottomSheet } from '@components/shared/BottomSheet';
import BottomSheetModal from '@gorhom/bottom-sheet';
import { useTheme } from '@/theme';

export const ComponentShowcaseScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [profileImage, setProfileImage] = useState('');
  
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleFileSelect = (file: any) => {
    console.log('Selected file:', file);
    Alert.alert('File Selected', file.name);
  };

  const handleImageSelect = (uri: string) => {
    setProfileImage(uri);
    Alert.alert('Image Selected', uri);
  };

  return (
    <ErrorBoundary>
      <ScreenContainer scroll={false}>
        <Header
          title="Component Showcase"
          subtitle="All available components"
          rightIcon="theme-light-dark"
          onRightPress={toggleTheme}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Buttons Section */}
          <SectionHeader
            title="Buttons"
            subtitle="Various button styles"
            icon="gesture-tap"
          />
          <Card elevation="md" style={{ marginBottom: theme.spacing.md }}>
            <Button
              title="Primary Button"
              variant="primary"
              onPress={() => Alert.alert('Pressed!')}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Button
              title="Secondary Button"
              variant="secondary"
              onPress={() => Alert.alert('Pressed!')}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Button
              title="Outline Button"
              variant="outline"
              onPress={() => Alert.alert('Pressed!')}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Button
              title="Loading Button"
              variant="primary"
              loading={true}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Button
              title="With Icon"
              variant="primary"
              icon="check"
              iconPosition="left"
              onPress={() => Alert.alert('Pressed!')}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Button
              title="Disabled"
              variant="primary"
              disabled={true}
            />
          </Card>

          {/* Input Section */}
          <SectionHeader title="Input Fields" icon="form-textbox" />
          <Card elevation="md" style={{ marginBottom: theme.spacing.md }}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              leftIcon="email"
              error={emailError}
              helperText="We'll never share your email"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock"
              secureTextEntry
            />
          </Card>

          {/* Avatars Section */}
          <SectionHeader title="Avatars" icon="account-circle" />
          <Card elevation="md" style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
              <Avatar name="John Doe" size="small" />
              <Avatar name="Jane Smith" size="medium" />
              <Avatar name="Bob Wilson" size="large" backgroundColor={theme.colors.secondary} />
              <Avatar icon="account" size="medium" />
              <Avatar
                uri="https://via.placeholder.com/150"
                size="large"
              />
            </View>
          </Card>

          {/* Badges Section */}
          <SectionHeader title="Badges" icon="label" />
          <Card elevation="md" style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              <Badge label="Default" variant="default" />
              <Badge label="Primary" variant="primary" />
              <Badge label="Success" variant="success" icon="check" />
              <Badge label="Warning" variant="warning" icon="alert" />
              <Badge label="Error" variant="error" icon="close" />
              <Badge label="Info" variant="info" icon="information" />
            </View>
          </Card>

          {/* Date Picker Section */}
          <SectionHeader title="Date Picker" icon="calendar" />
          <Card elevation="md" style={{ marginBottom: theme.spacing.md }}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={setSelectedDate}
              mode="date"
            />
          </Card>

          {/* File & Image Pickers */}
          <SectionHeader title="File Uploads" icon="upload" />
          <Card elevation="md" style={{ marginBottom: theme.spacing.md }}>
            <FilePicker
              label="Upload Document"
              onFileSelect={handleFileSelect}
              acceptedTypes={['application/pdf', 'image/*']}
            />
            <ImagePicker
              label="Profile Photo"
              onImageSelect={handleImageSelect}
              currentImage={profileImage}
              aspectRatio={[1, 1]}
            />
          </Card>

          {/* Bottom Sheet Trigger */}
          <SectionHeader title="Bottom Sheet" icon="dock-bottom" />
          <Card elevation="md" style={{ marginBottom: theme.spacing.md }}>
            <Button
              title="Open Bottom Sheet"
              variant="primary"
              onPress={() => bottomSheetRef.current?.present()}
            />
          </Card>

          {/* Empty State Example */}
          <SectionHeader title="Empty State" icon="inbox" />
          <Card
            elevation="md"
            style={{ marginBottom: theme.spacing.md, minHeight: 300 }}
          >
            <EmptyState
              icon="inbox"
              title="No Items"
              description="There are no items to display"
              actionLabel="Add Item"
              onActionPress={() => Alert.alert('Add Item')}
            />
          </Card>

          {/* Cards with Different Elevations */}
          <SectionHeader title="Card Elevations" icon="cards" />
          <Card elevation="none" style={{ marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text }}>No Elevation</Text>
          </Card>
          <Card elevation="sm" style={{ marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text }}>Small Elevation</Text>
          </Card>
          <Card elevation="base" style={{ marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text }}>Base Elevation</Text>
          </Card>
          <Card elevation="md" style={{ marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text }}>Medium Elevation</Text>
          </Card>
          <Card elevation="lg" style={{ marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text }}>Large Elevation</Text>
          </Card>
          <Card elevation="xl" style={{ marginBottom: theme.spacing.md }}>
            <Text style={{ color: theme.colors.text }}>XL Elevation</Text>
          </Card>

          {/* Loading Spinner */}
          {loading && <LoadingSpinner text="Loading..." />}
        </ScrollView>

        {/* Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={['50%', '90%']}
          title="Bottom Sheet Example"
          onClose={() => console.log('Sheet closed')}
        >
          <Text style={{ color: theme.colors.text, marginBottom: theme.spacing.md }}>
            This is a bottom sheet modal component.
          </Text>
          <Button
            title="Close"
            variant="outline"
            onPress={() => bottomSheetRef.current?.dismiss()}
          />
        </BottomSheet>
      </ScreenContainer>
    </ErrorBoundary>
  );
};

// Example Login Screen
export const ExampleLoginScreen = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Your login logic here
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer keyboardAware>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <Avatar
            icon="account-circle"
            size="xlarge"
            backgroundColor={theme.colors.primary}
          />
          <Text
            style={{
              ...theme.typography.h3,
              color: theme.colors.text,
              marginTop: theme.spacing.md,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              ...theme.typography.body,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.xs,
            }}
          >
            Sign in to continue
          </Text>
        </View>

        <Card elevation="lg">
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            leftIcon="email"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            leftIcon="lock"
            error={errors.password}
            secureTextEntry
          />

          <Button
            title="Login"
            variant="primary"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            fullWidth
            icon="login"
            style={{ marginTop: theme.spacing.md }}
          />

          <Button
            title="Forgot Password?"
            variant="ghost"
            onPress={() => Alert.alert('Forgot Password')}
            fullWidth
            style={{ marginTop: theme.spacing.sm }}
          />
        </Card>

        <View style={{ alignItems: 'center', marginTop: theme.spacing.lg }}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Don't have an account?
          </Text>
          <Button
            title="Sign Up"
            variant="outline"
            onPress={() => Alert.alert('Sign Up')}
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};
