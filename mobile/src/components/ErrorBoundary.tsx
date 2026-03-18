import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sentry } from '@config/sentry';
import { analyticsService } from '@services/analytics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import Constants from 'expo-constants';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    analyticsService.trackError(error.message, error.name, errorInfo.componentStack || undefined);

    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              We&apos;re sorry for the inconvenience. The error has been reported to our team.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.resetError}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  this.resetError();
                }}
              >
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode)</Text>
                <View style={styles.errorBox}>
                  <Text style={styles.errorName}>{this.state.error.name}</Text>
                  <Text style={styles.errorMessage}>{this.state.error.message}</Text>
                  {this.state.error.stack && (
                    <ScrollView style={styles.stackTraceContainer}>
                      <Text style={styles.stackTrace}>{this.state.error.stack}</Text>
                    </ScrollView>
                  )}
                </View>
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorDetailsTitle}>Component Stack</Text>
                    <ScrollView style={styles.stackTraceContainer}>
                      <Text style={styles.stackTrace}>{this.state.errorInfo.componentStack}</Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                App Version: {Constants.expoConfig?.version || '1.0.0'}
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorDetailsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  errorBox: {
    marginBottom: SPACING.md,
  },
  errorName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  errorMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  stackTraceContainer: {
    maxHeight: 200,
    backgroundColor: '#1e1e1e',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  stackTrace: {
    fontSize: FONT_SIZES.xs,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
