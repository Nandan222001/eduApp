import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Text, ListItem, Icon, Button } from '@rneui/themed';
import { format } from 'date-fns';
import { mobileAuthApi, UserDevice } from '@api/mobileAuth';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

export const DeviceManagementScreen: React.FC = () => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await mobileAuthApi.getUserDevices();
      setDevices(response.data);
    } catch (error) {
      console.error('Error loading devices:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const handleRemoveDevice = (device: UserDevice) => {
    Alert.alert('Remove Device', `Are you sure you want to remove "${device.device_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileAuthApi.removeDevice(device.id);
            Alert.alert('Success', 'Device removed successfully');
            loadDevices();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove device');
          }
        },
      },
    ]);
  };

  const handleTrustDevice = async (device: UserDevice) => {
    try {
      await mobileAuthApi.trustDevice(device.id);
      Alert.alert('Success', 'Device marked as trusted');
      loadDevices();
    } catch (error) {
      Alert.alert('Error', 'Failed to trust device');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'phone':
        return 'smartphone';
      case 'tablet':
        return 'tablet';
      case 'desktop':
        return 'computer';
      default:
        return 'devices';
    }
  };

  const renderDevice = ({ item }: { item: UserDevice }) => (
    <ListItem bottomDivider>
      <Icon
        name={getDeviceIcon(item.device_type)}
        type="material"
        color={item.is_current ? COLORS.primary : COLORS.textSecondary}
      />
      <ListItem.Content>
        <ListItem.Title>
          {item.device_name}
          {item.is_current && <Text style={styles.currentBadge}> (Current)</Text>}
        </ListItem.Title>
        <ListItem.Subtitle>
          {item.device_model && `${item.device_model} • `}
          {item.os_version}
        </ListItem.Subtitle>
        <ListItem.Subtitle style={styles.subtitle}>
          Last active: {format(new Date(item.last_active), 'MMM d, yyyy h:mm a')}
        </ListItem.Subtitle>
        {item.biometric_enabled && (
          <View style={styles.biometricBadge}>
            <Icon name="fingerprint" type="material" size={16} color={COLORS.success} />
            <Text style={styles.biometricText}>{item.biometric_type} enabled</Text>
          </View>
        )}
        {item.is_trusted && (
          <View style={styles.trustedBadge}>
            <Icon name="verified" type="material" size={16} color={COLORS.success} />
            <Text style={styles.trustedText}>Trusted Device</Text>
          </View>
        )}
      </ListItem.Content>
      <View style={styles.actions}>
        {!item.is_trusted && !item.is_current && (
          <Button
            title="Trust"
            type="clear"
            onPress={() => handleTrustDevice(item)}
            titleStyle={styles.trustButton}
          />
        )}
        {!item.is_current && (
          <Button
            title="Remove"
            type="clear"
            onPress={() => handleRemoveDevice(item)}
            titleStyle={styles.removeButton}
          />
        )}
      </View>
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Manage devices that have access to your account</Text>
      </View>

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="devices" type="material" size={64} color={COLORS.disabled} />
            <Text style={styles.emptyText}>No devices found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  headerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  currentBadge: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  biometricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  biometricText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginLeft: 4,
  },
  trustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trustedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'column',
  },
  trustButton: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
  },
  removeButton: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
