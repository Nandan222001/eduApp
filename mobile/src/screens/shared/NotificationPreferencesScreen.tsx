import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@rneui/themed';
import { apiClient } from '@api/client';
import { notificationService } from '@services/notificationService';
import { NotificationPreferences } from '@types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { MainStackScreenProps } from '@types';

type Props = MainStackScreenProps<'NotificationPreferences'>;

export const NotificationPreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    categories: {
      general: true,
      academic: true,
      attendance: true,
      exam: true,
      fee: true,
      event: true,
      assignment: true,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<NotificationPreferences>(
        '/api/v1/notifications/preferences'
      );
      setPreferences(response.data);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPreferences: NotificationPreferences) => {
    try {
      setSaving(true);
      await apiClient.put('/api/v1/notifications/preferences', updatedPreferences);

      if (updatedPreferences.pushEnabled) {
        const topics = Object.keys(updatedPreferences.categories)
          .filter((key) => updatedPreferences.categories[key as keyof typeof updatedPreferences.categories])
          .reduce((acc, key) => {
            acc[key as keyof typeof preferences.categories] = true;
            return acc;
          }, {} as Record<string, boolean>);

        await notificationService.subscribeToTopics({
          assignments: topics.assignment || false,
          grades: topics.academic || false,
          attendance: topics.attendance || false,
          announcements: topics.general || false,
        });
      }

      Alert.alert('Success', 'Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePushNotifications = async (value: boolean) => {
    if (value) {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings'
        );
        return;
      }
    }

    const updatedPreferences = { ...preferences, pushEnabled: value };
    setPreferences(updatedPreferences);
    await savePreferences(updatedPreferences);
  };

  const toggleCategory = async (category: keyof typeof preferences.categories) => {
    const updatedPreferences = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: !preferences.categories[category],
      },
    };
    setPreferences(updatedPreferences);
    await savePreferences(updatedPreferences);
  };

  const toggleChannel = async (channel: 'emailEnabled' | 'smsEnabled') => {
    const updatedPreferences = {
      ...preferences,
      [channel]: !preferences[channel],
    };
    setPreferences(updatedPreferences);
    await savePreferences(updatedPreferences);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="notifications"
              type="material"
              color={COLORS.primary}
              size={24}
              containerStyle={styles.icon}
            />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>Push Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications on this device
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.pushEnabled}
            onValueChange={togglePushNotifications}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="email"
              type="material"
              color={COLORS.primary}
              size={24}
              containerStyle={styles.icon}
            />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>Email Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications via email
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.emailEnabled}
            onValueChange={() => toggleChannel('emailEnabled')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="sms"
              type="material"
              color={COLORS.primary}
              size={24}
              containerStyle={styles.icon}
            />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>SMS Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications via SMS
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.smsEnabled}
            onValueChange={() => toggleChannel('smsEnabled')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Categories</Text>
        <Text style={styles.sectionDescription}>
          Choose which types of notifications you want to receive
        </Text>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="campaign"
              type="material"
              color={COLORS.info}
              size={24}
              containerStyle={styles.icon}
            />
            <Text style={styles.preferenceTitle}>General</Text>
          </View>
          <Switch
            value={preferences.categories.general}
            onValueChange={() => toggleCategory('general')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving || !preferences.pushEnabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="school"
              type="material"
              color={COLORS.primary}
              size={24}
              containerStyle={styles.icon}
            />
            <Text style={styles.preferenceTitle}>Academic</Text>
          </View>
          <Switch
            value={preferences.categories.academic}
            onValueChange={() => toggleCategory('academic')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving || !preferences.pushEnabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="assignment"
              type="material"
              color={COLORS.accent}
              size={24}
              containerStyle={styles.icon}
            />
            <Text style={styles.preferenceTitle}>Assignments</Text>
          </View>
          <Switch
            value={preferences.categories.assignment}
            onValueChange={() => toggleCategory('assignment')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving || !preferences.pushEnabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="event-available"
              type="material"
              color={COLORS.warning}
              size={24}
              containerStyle={styles.icon}
            />
            <Text style={styles.preferenceTitle}>Attendance</Text>
          </View>
          <Switch
            value={preferences.categories.attendance}
            onValueChange={() => toggleCategory('attendance')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving || !preferences.pushEnabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="grade"
              type="material"
              color={COLORS.success}
              size={24}
              containerStyle={styles.icon}
            />
            <Text style={styles.preferenceTitle}>Exams</Text>
          </View>
          <Switch
            value={preferences.categories.exam}
            onValueChange={() => toggleCategory('exam')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving || !preferences.pushEnabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="payment"
              type="material"
              color={COLORS.error}
              size={24}
              containerStyle={styles.icon}
            />
            <Text style={styles.preferenceTitle}>Fees</Text>
          </View>
          <Switch
            value={preferences.categories.fee}
            onValueChange={() => toggleCategory('fee')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving || !preferences.pushEnabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Icon
              name="event"
              type="material"
              color={COLORS.secondary}
              size={24}
              containerStyle={styles.icon}
            />
            <Text style={styles.preferenceTitle}>Events</Text>
          </View>
          <Switch
            value={preferences.categories.event}
            onValueChange={() => toggleCategory('event')}
            trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
            disabled={saving || !preferences.pushEnabled}
          />
        </View>
      </View>

      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: SPACING.md,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  preferenceDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  savingText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
