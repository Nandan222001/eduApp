# Offline-First Migration Guide

This guide helps you integrate offline-first capabilities into your existing screens and components.

## Step 1: Install Dependencies

```bash
npm install
```

Dependencies are already added to `package.json`.

## Step 2: Update Existing Screens

### Before: Simple Data Fetching Screen

```typescript
// Old implementation
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { studentApi } from '@api/student';

export const DashboardScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await studentApi.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <Text>Dashboard</Text>
      {/* Render data */}
    </View>
  );
};
```

### After: Offline-First Implementation

```typescript
// New implementation with offline support
import React, { useEffect } from 'react';
import { View, Text, RefreshControl, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchDashboard } from '@store/slices/studentDataSlice';
import { ScreenLayout, CachedDataBadge, SyncButton } from '@components';
import { useNetworkStatus } from '@hooks';
import { shouldRefreshData } from '@utils/optimisticUpdates';

export const DashboardScreen = () => {
  const dispatch = useAppDispatch();
  const { isConnected } = useNetworkStatus();
  const { dashboard, dashboardLastSync, isLoading } = useAppSelector(
    state => state.studentData
  );
  const [refreshing, setRefreshing] = React.useState(false);

  // Auto-fetch if data is stale and we're online
  useEffect(() => {
    if (isConnected && shouldRefreshData(dashboardLastSync)) {
      dispatch(fetchDashboard());
    }
  }, [isConnected, dashboardLastSync, dispatch]);

  const onRefresh = async () => {
    if (!isConnected) return;
    setRefreshing(true);
    await dispatch(fetchDashboard());
    setRefreshing(false);
  };

  return (
    <ScreenLayout showOfflineIndicator={true}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={isConnected}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <CachedDataBadge lastSyncTime={dashboardLastSync} isOnline={isConnected} />
        </View>

        {/* Render cached data - always available! */}
        {dashboard && (
          <View>
            {/* Render dashboard data */}
          </View>
        )}

        {isLoading && <ActivityIndicator />}
      </ScrollView>
    </ScreenLayout>
  );
};
```

## Step 3: Update Form Submissions

### Before: Simple Form Submission

```typescript
// Old implementation
const handleSubmit = async (formData) => {
  try {
    setSubmitting(true);
    await assignmentsApi.submitAssignment(formData);
    Alert.alert('Success', 'Assignment submitted!');
    navigation.goBack();
  } catch (error) {
    Alert.alert('Error', 'Failed to submit assignment');
  } finally {
    setSubmitting(false);
  }
};
```

### After: Offline-Aware Submission

```typescript
// New implementation with offline queue
import { useOptimisticUpdate } from '@hooks';

const MyFormScreen = () => {
  const { submitAssignment, isOnline } = useOptimisticUpdate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await submitAssignment(assignmentId, formData);
      
      Alert.alert(
        'Success',
        isOnline 
          ? 'Assignment submitted successfully!' 
          : 'Assignment queued. Will sync when online.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      {/* Form fields */}
      <Button onPress={handleSubmit} disabled={submitting} title="Submit" />
      {!isOnline && (
        <Text style={styles.offlineWarning}>
          Offline - Submission will be queued
        </Text>
      )}
    </View>
  );
};
```

## Step 4: Add Offline Indicators to Navigation

### Tab Navigator with Queue Badge

```typescript
import { useOfflineQueue } from '@hooks';
import { Badge } from '@rneui/themed';

const TabNavigator = () => {
  const { queueSize } = useOfflineQueue();

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="settings" size={size} color={color} />
              {queueSize > 0 && (
                <Badge
                  value={queueSize}
                  status="error"
                  containerStyle={{ position: 'absolute', top: -4, right: -4 }}
                />
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
```

## Step 5: Update Profile/Settings Screens

### Add Offline Settings Section

```typescript
import React from 'react';
import { View, Switch, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setAutoSyncEnabled } from '@store/slices/offlineSlice';
import { OfflineQueueStatus, SyncButton } from '@components';

export const SettingsScreen = () => {
  const dispatch = useAppDispatch();
  const autoSyncEnabled = useAppSelector(state => state.offline.autoSyncEnabled);

  return (
    <ScrollView>
      {/* Existing settings */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Mode</Text>
        
        <View style={styles.settingRow}>
          <Text>Auto Sync</Text>
          <Switch
            value={autoSyncEnabled}
            onValueChange={value => dispatch(setAutoSyncEnabled(value))}
          />
        </View>

        <OfflineQueueStatus showDetails={true} />
        
        <SyncButton variant="button" />
      </View>
    </ScrollView>
  );
};
```

