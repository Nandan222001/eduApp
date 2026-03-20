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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentApi } from '../../api/studentApi';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { Subject } from '../../types/student';
import { MainTabParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<MainTabParamList>;

export const StudyMaterialsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      let data;
      if (isDemoUser()) {
        data = await demoDataApi.student.getSubjects();
      } else {
        data = await studentApi.getSubjects();
      }
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      if (!isDemoUser()) {
        Alert.alert('Error', 'Failed to load subjects');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubjects();
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => 
        navigation.navigate('SubjectMaterials', {
          subjectId: item.id,
          subjectName: item.name,
        })
      }
    >
      <View style={styles.subjectIcon}>
        <Text style={styles.subjectIconText}>📚</Text>
      </View>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectCode}>{item.code}</Text>
        {item.teacher_name && (
          <Text style={styles.teacherName}>👨‍🏫 {item.teacher_name}</Text>
        )}
      </View>
      <View style={styles.materialCount}>
        <Text style={styles.materialCountText}>{item.material_count}</Text>
        <Text style={styles.materialCountLabel}>materials</Text>
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
      <FlatList
        data={subjects}
        renderItem={renderSubject}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Subjects Found</Text>
            <Text style={styles.emptyText}>
              Subjects will appear here once you're enrolled
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
  listContainer: {
    padding: 16,
  },
  subjectCard: {
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
  subjectIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectIconText: {
    fontSize: 24,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 13,
    color: '#8E8E93',
  },
  materialCount: {
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
  },
  materialCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  materialCountLabel: {
    fontSize: 12,
    color: '#8E8E93',
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
