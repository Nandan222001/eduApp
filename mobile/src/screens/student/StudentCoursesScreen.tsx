import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const StudentCoursesScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.materialsButton}
          onPress={() => navigation.navigate('StudyMaterialsScreen' as never)}
        >
          <Text style={styles.materialsButtonIcon}>📚</Text>
          <View style={styles.materialsButtonContent}>
            <Text style={styles.materialsButtonTitle}>Study Materials</Text>
            <Text style={styles.materialsButtonSubtitle}>Access course materials and resources</Text>
          </View>
          <Text style={styles.materialsButtonArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Courses</Text>
        <View style={styles.courseCard}>
          <Text style={styles.courseName}>Mathematics</Text>
          <Text style={styles.courseInfo}>Teacher: Mr. Smith</Text>
        </View>
        <View style={styles.courseCard}>
          <Text style={styles.courseName}>Physics</Text>
          <Text style={styles.courseInfo}>Teacher: Dr. Johnson</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  materialsButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  materialsButtonIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  materialsButtonContent: {
    flex: 1,
  },
  materialsButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  materialsButtonSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  materialsButtonArrow: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  courseInfo: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
