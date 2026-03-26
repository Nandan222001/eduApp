import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { useAppSelector } from '@store/hooks';

interface NavigationDebuggerProps {
  enabled?: boolean;
}

/**
 * Navigation Debugger Component
 * 
 * Displays current navigation state, auth status, and route information
 * Useful for debugging Expo Router navigation issues
 * 
 * Usage:
 * Add to your root layout with enabled prop based on __DEV__ flag
 * <NavigationDebugger enabled={__DEV__} />
 */
export const NavigationDebugger: React.FC<NavigationDebuggerProps> = ({ enabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, activeRole, user } = useAppSelector(state => state.auth);

  if (!enabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>
          🧭 Navigation Debug {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Information</Text>
            <InfoRow label="Pathname" value={pathname || 'N/A'} />
            <InfoRow label="Segments" value={JSON.stringify(segments)} />
            <InfoRow label="In Auth Group" value={segments[0] === '(auth)' ? 'Yes' : 'No'} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auth State</Text>
            <InfoRow label="Authenticated" value={isAuthenticated ? 'Yes' : 'No'} status={isAuthenticated ? 'success' : 'error'} />
            <InfoRow label="Loading" value={isLoading ? 'Yes' : 'No'} status={isLoading ? 'warning' : 'success'} />
            <InfoRow label="Active Role" value={activeRole || 'None'} />
            <InfoRow label="User Email" value={user?.email || 'N/A'} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/')}
            >
              <Text style={styles.buttonText}>Go to Root</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Console Logs</Text>
            <Text style={styles.infoText}>
              Check terminal/browser console for:
            </Text>
            <Text style={styles.logItem}>• "LAYOUT_LOADED_DEBUG"</Text>
            <Text style={styles.logItem}>• "[Navigation] useEffect triggered"</Text>
            <Text style={styles.logItem}>• Module resolution errors</Text>
            <Text style={styles.logItem}>• Circular dependency warnings</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  status?: 'success' | 'error' | 'warning';
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[styles.infoValue, status && { color: getStatusColor() }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
    maxHeight: '50%',
    zIndex: 9999,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    width: 120,
  },
  infoValue: {
    color: '#E5E7EB',
    fontSize: 12,
    flex: 1,
    fontFamily: 'monospace',
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 6,
  },
  logItem: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'monospace',
    marginLeft: 8,
    marginVertical: 2,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
