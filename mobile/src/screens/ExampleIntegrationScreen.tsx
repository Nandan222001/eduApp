import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppDispatch, useAppSelector, useOfflineQueue } from '@store/hooks';
import { fetchDashboardData } from '@store/slices/dashboardSlice';
import { fetchAssignments } from '@store/slices/assignmentsSlice';
import { fetchGrades } from '@store/slices/gradesSlice';
import { fetchProfile } from '@store/slices/profileSlice';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { CachedDataBanner } from '../components/CachedDataBanner';
import { SyncStatus } from '../components/SyncStatus';
import { backgroundSyncService } from '../utils/backgroundSync';

export const ExampleIntegrationScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isConnected, queueCount, processQueue } = useOfflineQueue();
  const [lastSync, setLastSync] = useState<number | null>(null);

  const dashboard = useAppSelector((state) => state.dashboard);
  const assignments = useAppSelector((state) => state.assignments);
  const grades = useAppSelector((state) => state.grades);
  const profile = useAppSelector((state) => state.profile);

  useEffect(() => {
    loadLastSyncTime();
  }, []);

  const loadLastSyncTime = async () => {
    const timestamp = await backgroundSyncService.getLastSyncTimestamp();
    setLastSync(timestamp);
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        dispatch(fetchDashboardData()).unwrap(),
        dispatch(fetchAssignments(undefined)).unwrap(),
        dispatch(fetchGrades(undefined)).unwrap(),
        dispatch(fetchProfile()).unwrap(),
      ]);
      Alert.alert('Success', 'All data refreshed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data. Check your connection.');
    }
  };

  const handleManualSync = async () => {
    try {
      await processQueue();
      await backgroundSyncService.triggerManualSync();
      await loadLastSyncTime();
      Alert.alert('Success', 'Manual sync completed');
    } catch (error) {
      Alert.alert('Error', 'Sync failed');
    }
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      <View style={styles.header}>
        <Text style={styles.title}>Offline-First Example</Text>
        <SyncStatus />
      </View>

      <CachedDataBanner
        lastUpdated={Math.max(
          dashboard.lastUpdated || 0,
          assignments.lastUpdated || 0,
          grades.lastUpdated || 0,
          profile.lastUpdated || 0
        )}
        onRefresh={handleRefreshAll}
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Network:</Text>
              <Text style={[styles.value, isConnected ? styles.online : styles.offline]}>
                {isConnected ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Pending Requests:</Text>
              <Text style={styles.value}>{queueCount}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Last Sync:</Text>
              <Text style={styles.value}>{formatTimestamp(lastSync)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cached Data Status</Text>
          
          <View style={styles.dataCard}>
            <Text style={styles.dataTitle}>Dashboard</Text>
            <Text style={styles.dataStatus}>
              {dashboard.stats ? '✓ Cached' : '✗ Not Cached'}
            </Text>
            {dashboard.lastUpdated && (
              <Text style={styles.dataTimestamp}>
                Updated: {formatTimestamp(dashboard.lastUpdated)}
              </Text>
            )}
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataTitle}>Assignments</Text>
            <Text style={styles.dataStatus}>
              {assignments.assignments.length > 0 ? `✓ ${assignments.assignments.length} items` : '✗ Not Cached'}
            </Text>
            {assignments.lastUpdated && (
              <Text style={styles.dataTimestamp}>
                Updated: {formatTimestamp(assignments.lastUpdated)}
              </Text>
            )}
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataTitle}>Grades</Text>
            <Text style={styles.dataStatus}>
              {grades.grades.length > 0 ? `✓ ${grades.grades.length} items` : '✗ Not Cached'}
            </Text>
            {grades.lastUpdated && (
              <Text style={styles.dataTimestamp}>
                Updated: {formatTimestamp(grades.lastUpdated)}
              </Text>
            )}
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataTitle}>Profile</Text>
            <Text style={styles.dataStatus}>
              {profile.profile ? '✓ Cached' : '✗ Not Cached'}
            </Text>
            {profile.lastUpdated && (
              <Text style={styles.dataTimestamp}>
                Updated: {formatTimestamp(profile.lastUpdated)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleRefreshAll}
            disabled={!isConnected}
          >
            <Text style={styles.buttonText}>Refresh All Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.syncButton]}
            onPress={handleManualSync}
            disabled={!isConnected || queueCount === 0}
          >
            <Text style={styles.buttonText}>Process Queue ({queueCount})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>✓ Redux Persist</Text>
            <Text style={styles.featureDescription}>
              All state automatically persisted to AsyncStorage
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>✓ Offline Queue</Text>
            <Text style={styles.featureDescription}>
              Failed requests queued and retried when online
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>✓ Background Sync</Text>
            <Text style={styles.featureDescription}>
              Automatic sync every 15 minutes in background
            </Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>✓ Network Monitoring</Text>
            <Text style={styles.featureDescription}>
              Real-time connection status tracking
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  label: {
    fontSize: 16,
    color: '#6C757D',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  online: {
    color: '#28A745',
  },
  offline: {
    color: '#DC3545',
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  dataStatus: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  dataTimestamp: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  syncButton: {
    backgroundColor: '#28A745',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
});
