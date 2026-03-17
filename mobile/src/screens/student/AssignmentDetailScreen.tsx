import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Text, Card, Button, Input, Icon, Badge } from '@rneui/themed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast, parseISO } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, CameraType } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { assignmentsApi, SubmitAssignmentData } from '../../api/assignments';
import { LoadingState, ErrorState } from '../../components';

interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  base64?: string;
}

export const AssignmentDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id: assignmentId } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const [comments, setComments] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const cameraRef = React.useRef<Camera>(null);

  const {
    data: assignment,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const response = await assignmentsApi.getAssignmentDetail(String(assignmentId));
      return response.data;
    },
    enabled: !!assignmentId,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const submitMutation = useMutation({
    mutationFn: (data: SubmitAssignmentData) => assignmentsApi.submitAssignment(data),
    onMutate: async newSubmission => {
      await queryClient.cancelQueries({ queryKey: ['assignment', assignmentId] });

      const previousAssignment = queryClient.getQueryData(['assignment', assignmentId]);

      queryClient.setQueryData(['assignment', assignmentId], (old: any) => ({
        ...old,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      }));

      return { previousAssignment };
    },
    onError: (err, newSubmission, context) => {
      if (context?.previousAssignment) {
        queryClient.setQueryData(['assignment', assignmentId], context.previousAssignment);
      }
      Alert.alert('Error', 'Failed to submit assignment. Please try again.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setShowSubmitModal(true);
      setAttachments([]);
      setComments('');
    },
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));
        setAttachments([...attachments, ...newAttachments]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraPermission) {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
    }

    if (!cameraPermission?.granted) {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
    }

    setShowCamera(true);
  };

  const handleCameraCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        const photoAttachment: AttachmentFile = {
          uri: photo.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: 0,
          base64: photo.base64,
        };

        setAttachments([...attachments, photoAttachment]);
        setShowCamera(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (attachments.length === 0) {
      Alert.alert('No Attachments', 'Please add at least one file or photo before submitting.');
      return;
    }

    try {
      const submitData: SubmitAssignmentData = {
        assignmentId: parseInt(String(assignmentId)),
        comments: comments || undefined,
        attachments: await Promise.all(
          attachments.map(async file => {
            let base64Data = file.base64;

            if (!base64Data && Platform.OS !== 'web') {
              const response = await fetch(file.uri);
              const blob = await response.blob();
              base64Data = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  resolve(base64);
                };
                reader.readAsDataURL(blob);
              });
            }

            return {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fileData: base64Data || '',
            };
          })
        ),
      };

      submitMutation.mutate(submitData);
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare submission');
    }
  };

  const handleOpenAttachment = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open this file');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: COLORS.warning, text: 'Pending' },
      submitted: { color: COLORS.info, text: 'Submitted' },
      graded: { color: COLORS.success, text: 'Graded' },
      overdue: { color: COLORS.error, text: 'Overdue' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge value={config.text} badgeStyle={{ backgroundColor: config.color }} />;
  };

  if (isLoading) {
    return <LoadingState message="Loading assignment..." />;
  }

  if (isError || !assignment) {
    return (
      <ErrorState
        title="Failed to load assignment"
        message={(error as any)?.message || 'Please check your connection and try again'}
        onRetry={() => refetch()}
      />
    );
  }

  const canSubmit = assignment.status === 'pending' && !isPast(parseISO(assignment.dueDate));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card containerStyle={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{assignment.title}</Text>
              <Text style={styles.subject}>{assignment.subject}</Text>
            </View>
            {getStatusBadge(assignment.status)}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Icon name="calendar" type="feather" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                Due: {format(parseISO(assignment.dueDate), 'MMM dd, yyyy h:mm a')}
              </Text>
            </View>

            {assignment.teacherName && (
              <View style={styles.infoRow}>
                <Icon name="user" type="feather" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>Teacher: {assignment.teacherName}</Text>
              </View>
            )}

            {assignment.totalMarks !== undefined && (
              <View style={styles.infoRow}>
                <Icon name="award" type="feather" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>Total Marks: {assignment.totalMarks}</Text>
              </View>
            )}

            {assignment.obtainedMarks !== undefined && assignment.totalMarks !== undefined && (
              <View style={styles.infoRow}>
                <Icon name="check-circle" type="feather" size={18} color={COLORS.success} />
                <Text style={styles.infoText}>
                  Obtained: {assignment.obtainedMarks}/{assignment.totalMarks} (
                  {((assignment.obtainedMarks / assignment.totalMarks) * 100).toFixed(1)}%)
                </Text>
              </View>
            )}
          </View>
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{assignment.description}</Text>
        </Card>

        {assignment.attachments && assignment.attachments.length > 0 && (
          <Card containerStyle={styles.card}>
            <Text style={styles.sectionTitle}>Assignment Attachments</Text>
            {assignment.attachments.map(attachment => (
              <TouchableOpacity
                key={attachment.id}
                style={styles.attachmentItem}
                onPress={() => handleOpenAttachment(attachment.fileUrl)}
              >
                <Icon name="file-text" type="feather" size={20} color={COLORS.primary} />
                <Text style={styles.attachmentName}>{attachment.fileName}</Text>
                <Icon name="external-link" type="feather" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {assignment.submission && (
          <Card containerStyle={styles.card}>
            <Text style={styles.sectionTitle}>Your Submission</Text>
            <View style={styles.submissionInfo}>
              <Text style={styles.submittedAtText}>
                Submitted on:{' '}
                {format(parseISO(assignment.submission.submittedAt), 'MMM dd, yyyy h:mm a')}
              </Text>
              {assignment.submission.comments && (
                <Text style={styles.submissionComments}>{assignment.submission.comments}</Text>
              )}
            </View>

            {assignment.submission.attachments.length > 0 && (
              <View style={styles.submissionAttachments}>
                <Text style={styles.subsectionTitle}>Submitted Files:</Text>
                {assignment.submission.attachments.map(attachment => (
                  <TouchableOpacity
                    key={attachment.id}
                    style={styles.attachmentItem}
                    onPress={() => handleOpenAttachment(attachment.fileUrl)}
                  >
                    <Icon name="file-text" type="feather" size={20} color={COLORS.primary} />
                    <Text style={styles.attachmentName}>{attachment.fileName}</Text>
                    <Icon
                      name="external-link"
                      type="feather"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {assignment.feedback && (
              <View style={styles.feedbackSection}>
                <Text style={styles.subsectionTitle}>Feedback:</Text>
                <Text style={styles.feedbackText}>{assignment.feedback}</Text>
              </View>
            )}
          </Card>
        )}

        {canSubmit && (
          <Card containerStyle={styles.card}>
            <Text style={styles.sectionTitle}>Submit Assignment</Text>

            <Input
              placeholder="Add comments (optional)"
              multiline
              numberOfLines={4}
              value={comments}
              onChangeText={setComments}
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
            />

            <View style={styles.attachmentButtons}>
              <Button
                title="Pick Document"
                icon={<Icon name="file" type="feather" size={20} color={COLORS.background} />}
                onPress={handlePickDocument}
                buttonStyle={styles.pickButton}
                containerStyle={styles.buttonContainer}
              />
              <Button
                title="Take Photo"
                icon={<Icon name="camera" type="feather" size={20} color={COLORS.background} />}
                onPress={handleTakePhoto}
                buttonStyle={styles.pickButton}
                containerStyle={styles.buttonContainer}
              />
            </View>

            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                <Text style={styles.subsectionTitle}>Selected Files:</Text>
                {attachments.map((file, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <Icon name="file" type="feather" size={20} color={COLORS.primary} />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveAttachment(index)}>
                      <Icon name="x" type="feather" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Button
              title="Submit Assignment"
              onPress={handleSubmit}
              disabled={attachments.length === 0 || submitMutation.isPending}
              loading={submitMutation.isPending}
              buttonStyle={styles.submitButton}
              disabledStyle={styles.submitButtonDisabled}
            />
          </Card>
        )}

        {assignment.status === 'overdue' && !assignment.submission && (
          <Card containerStyle={[styles.card, styles.overdueCard]}>
            <Icon name="alert-circle" type="feather" size={32} color={COLORS.error} />
            <Text style={styles.overdueText}>This assignment is overdue</Text>
          </Card>
        )}
      </ScrollView>

      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={styles.cameraContainer}>
          <Camera style={styles.camera} type={CameraType.back} ref={cameraRef}>
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton} onPress={handleCameraCapture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowCamera(false)}>
                <Icon name="x" type="feather" size={32} color={COLORS.background} />
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      </Modal>

      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" type="feather" size={64} color={COLORS.success} />
            <Text style={styles.modalTitle}>Assignment Submitted!</Text>
            <Text style={styles.modalText}>
              Your assignment has been submitted successfully. You will be notified once it's
              graded.
            </Text>
            <Button
              title="Close"
              onPress={() => {
                setShowSubmitModal(false);
                router.back();
              }}
              buttonStyle={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subject: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  infoSection: {
    marginTop: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subsectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  attachmentName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  submissionInfo: {
    marginBottom: SPACING.md,
  },
  submittedAtText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  submissionComments: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  submissionAttachments: {
    marginTop: SPACING.md,
  },
  feedbackSection: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  feedbackText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  input: {
    fontSize: FONT_SIZES.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  attachmentButtons: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  buttonContainer: {
    flex: 1,
  },
  pickButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  attachmentsList: {
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  overdueCard: {
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
  },
  overdueText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
  },
  closeButton: {
    padding: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
  },
});
