import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, STORAGE_KEYS } from '@constants';
import { Card, Button } from '@components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@api/client';
import { useDispatch } from 'react-redux';
import { logout } from '@store/slices/authSlice';
import { AppDispatch } from '@store/store';
import { storage } from '@utils/storage';
import Constants from 'expo-constants';

interface NotificationPreferences {
  assignments: boolean;
  grades: boolean;
  attendance: boolean;
  announcements: boolean;
  messages: boolean;
  reminders: boolean;
}

interface NotificationPreferencesResponse {
  preferences: NotificationPreferences;
}

type Theme = 'light' | 'dark' | 'auto';
type Language = 'en' | 'es' | 'fr' | 'de';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

export const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<Theme>('auto');
  const [language, setLanguage] = useState<Language>('en');

  const { data: notificationPreferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const response = await apiClient.get<NotificationPreferencesResponse>(
        '/api/v1/notifications/preferences'
      );
      return response.data.preferences;
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      apiClient.put('/api/v1/notifications/preferences', { preferences }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update preferences');
    },
  });

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedTheme = await storage.getItem(STORAGE_KEYS.THEME);
    const savedLanguage = await storage.getItem(STORAGE_KEYS.LANGUAGE);

    if (savedTheme) setTheme(savedTheme as Theme);
    if (savedLanguage) setLanguage(savedLanguage as Language);
  };

  const handleToggleNotification = (key: keyof NotificationPreferences) => {
    if (!notificationPreferences) return;

    const updatedPreferences = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };

    updatePreferencesMutation.mutate({ [key]: updatedPreferences[key] });
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    await storage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    setLanguage(newLanguage);
    await storage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logout());
        },
      },
    ]);
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://your-app.com/privacy-policy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://your-app.com/terms-of-service');
  };

  const handleOpenHelp = () => {
    Linking.openURL('https://your-app.com/help');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@your-app.com');
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Text h4 style={styles.sectionTitle}>
          Notifications
        </Text>
        <Text style={styles.sectionDescription}>
          Choose which notifications you want to receive
        </Text>

        {isLoading ? (
          <Text style={styles.loadingText}>Loading preferences...</Text>
        ) : (
          <View style={styles.notificationList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Assignments</Text>
                <Text style={styles.settingDescription}>
                  New assignments and due date reminders
                </Text>
              </View>
              <Switch
                value={notificationPreferences?.assignments ?? true}
                onValueChange={() => handleToggleNotification('assignments')}
                trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Grades</Text>
                <Text style={styles.settingDescription}>New grades and feedback</Text>
              </View>
              <Switch
                value={notificationPreferences?.grades ?? true}
                onValueChange={() => handleToggleNotification('grades')}
                trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Attendance</Text>
                <Text style={styles.settingDescription}>Attendance updates and alerts</Text>
              </View>
              <Switch
                value={notificationPreferences?.attendance ?? true}
                onValueChange={() => handleToggleNotification('attendance')}
                trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Announcements</Text>
                <Text style={styles.settingDescription}>Important school announcements</Text>
              </View>
              <Switch
                value={notificationPreferences?.announcements ?? true}
                onValueChange={() => handleToggleNotification('announcements')}
                trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Messages</Text>
                <Text style={styles.settingDescription}>Direct messages from teachers</Text>
              </View>
              <Switch
                value={notificationPreferences?.messages ?? true}
                onValueChange={() => handleToggleNotification('messages')}
                trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Reminders</Text>
                <Text style={styles.settingDescription}>Study reminders and tasks</Text>
              </View>
              <Switch
                value={notificationPreferences?.reminders ?? true}
                onValueChange={() => handleToggleNotification('reminders')}
                trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text h4 style={styles.sectionTitle}>
          Appearance
        </Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Theme</Text>
        </View>
        <View style={styles.optionsContainer}>
          {THEME_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, theme === option.value && styles.optionButtonActive]}
              onPress={() => handleThemeChange(option.value)}
            >
              <Text style={[styles.optionText, theme === option.value && styles.optionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text h4 style={styles.sectionTitle}>
          Language
        </Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Select Language</Text>
        </View>
        <View style={styles.optionsContainer}>
          {LANGUAGE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, language === option.value && styles.optionButtonActive]}
              onPress={() => handleLanguageChange(option.value)}
            >
              <Text
                style={[styles.optionText, language === option.value && styles.optionTextActive]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text h4 style={styles.sectionTitle}>
          Privacy & Legal
        </Text>

        <TouchableOpacity style={styles.linkItem} onPress={handleOpenPrivacyPolicy}>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleOpenTerms}>
          <Text style={styles.linkText}>Terms of Service</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <Text h4 style={styles.sectionTitle}>
          Help & Support
        </Text>

        <TouchableOpacity style={styles.linkItem} onPress={handleOpenHelp}>
          <Text style={styles.linkText}>Help Center</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkItem} onPress={handleContactSupport}>
          <Text style={styles.linkText}>Contact Support</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <Text h4 style={styles.sectionTitle}>
          About
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>{appVersion}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Build Number</Text>
          <Text style={styles.infoValue}>{buildNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>{Platform.OS}</Text>
        </View>
      </Card>

      <Button
        title="Logout"
        variant="outline"
        onPress={handleLogout}
        fullWidth
        style={styles.logoutButton}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 EDU Mobile. All rights reserved.</Text>
      </View>
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
  card: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  notificationList: {
    gap: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextActive: {
    color: COLORS.background,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  chevron: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
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
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  logoutButton: {
    marginBottom: SPACING.lg,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
