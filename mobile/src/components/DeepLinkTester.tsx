/**
 * Deep Link Tester Component
 * Interactive UI for testing deep linking functionality
 * 
 * Usage: Add this to a debug/settings screen during development
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  parseDeepLink,
  createDeepLink,
  createWebLink,
  isValidDeepLink,
  normalizeDeepLink,
  deepLinkRoutes,
  shareAssignment,
  copyAssignmentLink,
} from '@utils';

export const DeepLinkTester: React.FC = () => {
  const router = useRouter();
  const [customUrl, setCustomUrl] = useState('edutrack://assignments/123');
  const [testResult, setTestResult] = useState<string>('');

  const testDeepLink = (url: string) => {
    try {
      const isValid = isValidDeepLink(url);
      const normalized = normalizeDeepLink(url);
      const parsed = parseDeepLink(normalized);

      const result = {
        original: url,
        isValid,
        normalized,
        parsed,
      };

      setTestResult(JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`Error: ${errorMsg}`);
      return null;
    }
  };

  const navigateToUrl = (url: string) => {
    const result = testDeepLink(url);
    if (result?.parsed) {
      try {
        router.push(result.parsed.path as any);
        Alert.alert('Success', `Navigated to: ${result.parsed.path}`);
      } catch (error) {
        Alert.alert('Navigation Error', 'Failed to navigate to the route');
      }
    } else {
      Alert.alert('Invalid URL', 'Cannot navigate to invalid deep link');
    }
  };

  const quickTests = [
    {
      name: 'Assignment #123',
      url: createDeepLink(deepLinkRoutes.assignments('123')),
    },
    {
      name: 'Course #456',
      url: createDeepLink(deepLinkRoutes.courses('456')),
    },
    {
      name: 'Child Profile #789',
      url: createDeepLink(deepLinkRoutes.children('789')),
    },
    {
      name: 'Message #101',
      url: createDeepLink(deepLinkRoutes.messages('101')),
    },
    {
      name: 'Notification #202',
      url: createDeepLink(deepLinkRoutes.notifications('202')),
    },
    {
      name: 'Profile',
      url: createDeepLink(deepLinkRoutes.profile()),
    },
    {
      name: 'Settings',
      url: createDeepLink(deepLinkRoutes.settings()),
    },
    {
      name: 'Assignment w/ Params',
      url: createDeepLink(deepLinkRoutes.assignments('123'), {
        source: 'notification',
        priority: 'high',
      }),
    },
    {
      name: 'Web Link',
      url: createWebLink(deepLinkRoutes.assignments('123')),
    },
    {
      name: 'Web Link w/ UTM',
      url: createWebLink(deepLinkRoutes.assignments('123'), {
        utm_source: 'email',
        utm_campaign: 'test',
      }),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Deep Link Tester</Text>
      <Text style={styles.subtitle}>
        Test deep linking functionality interactively
      </Text>

      {/* Custom URL Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom URL Test</Text>
        <TextInput
          style={styles.input}
          value={customUrl}
          onChangeText={setCustomUrl}
          placeholder="Enter deep link URL"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => testDeepLink(customUrl)}
          >
            <Text style={styles.buttonText}>Test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSuccess]}
            onPress={() => navigateToUrl(customUrl)}
          >
            <Text style={styles.buttonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Result */}
      {testResult ? (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Test Result</Text>
          <ScrollView horizontal style={styles.resultScroll}>
            <Text style={styles.resultText}>{testResult}</Text>
          </ScrollView>
        </View>
      ) : null}

      {/* Quick Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Tests</Text>
        {quickTests.map((test, index) => (
          <View key={index} style={styles.quickTestItem}>
            <Text style={styles.quickTestName}>{test.name}</Text>
            <Text style={styles.quickTestUrl} numberOfLines={1}>
              {test.url}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSmall]}
                onPress={() => testDeepLink(test.url)}
              >
                <Text style={styles.buttonText}>Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSmall, styles.buttonSuccess]}
                onPress={() => navigateToUrl(test.url)}
              >
                <Text style={styles.buttonText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Utility Functions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Utility Functions Test</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={async () => {
            try {
              await shareAssignment('test-123', 'Test Assignment');
              Alert.alert('Success', 'Share dialog opened');
            } catch (error) {
              Alert.alert('Error', 'Share failed');
            }
          }}
        >
          <Text style={styles.buttonText}>Test Share Assignment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={async () => {
            try {
              await copyAssignmentLink('test-123');
              Alert.alert('Success', 'Link copied to clipboard');
            } catch (error) {
              Alert.alert('Error', 'Copy failed');
            }
          }}
        >
          <Text style={styles.buttonText}>Test Copy Link</Text>
        </TouchableOpacity>
      </View>

      {/* Platform Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Platform Info</Text>
        <Text style={styles.infoText}>OS: {Platform.OS}</Text>
        <Text style={styles.infoText}>Version: {Platform.Version}</Text>
        <Text style={styles.infoText}>
          Scheme: edutrack://
        </Text>
        <Text style={styles.infoText}>
          Web Prefix: https://edutrack.app
        </Text>
      </View>

      {/* Testing Instructions */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>External Testing</Text>
        <Text style={styles.infoText}>
          iOS Simulator:
        </Text>
        <Text style={styles.codeText}>
          xcrun simctl openurl booted edutrack://assignments/123
        </Text>
        <Text style={styles.infoText}>
          Android Emulator:
        </Text>
        <Text style={styles.codeText}>
          adb shell am start -W -a android.intent.action.VIEW -d
          "edutrack://assignments/123" com.edutrack.app
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonSmall: {
    flex: 1,
    padding: 8,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSuccess: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultScroll: {
    maxHeight: 200,
  },
  resultText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
  quickTestItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  quickTestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  quickTestUrl: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  infoSection: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 8,
  },
});

/**
 * Usage:
 * 
 * Add to a debug/settings screen:
 * 
 * import { DeepLinkTester } from '@components/DeepLinkTester';
 * 
 * export default function DebugScreen() {
 *   return <DeepLinkTester />;
 * }
 */
