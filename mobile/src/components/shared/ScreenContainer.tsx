import React from 'react';
import { View, ViewStyle, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  padding?: boolean;
  backgroundColor?: string;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scroll = false,
  keyboardAware = false,
  padding = true,
  backgroundColor,
  edges = ['top', 'right', 'bottom', 'left'],
}) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: backgroundColor || theme.colors.background,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
    ...(padding && { padding: theme.spacing.md }),
  };

  const renderContent = () => {
    if (scroll) {
      return (
        <ScrollView
          style={containerStyle}
          contentContainerStyle={padding ? { padding: theme.spacing.md } : undefined}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      );
    }

    return <View style={contentStyle}>{children}</View>;
  };

  const content = keyboardAware ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {renderContent()}
    </KeyboardAvoidingView>
  ) : (
    renderContent()
  );

  return (
    <SafeAreaView style={containerStyle} edges={edges}>
      {content}
    </SafeAreaView>
  );
};
