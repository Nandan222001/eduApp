import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '@rneui/themed';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@constants';
import { Card, Button } from '@components';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@api/client';
import { analyticsService } from '@services/analytics';
import { useNavigation } from '@react-navigation/native';

type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other';

interface FeedbackData {
  category: FeedbackCategory;
  subject: string;
  message: string;
  rating?: number;
}

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: 'bug', label: 'Bug Report', emoji: '🐛' },
  { value: 'feature', label: 'Feature Request', emoji: '💡' },
  { value: 'improvement', label: 'Improvement', emoji: '⚡' },
  { value: 'other', label: 'Other', emoji: '💬' },
];

const RATINGS = [1, 2, 3, 4, 5];

export const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | undefined>();

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: FeedbackData) => apiClient.post('/feedback', data),
    onSuccess: () => {
      analyticsService.trackEvent('feedback_submitted', 'feedback', {
        category,
        has_rating: !!rating,
      });

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      setSubject('');
      setMessage('');
      setRating(undefined);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to submit feedback. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject for your feedback.');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter a message for your feedback.');
      return;
    }

    submitFeedbackMutation.mutate({
      category,
      subject: subject.trim(),
      message: message.trim(),
      rating,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text h4 style={styles.title}>
            We&apos;d love to hear from you!
          </Text>
          <Text style={styles.subtitle}>
            Your feedback helps us improve the app and provide a better experience for everyone.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Feedback Category</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryButton, category === cat.value && styles.categoryButtonActive]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.value && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>How would you rate your experience?</Text>
          <View style={styles.ratingContainer}>
            {RATINGS.map(value => (
              <TouchableOpacity
                key={value}
                style={[styles.ratingButton, rating === value && styles.ratingButtonActive]}
                onPress={() => setRating(value)}
              >
                <Text style={[styles.ratingEmoji, rating === value && styles.ratingEmojiActive]}>
                  {value === 1 ? '😞' : value === 2 ? '😕' : value === 3 ? '😐' : value === 4 ? '🙂' : '😄'}
                </Text>
                <Text style={[styles.ratingText, rating === value && styles.ratingTextActive]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief summary of your feedback"
            placeholderTextColor={COLORS.textSecondary}
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{subject.length}/100</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please provide detailed feedback..."
            placeholderTextColor={COLORS.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>{message.length}/1000</Text>
        </Card>

        <Button
          title="Submit Feedback"
          onPress={handleSubmit}
          loading={submitFeedbackMutation.isPending}
          disabled={submitFeedbackMutation.isPending}
          fullWidth
          style={styles.submitButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            * Required fields. Your feedback will be reviewed by our team.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  contentContainer: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: COLORS.background,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  ratingEmojiActive: {
    transform: [{ scale: 1.2 }],
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  ratingTextActive: {
    color: COLORS.background,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  submitButton: {
    marginBottom: SPACING.md,
  },
  footer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
