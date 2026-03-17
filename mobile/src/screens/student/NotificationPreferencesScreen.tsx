import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  subscribeToTopic,
  unsubscribeFromTopic,
  type NotificationPreferences,
  type NotificationTopic,
} from '../../services/notificationService';

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await saveNotificationPreferences(preferences);
      Alert.alert('Success', 'Notification preferences saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTopicToggle = async (topic: NotificationTopic, enabled: boolean) => {
    if (!preferences) return;

    setPreferences({ ...preferences, [topic]: enabled });

    try {
      if (enabled) {
        await subscribeToTopic(topic);
      } else {
        await unsubscribeFromTopic(topic);
      }
    } catch (error) {
      console.error(`Failed to ${enabled ? 'subscribe to' : 'unsubscribe from'} ${topic}`);
      setPreferences({ ...preferences, [topic]: !enabled });
    }
  };

  const handleChannelToggle = (channel: keyof NotificationPreferences, enabled: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [channel]: enabled });
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, quietHoursEnabled: enabled });
  };

  const handleTimeChange = (type: 'start' | 'end', selectedTime: Date) => {
    if (!preferences) return;

    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    if (type === 'start') {
      setPreferences({ ...preferences, quietHoursStart: timeString });
      setShowStartTimePicker(false);
    } else {
      setPreferences({ ...preferences, quietHoursEnd: timeString });
      setShowEndTimePicker(false);
    }
  };

  const parseTime = (timeString?: string): Date => {
    const now = new Date();
    if (!timeString) return now;

    const [hours, minutes] = timeString.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
    return now;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load preferences</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          <Text style={styles.sectionDescription}>
            Choose how you want to receive notifications
          </Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Push Notifications</Text>
              <Text style={styles.preferenceDescription}>Receive notifications on this device</Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={value => handleChannelToggle('pushEnabled', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.pushEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Email Notifications</Text>
              <Text style={styles.preferenceDescription}>Receive notifications via email</Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={value => handleChannelToggle('emailEnabled', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.emailEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>SMS Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications via text message
              </Text>
            </View>
            <Switch
              value={preferences.smsEnabled}
              onValueChange={value => handleChannelToggle('smsEnabled', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.smsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>In-App Notifications</Text>
              <Text style={styles.preferenceDescription}>Show notifications within the app</Text>
            </View>
            <Switch
              value={preferences.inAppEnabled}
              onValueChange={value => handleChannelToggle('inAppEnabled', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.inAppEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionDescription}>
            Choose which types of notifications you want to receive
          </Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Assignments</Text>
              <Text style={styles.preferenceDescription}>
                New assignments and due date reminders
              </Text>
            </View>
            <Switch
              value={preferences.assignments}
              onValueChange={value => handleTopicToggle('assignments', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.assignments ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Grades</Text>
              <Text style={styles.preferenceDescription}>Grade updates and report cards</Text>
            </View>
            <Switch
              value={preferences.grades}
              onValueChange={value => handleTopicToggle('grades', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.grades ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Attendance</Text>
              <Text style={styles.preferenceDescription}>Attendance records and notifications</Text>
            </View>
            <Switch
              value={preferences.attendance}
              onValueChange={value => handleTopicToggle('attendance', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.attendance ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Announcements</Text>
              <Text style={styles.preferenceDescription}>School announcements and updates</Text>
            </View>
            <Switch
              value={preferences.announcements}
              onValueChange={value => handleTopicToggle('announcements', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.announcements ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            Don't receive notifications during specified hours
          </Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceLabel}>Enable Quiet Hours</Text>
            </View>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={handleQuietHoursToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={preferences.quietHoursEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          {preferences.quietHoursEnabled && (
            <>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timePickerLabel}>Start Time</Text>
                <Text style={styles.timePickerValue}>{preferences.quietHoursStart || '22:00'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timePickerLabel}>End Time</Text>
                <Text style={styles.timePickerValue}>{preferences.quietHoursEnd || '07:00'}</Text>
              </TouchableOpacity>

              {showStartTimePicker && (
                <DateTimePicker
                  value={parseTime(preferences.quietHoursStart)}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (event.type === 'dismissed') {
                      setShowStartTimePicker(false);
                    } else if (selectedDate) {
                      handleTimeChange('start', selectedDate);
                    }
                  }}
                />
              )}

              {showEndTimePicker && (
                <DateTimePicker
                  value={parseTime(preferences.quietHoursEnd)}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (event.type === 'dismissed') {
                      setShowEndTimePicker(false);
                    } else if (selectedDate) {
                      handleTimeChange('end', selectedDate);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceText: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#666',
  },
  timePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  timePickerValue: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
