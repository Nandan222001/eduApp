# Offline-First Integration Examples

## Example 1: Student Dashboard with Offline Support

```typescript
import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchDashboard } from '@store/slices/studentDataSlice';
import { ScreenLayout, CachedDataBadge, SyncButton } from '@components';
import { useNetworkStatus } from '@hooks';
import { shouldRefreshData } from '@utils/optimisticUpdates';

export const StudentDashboardScreen = () => {
  const dispatch = useAppDispatch();
  const { isConnected } = useNetworkStatus();
  const { dashboard, dashboardLastSync, isLoading } = useAppSelector(
    state => state.studentData
  );
  const [refreshing, setRefreshing] = React.useState(false);

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
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={isConnected}
          />
        }
      >
        <View style={styles.header}>
          <CachedDataBadge lastSyncTime={dashboardLastSync} isOnline={isConnected} />
          {isConnected && <SyncButton variant="icon" />}
        </View>

        {/* Dashboard content using cached data */}
        {dashboard && (
          <View>
            {/* Render dashboard data */}
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
});
```

## Example 2: Assignment Submission with Optimistic Update

```typescript
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useOptimisticUpdate } from '@hooks';
import { Button } from '@components';
import { SubmitAssignmentData } from '@api/assignments';

export const AssignmentSubmissionScreen = ({ route }) => {
  const { assignmentId } = route.params;
  const { submitAssignment, isOnline } = useOptimisticUpdate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const submissionData: SubmitAssignmentData = {
      assignmentId,
      comments: 'My submission',
      attachments: [],
    };

    setSubmitting(true);
    try {
      await submitAssignment(assignmentId, submissionData);
      
      Alert.alert(
        'Success',
        isOnline 
          ? 'Assignment submitted successfully!' 
          : 'Assignment queued. Will submit when online.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      {/* Form fields */}
      <Button
        onPress={handleSubmit}
        disabled={submitting}
        title={submitting ? 'Submitting...' : 'Submit Assignment'}
      />
      {!isOnline && (
        <Text style={styles.offlineWarning}>
          Offline - Submission will be queued
        </Text>
      )}
    </View>
  );
};
```

## Example 3: Attendance Check-in with Offline Queue

```typescript
import React from 'react';
import { View, Alert } from 'react-native';
import { useOptimisticUpdate } from '@hooks';
import { Button } from '@components';

export const AttendanceCheckInScreen = ({ route }) => {
  const { classId } = route.params;
  const { checkInAttendance, isOnline } = useOptimisticUpdate();
  const [checking, setChecking] = useState(false);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      // Get location if available
      const location = await getLocation(); // Implement this

      await checkInAttendance(classId, location);
      
      Alert.alert(
        'Success',
        isOnline 
          ? 'Checked in successfully!' 
          : 'Check-in queued. Will sync when online.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View>
      <Button
        onPress={handleCheckIn}
        disabled={checking}
        title="Check In"
      />
    </View>
  );
};
```

## Example 4: Profile Edit with Offline Support

```typescript
import React, { useState, useEffect } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { useOptimisticUpdate } from '@hooks';
import { fetchProfile } from '@store/slices/studentDataSlice';
import { Button, ScreenLayout } from '@components';

export const ProfileEditScreen = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.studentData);
  const { updateProfile, isOnline } = useOptimisticUpdate();
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    dateOfBirth: profile?.dateOfBirth || '',
  });

  useEffect(() => {
    if (isOnline) {
      dispatch(fetchProfile());
    }
  }, [isOnline, dispatch]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      
      Alert.alert(
        'Success',
        isOnline 
          ? 'Profile updated successfully!' 
          : 'Changes saved offline. Will sync when online.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <ScreenLayout>
      <View>
        <TextInput
          value={formData.phone}
          onChangeText={phone => setFormData({ ...formData, phone })}
          placeholder="Phone"
        />
        <TextInput
          value={formData.dateOfBirth}
          onChangeText={dateOfBirth => setFormData({ ...formData, dateOfBirth })}
          placeholder="Date of Birth"
        />
        <Button onPress={handleSave} title="Save Changes" />
      </View>
    </ScreenLayout>
  );
};
```

## Example 5: Assignments List with Cached Data

