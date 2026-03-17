import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';

export const AIFeaturesQuickAccess: React.FC = () => {
  const router = useRouter();

  const features = [
    {
      id: 'ai-predictions',
      title: 'AI Predictions',
      description: 'View topic probabilities & focus areas',
      icon: 'psychology',
      iconType: 'material',
      color: '#8B5CF6',
      route: '/(tabs)/student/ai-predictions',
    },
    {
      id: 'homework-scanner',
      title: 'Homework Scanner',
      description: 'Scan & get AI feedback',
      icon: 'camera',
      iconType: 'feather',
      color: '#EC4899',
      route: '/(tabs)/student/homework-scanner',
    },
    {
      id: 'study-buddy',
      title: 'Study Buddy',
      description: 'Chat with your AI tutor',
      icon: 'message-circle',
      iconType: 'feather',
      color: '#10B981',
      route: '/(tabs)/student/study-buddy',
    },
  ];

  return (
    <Card>
      <View style={styles.header}>
        <Icon name="stars" type="material" size={24} color={COLORS.primary} />
        <Text style={styles.title}>AI-Powered Features</Text>
      </View>
      <View style={styles.featuresContainer}>
        {features.map(feature => (
          <TouchableOpacity
            key={feature.id}
            style={[styles.featureCard, { borderLeftColor: feature.color }]}
            onPress={() => router.push(feature.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
              <Icon
                name={feature.icon}
                type={feature.iconType as any}
                size={24}
                color={feature.color}
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Icon name="chevron-right" type="feather" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  featuresContainer: {
    gap: SPACING.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
