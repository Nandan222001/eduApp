import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchProfile } from '@store/slices/profileSlice';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { CachedDataBanner } from '../components/CachedDataBanner';

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile, isLoading, lastUpdated } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!profile && user) {
      dispatch(fetchProfile());
    }
  }, [dispatch, profile, user]);

  const handleRefresh = async () => {
    await dispatch(fetchProfile()).unwrap();
  };

  const displayProfile = profile || user;

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <CachedDataBanner lastUpdated={lastUpdated} onRefresh={handleRefresh} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {displayProfile && (
          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayProfile.first_name?.charAt(0).toUpperCase() || 
                   displayProfile.email.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.name}>
                {displayProfile.first_name && displayProfile.last_name
                  ? `${displayProfile.first_name} ${displayProfile.last_name}`
                  : displayProfile.first_name || 'Student'}
              </Text>
              <Text style={styles.email}>{displayProfile.email}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{displayProfile.email}</Text>
                </View>
                
                {(displayProfile.first_name || displayProfile.last_name) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>
                      {[displayProfile.first_name, displayProfile.last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </Text>
                  </View>
                )}
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Role:</Text>
                  <Text style={[styles.infoValue, styles.roleValue]}>
                    {displayProfile.role?.name?.toUpperCase() || 'STUDENT'}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={[styles.infoValue, styles.activeValue]}>
                    {displayProfile.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Notification Preferences</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Privacy Settings</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Language</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6C757D',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  roleValue: {
    color: '#007AFF',
  },
  activeValue: {
    color: '#28A745',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  settingText: {
    fontSize: 16,
    color: '#212529',
  },
  arrow: {
    fontSize: 24,
    color: '#6C757D',
  },
});