```typescript
import React, { useEffect } from 'react';
import { FlatList, View, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchAssignments } from '@store/slices/studentDataSlice';
import { ScreenLayout, CachedDataBadge } from '@components';
import { useNetworkStatus } from '@hooks';
import { shouldRefreshData } from '@utils/optimisticUpdates';

export const AssignmentsListScreen = () => {
  const dispatch = useAppDispatch();
  const { isConnected } = useNetworkStatus();
  const { assignments, assignmentsLastSync, isLoading } = useAppSelector(
    state => state.studentData
  );

  useEffect(() => {
    if (isConnected && shouldRefreshData(assignmentsLastSync, 10)) {
      dispatch(fetchAssignments());
    }
  }, [isConnected, assignmentsLastSync, dispatch]);

  const renderAssignment = ({ item }) => (
    <View style={styles.assignmentCard}>
      <Text>{item.title}</Text>
      <Text>{item.subject}</Text>
      <Text>Due: {item.dueDate}</Text>
    </View>
  );

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <Text style={styles.title}>Assignments</Text>
        <CachedDataBadge lastSyncTime={assignmentsLastSync} isOnline={isConnected} />
      </View>
      
      <FlatList
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isLoading ? 'Loading...' : 'No assignments'}
          </Text>
        }
      />
    </ScreenLayout>
  );
};
```

## Example 6: Settings Screen with Offline Controls

```typescript
import React from 'react';
import { View, Switch, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setAutoSyncEnabled } from '@store/slices/offlineSlice';
import { 
  ScreenLayout, 
  OfflineQueueStatus, 
  SyncButton 
} from '@components';

export const SettingsScreen = () => {
  const dispatch = useAppDispatch();
  const { autoSyncEnabled, queuedOperations } = useAppSelector(
    state => state.offline
  );

  return (
    <ScreenLayout>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Settings</Text>
        
        <View style={styles.setting}>
          <Text>Auto Sync</Text>
          <Switch
            value={autoSyncEnabled}
            onValueChange={value => dispatch(setAutoSyncEnabled(value))}
          />
        </View>

        <OfflineQueueStatus showDetails={true} />

        <SyncButton 
          variant="button"
          onSyncComplete={success => {
            console.log('Sync completed:', success);
          }}
        />
      </View>
    </ScreenLayout>
  );
};
```

## Example 7: Custom Hook for Data Fetching

```typescript
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { useNetworkStatus } from '@hooks';
import { shouldRefreshData } from '@utils/optimisticUpdates';

export const useStudentData = () => {
  const dispatch = useAppDispatch();
  const { isConnected } = useNetworkStatus();
  const studentData = useAppSelector(state => state.studentData);
  const [loading, setLoading] = useState(false);

  const refreshAll = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      await Promise.all([
        dispatch(fetchProfile()),
        dispatch(fetchDashboard()),
        dispatch(fetchAssignments()),
        dispatch(fetchGrades(undefined)),
        dispatch(fetchAttendance()),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && shouldRefreshData(studentData.profileLastSync)) {
      refreshAll();
    }
  }, [isConnected]);

  return {
    ...studentData,
    loading,
    refreshAll,
    isOnline: isConnected,
  };
};

// Usage
const MyScreen = () => {
  const { profile, loading, refreshAll, isOnline } = useStudentData();

  return (
    <View>
      {loading && <ActivityIndicator />}
      <Button onPress={refreshAll} disabled={!isOnline} title="Refresh" />
    </View>
  );
};
```

## Example 8: Queue Status in Tab Navigator

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useOfflineQueue } from '@hooks';
import { Badge } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  const { queueSize } = useOfflineQueue();

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="home" size={size} color={color} />
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
      {/* Other tabs */}
    </Tab.Navigator>
  );
};
```

## Integration Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Import offline components in screens
- [ ] Add `OfflineIndicator` to main screens
- [ ] Use `CachedDataBadge` to show data age
- [ ] Implement optimistic updates for forms
- [ ] Add `SyncButton` for manual refresh
- [ ] Test offline mode thoroughly
- [ ] Configure background sync permissions
- [ ] Add offline queue status to settings
- [ ] Update navigation to show queue badges
