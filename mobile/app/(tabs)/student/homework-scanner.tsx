import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, Icon, Button } from '@rneui/themed';
import { Camera, CameraType } from 'expo-camera';
import { useMutation } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { studentApi } from '../../../src/api/student';
import { Card } from '../../../src/components/Card';
import { HomeworkScanResult } from '../../../src/types/student';

export default function SmartHomeworkScannerScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<HomeworkScanResult | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const cameraRef = useRef<Camera>(null);

  const scanMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      const response = await studentApi.scanHomework(imageUri, selectedSubject || undefined);
      return response.data;
    },
    onSuccess: data => {
      setScanResult(data);
      setCapturedImage(null);
    },
    onError: (error: Error) => {
      Alert.alert('Scan Failed', error?.message || 'Failed to analyze homework');
    },
  });

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      setCapturedImage(photo.uri);
      setShowCamera(false);
    }
  };

  const handleScan = () => {
    if (capturedImage) {
      scanMutation.mutate(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setShowCamera(true);
  };

  const handleNewScan = () => {
    setCapturedImage(null);
    setScanResult(null);
    setShowCamera(true);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="camera-off" type="feather" size={64} color={COLORS.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>We need camera access to scan your homework</Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          buttonStyle={styles.permissionButton}
        />
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera ref={cameraRef} style={styles.camera} type={CameraType.back}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowCamera(false)}>
                <Icon name="x" type="feather" size={24} color={COLORS.background} />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Position homework in frame</Text>
            </View>

            <View style={styles.cameraFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    );
  }

  if (scanMutation.isPending) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing homework...</Text>
        <Text style={styles.loadingSubtext}>AI is detecting mistakes and providing feedback</Text>
      </View>
    );
  }

  if (capturedImage && !scanResult) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Captured Image</Text>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Subject (Optional)</Text>
            <View style={styles.subjectContainer}>
              {['Math', 'Science', 'English', 'History'].map(subject => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectChip,
                    selectedSubject === subject && styles.subjectChipSelected,
                  ]}
                  onPress={() => setSelectedSubject(subject === selectedSubject ? '' : subject)}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      selectedSubject === subject && styles.subjectChipTextSelected,
                    ]}
                  >
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <View style={styles.actionButtons}>
            <Button
              title="Retake"
              onPress={handleRetake}
              buttonStyle={styles.retakeButton}
              containerStyle={styles.buttonContainer}
              icon={<Icon name="camera" type="feather" size={20} color={COLORS.primary} />}
              type="outline"
            />
            <Button
              title="Analyze"
              onPress={handleScan}
              buttonStyle={styles.analyzeButton}
              containerStyle={styles.buttonContainer}
              icon={<Icon name="check" type="feather" size={20} color={COLORS.background} />}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (scanResult) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <View style={styles.resultHeader}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text
                style={[
                  styles.scoreValue,
                  { color: scanResult.overallScore >= 70 ? COLORS.success : COLORS.warning },
                ]}
              >
                {scanResult.overallScore}%
              </Text>
            </View>
            <TouchableOpacity style={styles.newScanButton} onPress={handleNewScan}>
              <Icon name="camera" type="feather" size={20} color={COLORS.primary} />
              <Text style={styles.newScanText}>New Scan</Text>
            </TouchableOpacity>
          </View>

          <Image source={{ uri: scanResult.imageUrl }} style={styles.resultImage} />

          {scanResult.subject && (
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Subject:</Text>
              <Text style={styles.metaValue}>{scanResult.subject}</Text>
            </View>
          )}
          {scanResult.topic && (
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Topic:</Text>
              <Text style={styles.metaValue}>{scanResult.topic}</Text>
            </View>
          )}
        </Card>

        {scanResult.feedback && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="message-circle" type="feather" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>AI Feedback</Text>
            </View>
            <Text style={styles.feedbackText}>{scanResult.feedback}</Text>
          </Card>
        )}

        {scanResult.mistakes.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="alert-triangle" type="feather" size={20} color={COLORS.error} />
              <Text style={styles.sectionTitle}>Mistake Analysis</Text>
            </View>
            {scanResult.mistakes.map((mistake, index) => (
              <View key={index} style={styles.mistakeItem}>
                <View style={styles.mistakeHeader}>
                  <View style={[styles.severityBadge, styles[`severity_${mistake.severity}`]]}>
                    <Text style={styles.severityText}>{mistake.severity}</Text>
                  </View>
                  <Text style={styles.mistakeType}>{mistake.type}</Text>
                </View>
                <Text style={styles.mistakeDescription}>{mistake.description}</Text>
              </View>
            ))}
          </Card>
        )}

        {scanResult.remedialSuggestions.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="lightbulb" type="feather" size={20} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>Remedial Suggestions</Text>
            </View>
            {scanResult.remedialSuggestions.map(suggestion => (
              <View key={suggestion.id} style={styles.suggestionItem}>
                <Text style={styles.suggestionTopic}>{suggestion.topic}</Text>
                <Text style={styles.suggestionText}>{suggestion.suggestion}</Text>
                {suggestion.resources.length > 0 && (
                  <View style={styles.resourcesList}>
                    <Text style={styles.resourcesLabel}>Recommended Resources:</Text>
                    {suggestion.resources.map((resource, idx) => (
                      <View key={idx} style={styles.resourceItem}>
                        <Icon name="book-open" type="feather" size={14} color={COLORS.primary} />
                        <Text style={styles.resourceText}>{resource.title}</Text>
                        <View style={styles.resourceTypeBadge}>
                          <Text style={styles.resourceTypeText}>{resource.type}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.emptyContent}>
        <Icon name="camera" type="feather" size={80} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>Smart Homework Scanner</Text>
        <Text style={styles.emptyText}>
          Capture your homework and get instant AI-powered feedback on mistakes and areas for
          improvement
        </Text>
        <Button
          title="Start Scanning"
          onPress={() => setShowCamera(true)}
          buttonStyle={styles.startButton}
          containerStyle={styles.startButtonContainer}
          icon={<Icon name="camera" type="feather" size={20} color={COLORS.background} />}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  startButtonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  permissionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cameraTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.background,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cameraFrame: {
    flex: 1,
    margin: SPACING.xl,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.background,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
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
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.md,
    resizeMode: 'contain',
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  subjectChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subjectChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  subjectChipTextSelected: {
    color: COLORS.background,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  buttonContainer: {
    flex: 1,
  },
  retakeButton: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
  },
  newScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  newScanText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultImage: {
    width: '100%',
    height: 250,
    borderRadius: BORDER_RADIUS.md,
    resizeMode: 'contain',
    marginBottom: SPACING.md,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  metaLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  metaValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  feedbackText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  mistakeItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mistakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  severity_low: {
    backgroundColor: '#DBEAFE',
  },
  severity_medium: {
    backgroundColor: '#FEF3C7',
  },
  severity_high: {
    backgroundColor: '#FEE2E2',
  },
  severityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mistakeType: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  mistakeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  suggestionItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionTopic: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  suggestionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  resourcesList: {
    marginTop: SPACING.sm,
  },
  resourcesLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  resourceText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  resourceTypeBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  resourceTypeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
});
