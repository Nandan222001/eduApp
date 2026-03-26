/**
 * Deep Linking Usage Example Component
 * Demonstrates how to use deep linking utilities in screens
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  shareAssignment,
  copyAssignmentLink,
  createNotificationDeepLink,
  extractDeepLinkTracking,
  logDeepLinkNavigation,
  sanitizeDeepLinkId,
} from '@utils';

/**
 * Example: Assignment Detail Screen with Deep Linking
 * 
 * This component demonstrates:
 * 1. How to handle deep link parameters in a screen
 * 2. How to share content via deep links
 * 3. How to track deep link navigation
 * 4. How to create deep links for notifications
 */
export const DeepLinkingExample: React.FC = () => {
  const params = useLocalSearchParams();

  // Extract and sanitize the ID from route parameters
  const assignmentId = sanitizeDeepLinkId(params.id);

  // Extract tracking information from deep link
  const tracking = extractDeepLinkTracking(params);

  React.useEffect(() => {
    if (assignmentId) {
      // Log the deep link navigation for analytics
      logDeepLinkNavigation(
        `/assignments/${assignmentId}`,
        params as Record<string, any>,
        'current-user-id' // Replace with actual user ID
      );
    }
  }, [assignmentId, params]);

  // Handle sharing the assignment
  const handleShare = async () => {
    if (!assignmentId) return;

    try {
      await shareAssignment(assignmentId, 'Math Homework - Chapter 5');
      Alert.alert('Success', 'Assignment link shared!');
    } catch (error) {
      Alert.alert('Error', 'Failed to share assignment');
    }
  };

  // Handle copying the assignment link
  const handleCopyLink = async () => {
    if (!assignmentId) return;

    try {
      await copyAssignmentLink(assignmentId);
      Alert.alert('Success', 'Link copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  // Create a notification deep link
  const handleCreateNotificationLink = () => {
    if (!assignmentId) return;

    const notificationLink = createNotificationDeepLink(
      'assignment',
      assignmentId,
      { priority: 'high' }
    );

    console.log('Notification deep link:', notificationLink);
    Alert.alert(
      'Notification Link Created',
      `Link: ${notificationLink}`,
      [
        {
          text: 'Copy',
          onPress: () => copyAssignmentLink(assignmentId),
        },
        { text: 'OK' },
      ]
    );
  };

  if (!assignmentId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid assignment ID</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deep Linking Example</Text>
      
      <View style={styles.infoSection}>
        <Text style={styles.label}>Assignment ID:</Text>
        <Text style={styles.value}>{assignmentId}</Text>
      </View>

      {tracking.source && (
        <View style={styles.infoSection}>
          <Text style={styles.label}>Source:</Text>
          <Text style={styles.value}>{tracking.source}</Text>
        </View>
      )}

      {tracking.utm_campaign && (
        <View style={styles.infoSection}>
          <Text style={styles.label}>Campaign:</Text>
          <Text style={styles.value}>{tracking.utm_campaign}</Text>
        </View>
      )}

      {params.priority && (
        <View style={styles.infoSection}>
          <Text style={styles.label}>Priority:</Text>
          <Text style={styles.value}>{params.priority as string}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleShare}>
          <Text style={styles.buttonText}>Share Assignment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleCopyLink}>
          <Text style={styles.buttonText}>Copy Link</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleCreateNotificationLink}
        >
          <Text style={styles.buttonText}>Create Notification Link</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>
          {JSON.stringify({ assignmentId, ...tracking, ...params }, null, 2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
});

/**
 * Usage in app/assignments/[id].tsx:
 * 
 * import { DeepLinkingExample } from '@components/DeepLinkingExample';
 * 
 * export default function AssignmentDetailScreen() {
 *   return <DeepLinkingExample />;
 * }
 * 
 * Test URLs:
 * - edutrack://assignments/123
 * - edutrack://assignments/123?source=notification&priority=high
 * - https://edutrack.app/assignments/123?utm_source=email&utm_campaign=reminder
 */