## Step 6: Migrate API Calls to Redux Thunks

### Before: Direct API Calls

```typescript
const [assignments, setAssignments] = useState([]);

useEffect(() => {
  const loadAssignments = async () => {
    const response = await studentApi.getAssignments();
    setAssignments(response.data);
  };
  loadAssignments();
}, []);
```

### After: Redux Thunks with Caching

```typescript
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchAssignments } from '@store/slices/studentDataSlice';

const MyScreen = () => {
  const dispatch = useAppDispatch();
  const { assignments, assignmentsLastSync } = useAppSelector(
    state => state.studentData
  );

  useEffect(() => {
    // Only fetch if data is stale
    if (shouldRefreshData(assignmentsLastSync)) {
      dispatch(fetchAssignments());
    }
  }, [dispatch, assignmentsLastSync]);

  // assignments is always available from cache!
  return <AssignmentList data={assignments} />;
};
```

## Step 7: Handle Logout Properly

### Clear Offline Data on Logout

```typescript
import { clearAllData } from '@store/slices/studentDataSlice';
import { clearQueue } from '@store/slices/offlineSlice';
import { offlineQueueManager } from '@utils/offlineQueue';

const handleLogout = async () => {
  // Clear sensitive cached data
  dispatch(clearAllData());
  
  // Clear offline queue
  await offlineQueueManager.clearQueue();
  dispatch(clearQueue());
  
  // Proceed with normal logout
  dispatch(logout());
};
```

## Migration Checklist

### Required Changes
- [ ] Update `package.json` dependencies (already done)
- [ ] Initialize offline support in `app/_layout.tsx` (already done)
- [ ] Update Redux store configuration (already done)

### Screen Updates
- [ ] Replace local state with Redux cached data
- [ ] Add `OfflineIndicator` to main screens
- [ ] Add `CachedDataBadge` to show data age
- [ ] Implement pull-to-refresh using cached data
- [ ] Use `ScreenLayout` wrapper for consistency

### Form Updates
- [ ] Replace direct API calls with `useOptimisticUpdate`
- [ ] Add offline queue messaging
- [ ] Handle offline submissions gracefully

### Navigation Updates
- [ ] Add queue badges to relevant tabs
- [ ] Update settings screen with offline controls

### Testing
- [ ] Test all screens in offline mode
- [ ] Verify data caching works
- [ ] Test queue functionality
- [ ] Verify background sync (on device)
- [ ] Test optimistic updates

## Common Patterns

### Pattern 1: List Screen with Cached Data

```typescript
const { data, dataLastSync, isLoading } = useAppSelector(state => state.studentData);
const { isConnected } = useNetworkStatus();

useEffect(() => {
  if (isConnected && shouldRefreshData(dataLastSync, 10)) {
    dispatch(fetchData());
  }
}, [isConnected, dataLastSync]);
```

### Pattern 2: Detail Screen with Optimistic Update

```typescript
const { updateItem, isOnline } = useOptimisticUpdate();

const handleUpdate = async (updates) => {
  await updateItem(updates);
  Alert.alert('Success', isOnline ? 'Updated!' : 'Queued for sync');
};
```

### Pattern 3: Settings with Sync Controls

```typescript
<OfflineIndicator />
<OfflineQueueStatus showDetails={true} />
<SyncButton variant="button" />
```

## Breaking Changes

None! The offline implementation is additive and doesn't break existing functionality.

## Performance Improvements

- ✅ Instant UI updates (optimistic)
- ✅ Reduced API calls (caching)
- ✅ Works offline
- ✅ Background sync
- ✅ Better perceived performance

## Support

For detailed documentation, see:
- `OFFLINE_ARCHITECTURE.md` - Complete technical details
- `OFFLINE_QUICK_START.md` - Quick reference guide
- `OFFLINE_INTEGRATION_EXAMPLE.md` - Code examples

## Rollback Plan

If needed, you can disable offline features:

1. Remove offline components from screens
2. Use direct API calls instead of Redux thunks
3. Keep using cached data is optional
4. Background sync is opt-in

The implementation is modular and doesn't force offline behavior.
