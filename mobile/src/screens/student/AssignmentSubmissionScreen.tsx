import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
// import { Camera } from 'expo-camera';
// import * as DocumentPicker from 'expo-document-picker';
import { studentApi } from '../../api/studentApi';
import { Assignment, SubmissionFile } from '../../types/student';
import { MainTabParamList } from '../../types/navigation';

// Placeholder for Camera - will work when expo-camera is installed
const Camera: any = { requestCameraPermissionsAsync: async () => ({ status: 'granted' }) };
// Placeholder for DocumentPicker - will work when expo-document-picker is installed
const DocumentPicker: any = {
  getDocumentAsync: async () => ({ type: 'cancel' })
};

type NavigationProp = NativeStackNavigationProp<MainTabParamList, 'AssignmentSubmission'>;
type RoutePropType = RouteProp<MainTabParamList, 'AssignmentSubmission'>;

export const AssignmentSubmissionScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const { assignmentId } = route.params;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState('');
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadAssignment();
    requestCameraPermission();
  }, []);

  const loadAssignment = async () => {
    try {
      const data = await studentApi.getAssignmentById(assignmentId);
      setAssignment(data);
    } catch (error) {
      console.error('Error loading assignment:', error);
      Alert.alert('Error', 'Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleTakePhoto = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestCameraPermission },
        ]
      );
      return;
    }

    navigation.navigate('CameraScreen', {
      onPhotoTaken: (photo: SubmissionFile) => {
        setFiles([...files, photo]);
      },
    });
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.type === 'success') {
        const newFiles: SubmissionFile[] = result.output ? 
          result.output.map((doc: any) => ({
            uri: doc.uri,
            name: doc.name,
            type: doc.mimeType || 'application/octet-stream',
            size: doc.size,
          })) : 
          [{
            uri: result.uri,
            name: result.name,
            type: result.mimeType || 'application/octet-stream',
            size: result.size,
          }];
        
        setFiles([...files, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRemoveFile = (index: number) => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newFiles = [...files];
            newFiles.splice(index, 1);
            setFiles(newFiles);
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      Alert.alert('Error', 'Please add at least one file to submit');
      return;
    }

    Alert.alert(
      'Submit Assignment',
      'Are you sure you want to submit this assignment? You cannot undo this action.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await studentApi.submitAssignment({
                assignment_id: assignmentId,
                files,
                comments: comments.trim() || undefined,
                submitted_at: new Date().toISOString(),
              });

              Alert.alert(
                'Success',
                'Assignment submitted successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error submitting assignment:', error);
              Alert.alert('Error', 'Failed to submit assignment. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Assignment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.assignmentInfo}>
        <Text style={styles.assignmentTitle}>{assignment.title}</Text>
        <Text style={styles.assignmentSubject}>{assignment.subject}</Text>
        <Text style={styles.assignmentDescription}>{assignment.description}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{formatDate(assignment.due_date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Max Score</Text>
            <Text style={styles.infoValue}>{assignment.max_score} points</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Files</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleTakePhoto}
          >
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handlePickDocument}
          >
            <Text style={styles.buttonIcon}>📎</Text>
            <Text style={styles.buttonText}>Pick File</Text>
          </TouchableOpacity>
        </View>

        {files.length > 0 && (
          <View style={styles.filesContainer}>
            <Text style={styles.filesCount}>{files.length} file(s) added</Text>
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  {file.type.startsWith('image/') && (
                    <Image source={{ uri: file.uri }} style={styles.fileThumbnail} />
                  )}
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    {file.size && (
                      <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFile(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comments (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Add any comments or notes..."
          multiline
          numberOfLines={4}
          value={comments}
          onChangeText={setComments}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Assignment</Text>
        )}
      </TouchableOpacity>

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
  assignmentInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  assignmentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  assignmentSubject: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  assignmentDescription: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filesContainer: {
    marginTop: 16,
  },
  filesCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#FF3B30',
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1C1C1E',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#34C759',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 32,
  },
});
