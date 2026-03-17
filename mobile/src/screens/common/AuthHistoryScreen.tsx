import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ListItem, Icon, Chip } from '@rneui/themed';
import { format } from 'date-fns';
import { mobileAuthApi, AuthEvent } from '@api/mobileAuth';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

export const AuthHistoryScreen: React.FC = () => {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await mobileAuthApi.getAuthEvents(100);
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading auth events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const getEventIcon = (eventType: string, success: boolean) => {
    if (!success) return 'error';

    switch (eventType) {
      case 'biometric_setup':
        return 'fingerprint';
      case 'pin_setup':
      case 'pin_verification':
        return 'dialpad';
      case 'device_registration':
        return 'devices';
      case 'device_trusted':
        return 'verified';
      case 'sensitive_operation':
        return 'security';
      default:
        return 'info';
    }
  };

  const getEventTitle = (eventType: string) => {
    switch (eventType) {
      case 'biometric_setup':
        return 'Biometric Setup';
      case 'pin_setup':
        return 'PIN Setup';
      case 'pin_verification':
        return 'PIN Verification';
      case 'device_registration':
        return 'Device Registration';
      case 'device_trusted':
        return 'Device Trusted';
      case 'sensitive_operation':
        return 'Sensitive Operation';
      default:
        return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const renderEvent = ({ item }: { item: AuthEvent }) => (
    <ListItem bottomDivider>
      <Icon
        name={getEventIcon(item.event_type, item.success)}
        type="material"
        color={item.success ? COLORS.success : COLORS.error}
      />
      <ListItem.Content>
        <ListItem.Title>{getEventTitle(item.event_type)}</ListItem.Title>
        <ListItem.Subtitle>Method: {item.auth_method.replace(/_/g, ' ')}</ListItem.Subtitle>
        <ListItem.Subtitle style={styles.subtitle}>
          {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
        </ListItem.Subtitle>
        {item.ip_address && (
          <ListItem.Subtitle style={styles.subtitle}>IP: {item.ip_address}</ListItem.Subtitle>
        )}
        {item.location && (
          <ListItem.Subtitle style={styles.subtitle}>Location: {item.location}</ListItem.Subtitle>
        )}
        {!item.success && item.failure_reason && (
          <Text style={styles.failureReason}>Reason: {item.failure_reason}</Text>
        )}
      </ListItem.Content>
      <Chip
        title={item.success ? 'Success' : 'Failed'}
        type="outline"
        buttonStyle={{
          borderColor: item.success ? COLORS.success : COLORS.error,
        }}
        titleStyle={{
          color: item.success ? COLORS.success : COLORS.error,
          fontSize: FONT_SIZES.xs,
        }}
      />
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Review recent authentication activity on your account</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="history" type="material" size={64} color={COLORS.disabled} />
            <Text style={styles.emptyText}>No authentication events found</Text>
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
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  failureReason: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: 4,
    fontStyle: 'italic',
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
