import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@rneui/themed';
import { StudentTabScreenProps } from '@types';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { Card, Input, Button } from '@components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, UpdateProfileRequest, ChangePasswordRequest } from '@api/profile';
import * as ImagePicker from 'expo-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';

type Props = StudentTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<Props> = () => {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await profileApi.getProfile();
      return response.data;
    },
  });

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (photoUri: string) => profileApi.uploadProfilePhoto(photoUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Success', 'Profile photo updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileApi.changePassword(data),
    onSuccess: () => {
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      Alert.alert('Success', 'Password changed successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to change password');
    },
  });

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera and photo library permissions are required to change profile photo.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImageWithCrop = async (fromCamera: boolean = false) => {
    try {
      const result = fromCamera
        ? await ImageCropPicker.openCamera({
            width: 400,
            height: 400,
            cropping: true,
            cropperCircleOverlay: true,
            compressImageQuality: 0.8,
          })
        : await ImageCropPicker.openPicker({
            width: 400,
            height: 400,
            cropping: true,
            cropperCircleOverlay: true,
            compressImageQuality: 0.8,
          });

      if (result && result.path) {
        uploadPhotoMutation.mutate(result.path);
      }
    } catch (error: any) {
      if (
        error.message !== 'User cancelled image selection' &&
        error.code !== 'E_PICKER_CANCELLED'
      ) {
        console.error('Image picker error:', error);
        pickImageWithExpo(fromCamera);
      }
    }
  };

  const pickImageWithExpo = async (fromCamera: boolean = false) => {
    try {
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        uploadPhotoMutation.mutate(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Expo image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSelectPhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert('Select Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => pickImageWithCrop(true),
      },
      {
        text: 'Choose from Library',
        onPress: () => pickImageWithCrop(false),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleUpdateProfile = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    changePasswordMutation.mutate(passwordData);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.profileCard}>
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handleSelectPhoto} style={styles.photoContainer}>
            {profile?.profilePhoto ? (
              <Image source={{ uri: profile.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {profile?.firstName?.[0]}
                  {profile?.lastName?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {profile?.studentId && <Text style={styles.studentId}>ID: {profile.studentId}</Text>}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text h4 style={styles.cardTitle}>
            Profile Information
          </Text>
          {!editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editMode ? (
          <>
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={text => setFormData({ ...formData, firstName: text })}
              error={errors.firstName}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={text => setFormData({ ...formData, lastName: text })}
              error={errors.lastName}
              placeholder="Enter last name"
            />
            <Input
              label="Email"
              value={formData.email}
              onChangeText={text => setFormData({ ...formData, email: text })}
              error={errors.email}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChangeText={text => setFormData({ ...formData, phone: text })}
              error={errors.phone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            <Input
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChangeText={text => setFormData({ ...formData, dateOfBirth: text })}
              error={errors.dateOfBirth}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.buttonGroup}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setEditMode(false);
                  setErrors({});
                  if (profile) {
                    setFormData({
                      firstName: profile.firstName || '',
                      lastName: profile.lastName || '',
                      email: profile.email || '',
                      phone: profile.phone || '',
                      dateOfBirth: profile.dateOfBirth || '',
                    });
                  }
                }}
                style={styles.button}
              />
              <Button
                title="Save"
                onPress={handleUpdateProfile}
                loading={updateProfileMutation.isPending}
                style={styles.button}
              />
            </View>
          </>
        ) : (
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>First Name:</Text>
              <Text style={styles.infoValue}>{profile?.firstName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Name:</Text>
              <Text style={styles.infoValue}>{profile?.lastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
            {profile?.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
            )}
            {profile?.dateOfBirth && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date of Birth:</Text>
                <Text style={styles.infoValue}>{profile.dateOfBirth}</Text>
              </View>
            )}
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text h4 style={styles.cardTitle}>
            Security
          </Text>
        </View>

        {!showPasswordForm ? (
          <Button
            title="Change Password"
            variant="outline"
            onPress={() => setShowPasswordForm(true)}
            fullWidth
          />
        ) : (
          <>
            <Input
              label="Current Password"
              value={passwordData.currentPassword}
              onChangeText={text => setPasswordData({ ...passwordData, currentPassword: text })}
              error={errors.currentPassword}
              placeholder="Enter current password"
              secureTextEntry
            />
            <Input
              label="New Password"
              value={passwordData.newPassword}
              onChangeText={text => setPasswordData({ ...passwordData, newPassword: text })}
              error={errors.newPassword}
              placeholder="Enter new password"
              secureTextEntry
            />
            <Input
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChangeText={text => setPasswordData({ ...passwordData, confirmPassword: text })}
              error={errors.confirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
            />

            <View style={styles.buttonGroup}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setErrors({});
                }}
                style={styles.button}
              />
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                loading={changePasswordMutation.isPending}
                style={styles.button}
              />
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  profileCard: {
    marginBottom: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.background,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cameraIconText: {
    fontSize: 20,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  studentId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  editButton: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  infoSection: {
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
  },
});
