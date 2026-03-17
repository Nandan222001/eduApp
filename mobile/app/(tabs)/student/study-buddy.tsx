import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Text, Icon, Button } from '@rneui/themed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { studentApi } from '../../../src/api/student';
import { Card } from '../../../src/components/Card';

// Note: expo-speech will need to be installed via: npm install expo-speech
// Placeholder for Speech API - will work once package is installed
const Speech = {
  speak: (text: string, _options?: Record<string, unknown>) => {
    console.log('Speech would be spoken:', text);
  },
};

export default function StudyBuddyScreen() {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'briefing'>('chat');
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const { data: chatHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['study-buddy-history'],
    queryFn: async () => {
      const response = await studentApi.getStudyBuddyHistory();
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });

  const {
    data: studyPlan,
    isLoading: isLoadingPlan,
    refetch: refetchPlan,
  } = useQuery({
    queryKey: ['study-plan'],
    queryFn: async () => {
      const response = await studentApi.getPersonalizedStudyPlan();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'plan',
  });

  const {
    data: dailyBriefing,
    isLoading: isLoadingBriefing,
    refetch: refetchBriefing,
  } = useQuery({
    queryKey: ['daily-briefing'],
    queryFn: async () => {
      const response = await studentApi.getDailyBriefing();
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
    enabled: activeTab === 'briefing',
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, isVoice }: { text: string; isVoice: boolean }) => {
      const response = await studentApi.sendStudyBuddyMessage(text, isVoice);
      return response.data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['study-buddy-history'] });
      if (data.reply.content) {
        Speech.speak(data.reply.content, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      }
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate({ text: message.trim(), isVoice: false });
      setMessage('');
    }
  };

  const handleVoiceInput = async () => {
    setIsListening(true);
    try {
      Speech.speak('I am listening...', { language: 'en' });
      setTimeout(() => {
        setIsListening(false);
        setMessage('Voice input would be processed here');
      }, 2000);
    } catch (error) {
      console.error('Voice input error:', error);
      setIsListening(false);
    }
  };

  const handleQuickMessage = (quickMessage: string) => {
    setMessage(quickMessage);
  };

  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory]);

  const renderChatTab = () => (
    <View style={styles.chatContainer}>
      <Card style={styles.quickMessagesCard}>
        <Text style={styles.quickMessagesTitle}>Quick Questions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.quickMessagesContainer}>
            {[
              'Create a study plan for Math',
              'What should I focus on today?',
              'Give me a motivational quote',
              'Quiz me on Science',
            ].map((quickMsg, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickMessageChip}
                onPress={() => handleQuickMessage(quickMsg)}
              >
                <Text style={styles.quickMessageText}>{quickMsg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Card>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : chatHistory.length === 0 ? (
          <View style={styles.emptyChat}>
            <Icon name="message-circle" type="feather" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyChatTitle}>Start a conversation!</Text>
            <Text style={styles.emptyChatText}>
              Ask me anything about your studies, get personalized advice, or just chat for
              motivation
            </Text>
          </View>
        ) : (
          chatHistory.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                {msg.role === 'assistant' && (
                  <View style={styles.assistantIcon}>
                    <Icon name="cpu" type="feather" size={16} color={COLORS.primary} />
                  </View>
                )}
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                  ]}
                >
                  {msg.content}
                </Text>
                {msg.isVoice && (
                  <Icon
                    name="mic"
                    type="feather"
                    size={14}
                    color={msg.role === 'user' ? COLORS.background : COLORS.primary}
                    style={styles.voiceIcon}
                  />
                )}
              </View>
              <Text style={styles.messageTime}>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))
        )}
        {sendMessageMutation.isPending && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.typingText}>Study Buddy is thinking...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderStudyPlanTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      {isLoadingPlan ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your study plan...</Text>
        </View>
      ) : studyPlan ? (
        <>
          <Card style={styles.card}>
            <View style={styles.planHeader}>
              <Icon name="book-open" type="feather" size={24} color={COLORS.primary} />
              <View style={styles.planHeaderText}>
                <Text style={styles.planTitle}>{studyPlan.title}</Text>
                <Text style={styles.planSubject}>{studyPlan.subject}</Text>
              </View>
              <View style={styles.durationBadge}>
                <Icon name="clock" type="feather" size={14} color={COLORS.primary} />
                <Text style={styles.durationText}>{studyPlan.duration} min</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            {studyPlan.tasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskCheckbox}>
                  {task.completed ? (
                    <Icon name="check-circle" type="feather" size={20} color={COLORS.success} />
                  ) : (
                    <Icon name="circle" type="feather" size={20} color={COLORS.border} />
                  )}
                </View>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskTime}>{task.estimatedTime} minutes</Text>
                </View>
              </View>
            ))}
          </Card>

          <Button
            title="Generate New Plan"
            onPress={() => refetchPlan()}
            buttonStyle={styles.refreshButton}
            icon={<Icon name="refresh-cw" type="feather" size={20} color={COLORS.background} />}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="book" type="feather" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateTitle}>No Study Plan Yet</Text>
          <Text style={styles.emptyStateText}>
            Get a personalized study plan based on your upcoming tests and weak areas
          </Text>
          <Button
            title="Generate Study Plan"
            onPress={() => refetchPlan()}
            buttonStyle={styles.generateButton}
            icon={<Icon name="plus" type="feather" size={20} color={COLORS.background} />}
          />
        </View>
      )}
    </ScrollView>
  );

  const renderDailyBriefingTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      {isLoadingBriefing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading daily briefing...</Text>
        </View>
      ) : dailyBriefing ? (
        <>
          <Card style={styles.card}>
            <View style={styles.briefingHeader}>
              <Icon name="sunrise" type="feather" size={24} color={COLORS.warning} />
              <Text style={styles.briefingTitle}>
                Daily Briefing - {new Date(dailyBriefing.date).toLocaleDateString()}
              </Text>
            </View>
          </Card>

          {dailyBriefing.upcomingTests.length > 0 && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <Icon name="alert-circle" type="feather" size={20} color={COLORS.error} />
                <Text style={styles.sectionTitle}>Upcoming Tests</Text>
              </View>
              {dailyBriefing.upcomingTests.map((test, index) => (
                <View key={index} style={styles.testItem}>
                  <View style={styles.testIcon}>
                    <Icon name="file-text" type="feather" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.testInfo}>
                    <Text style={styles.testSubject}>{test.subject}</Text>
                    <Text style={styles.testDate}>{new Date(test.date).toLocaleDateString()}</Text>
                  </View>
                  <View
                    style={[
                      styles.daysRemainingBadge,
                      test.daysRemaining <= 3 && styles.daysRemainingUrgent,
                    ]}
                  >
                    <Text style={styles.daysRemainingText}>{test.daysRemaining}d</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="check-square" type="feather" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Pending Assignments</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dailyBriefing.pendingAssignments}</Text>
              <Text style={styles.statLabel}>assignments to complete</Text>
            </View>
          </Card>

          {dailyBriefing.focusTopics.length > 0 && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <Icon name="target" type="feather" size={20} color={COLORS.warning} />
                <Text style={styles.sectionTitle}>Today's Focus Topics</Text>
              </View>
              <View style={styles.topicsContainer}>
                {dailyBriefing.focusTopics.map((topic, index) => (
                  <View key={index} style={styles.topicChip}>
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          <Card style={styles.motivationCard}>
            <View style={styles.motivationHeader}>
              <Icon name="zap" type="feather" size={24} color={COLORS.warning} />
              <Text style={styles.motivationTitle}>Motivation</Text>
            </View>
            <Text style={styles.motivationText}>{dailyBriefing.motivationalMessage}</Text>
          </Card>

          <Button
            title="Refresh Briefing"
            onPress={() => refetchBriefing()}
            buttonStyle={styles.refreshButton}
            icon={<Icon name="refresh-cw" type="feather" size={20} color={COLORS.background} />}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="sun" type="feather" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateTitle}>No Briefing Available</Text>
          <Text style={styles.emptyStateText}>
            Get your personalized daily briefing with upcoming tests, assignments, and motivation
          </Text>
          <Button
            title="Load Briefing"
            onPress={() => refetchBriefing()}
            buttonStyle={styles.generateButton}
            icon={<Icon name="download" type="feather" size={20} color={COLORS.background} />}
          />
        </View>
      )}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Icon
            name="message-circle"
            type="feather"
            size={20}
            color={activeTab === 'chat' ? COLORS.background : COLORS.text}
          />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plan' && styles.activeTab]}
          onPress={() => setActiveTab('plan')}
        >
          <Icon
            name="book-open"
            type="feather"
            size={20}
            color={activeTab === 'plan' ? COLORS.background : COLORS.text}
          />
          <Text style={[styles.tabText, activeTab === 'plan' && styles.activeTabText]}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'briefing' && styles.activeTab]}
          onPress={() => setActiveTab('briefing')}
        >
          <Icon
            name="sunrise"
            type="feather"
            size={20}
            color={activeTab === 'briefing' ? COLORS.background : COLORS.text}
          />
          <Text style={[styles.tabText, activeTab === 'briefing' && styles.activeTabText]}>
            Briefing
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' && renderChatTab()}
      {activeTab === 'plan' && renderStudyPlanTab()}
      {activeTab === 'briefing' && renderDailyBriefingTab()}

      {activeTab === 'chat' && (
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={handleVoiceInput}
            disabled={isListening}
          >
            <Icon
              name={isListening ? 'mic' : 'mic-off'}
              type="feather"
              size={20}
              color={isListening ? COLORS.background : COLORS.primary}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask your Study Buddy..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            editable={!sendMessageMutation.isPending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Icon name="send" type="feather" size={20} color={COLORS.background} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.background,
  },
  chatContainer: {
    flex: 1,
  },
  quickMessagesCard: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  quickMessagesTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  quickMessagesContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickMessageChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickMessageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyChatTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyChatText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageWrapper: {
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  assistantMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
  },
  userMessage: {
    backgroundColor: COLORS.primary,
  },
  assistantMessage: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assistantIcon: {
    position: 'absolute',
    top: -8,
    left: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.background,
  },
  assistantMessageText: {
    color: COLORS.text,
  },
  voiceIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.xs,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  typingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: COLORS.primary,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  planHeaderText: {
    flex: 1,
  },
  planTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  planSubject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
  },
  durationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  taskTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  briefingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  testIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testInfo: {
    flex: 1,
  },
  testSubject: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  testDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  daysRemainingBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.sm,
  },
  daysRemainingUrgent: {
    backgroundColor: COLORS.error,
  },
  daysRemainingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  statCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  topicChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  topicText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: '600',
  },
  motivationCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.warning + '20',
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  motivationTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  motivationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
