import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { studentApi } from '../../api/studentApi';
import { StudyMaterial } from '../../types/student';
import { MainTabParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<MainTabParamList, 'SubjectMaterials'>;
type RoutePropType = RouteProp<MainTabParamList, 'SubjectMaterials'>;

export const SubjectMaterialsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const { subjectId, subjectName } = route.params;

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await studentApi.getStudyMaterials(subjectId);
      
      const materialsWithDownloadStatus = await Promise.all(
        data.map(async (material) => {
          if (material.file_url) {
            const localPath = `${FileSystem.documentDirectory}materials/${material.id}_${material.title}`;
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            return {
              ...material,
              is_downloaded: fileInfo.exists,
              local_path: fileInfo.exists ? localPath : undefined,
            };
          }
          return material;
        })
      );

      setMaterials(materialsWithDownloadStatus);
    } catch (error) {
      console.error('Error loading materials:', error);
      Alert.alert('Error', 'Failed to load study materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMaterials();
  };

  const downloadMaterial = async (material: StudyMaterial) => {
    if (!material.file_url) return;

    setDownloading(material.id);

    try {
      const dirPath = `${FileSystem.documentDirectory}materials/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }

      const localPath = `${dirPath}${material.id}_${material.title}`;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        material.file_url,
        localPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${(progress * 100).toFixed(0)}%`);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result && result.uri) {
        const updatedMaterials = materials.map(m =>
          m.id === material.id
            ? { ...m, is_downloaded: true, local_path: result.uri }
            : m
        );
        setMaterials(updatedMaterials);
        
        Alert.alert('Success', 'Material downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading material:', error);
      Alert.alert('Error', 'Failed to download material');
    } finally {
      setDownloading(null);
    }
  };

  const deleteMaterial = async (material: StudyMaterial) => {
    if (!material.local_path) return;

    Alert.alert(
      'Delete Downloaded Material',
      'Are you sure you want to delete this downloaded material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(material.local_path!);
              
              const updatedMaterials = materials.map(m =>
                m.id === material.id
                  ? { ...m, is_downloaded: false, local_path: undefined }
                  : m
              );
              setMaterials(updatedMaterials);
              
              Alert.alert('Success', 'Downloaded material deleted');
            } catch (error) {
              console.error('Error deleting material:', error);
              Alert.alert('Error', 'Failed to delete material');
            }
          },
        },
      ]
    );
  };

  const openMaterial = (material: StudyMaterial) => {
    navigation.navigate('MaterialDetail', { materialId: material.id });
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderMaterial = ({ item }: { item: StudyMaterial }) => (
    <TouchableOpacity
      style={styles.materialCard}
      onPress={() => openMaterial(item)}
    >
      <View style={styles.materialIcon}>
        <Text style={styles.materialIconText}>{getFileIcon(item.type)}</Text>
      </View>
      
      <View style={styles.materialInfo}>
        <Text style={styles.materialTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.materialDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.materialMeta}>
          <Text style={styles.materialDate}>{formatDate(item.uploaded_date)}</Text>
          {item.size && (
            <Text style={styles.materialSize}> • {formatFileSize(item.size)}</Text>
          )}
        </View>
      </View>

      <View style={styles.materialActions}>
        {item.is_downloaded ? (
          <View style={styles.actionButtons}>
            <View style={styles.downloadedBadge}>
              <Text style={styles.downloadedText}>✓ Downloaded</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteMaterial(item)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => downloadMaterial(item)}
            disabled={downloading === item.id}
          >
            {downloading === item.id ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.downloadButtonText}>⬇️</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <Text style={styles.headerSubtitle}>{materials.length} Materials</Text>
      </View>

      <FlatList
        data={materials}
        renderItem={renderMaterial}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Materials Available</Text>
            <Text style={styles.emptyText}>
              Study materials will appear here when uploaded
            </Text>
          </View>
        }
      />
    </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listContainer: {
    padding: 16,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialIconText: {
    fontSize: 28,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  materialDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    lineHeight: 18,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  materialSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  materialActions: {
    marginLeft: 12,
  },
  actionButtons: {
    alignItems: 'center',
  },
  downloadedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  downloadedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
