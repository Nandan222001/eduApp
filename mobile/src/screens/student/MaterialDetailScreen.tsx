import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { studentApi } from '../../api/studentApi';
import { StudyMaterial } from '../../types/student';

export const MaterialDetailScreen: React.FC = () => {
  const route = useRoute();
  const { materialId } = route.params as { materialId: number };

  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterial();
  }, []);

  const loadMaterial = async () => {
    try {
      const data = await studentApi.getMaterialById(materialId);
      
      if (data.file_url) {
        const localPath = `${FileSystem.documentDirectory}materials/${data.id}_${data.title}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        setMaterial({
          ...data,
          is_downloaded: fileInfo.exists,
          local_path: fileInfo.exists ? localPath : undefined,
        });
      } else {
        setMaterial(data);
      }
    } catch (error) {
      console.error('Error loading material:', error);
      Alert.alert('Error', 'Failed to load material details');
    } finally {
      setLoading(false);
    }
  };

  const openFile = async () => {
    if (!material) return;

    if (material.type === 'link' && material.file_url) {
      const supported = await Linking.canOpenURL(material.file_url);
      if (supported) {
        await Linking.openURL(material.file_url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
      return;
    }

    const fileToOpen = material.is_downloaded ? material.local_path : material.file_url;
    
    if (!fileToOpen) {
      Alert.alert('Error', 'File not available');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(fileToOpen);
      if (supported) {
        await Linking.openURL(fileToOpen);
      } else {
        Alert.alert('Error', 'Cannot open this file type');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const shareFile = async () => {
    Alert.alert('Share', 'Sharing functionality will be implemented');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎥';
      case 'document': return '📝';
      case 'link': return '🔗';
      case 'image': return '🖼️';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!material) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Material not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{getFileIcon(material.type)}</Text>
        </View>
        <Text style={styles.title}>{material.title}</Text>
        <Text style={styles.subject}>{material.subject}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{material.type.toUpperCase()}</Text>
        </View>

        {material.size && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{formatFileSize(material.size)}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Uploaded</Text>
          <Text style={styles.detailValue}>{formatDate(material.uploaded_date)}</Text>
        </View>

        {material.is_downloaded && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.downloadedBadge}>
              <Text style={styles.downloadedText}>✓ Available Offline</Text>
            </View>
          </View>
        )}
      </View>

      {material.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{material.description}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={openFile}
        >
          <Text style={styles.primaryButtonText}>
            {material.type === 'link' ? 'Open Link' : 'Open File'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={shareFile}
        >
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subject: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  downloadedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  downloadedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 32,
  },
});
