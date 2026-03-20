import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchMessages, fetchAnnouncements, markMessageAsRead } from '@store/slices/parentSlice';
import { isDemoUser, demoDataApi } from '../../api/demoDataApi';
import { TeacherMessage, Announcement } from '../../types/parent';

type TabType = 'messages' | 'announcements';

export const CommunicationScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, announcements } = useAppSelector((state) => state.parent);

  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demoMessages, setDemoMessages] = useState<TeacherMessage[]>([]);
  const [demoAnnouncements, setDemoAnnouncements] = useState<Announcement[]>([]);

  const isDemo = isDemoUser();
  const displayMessages = isDemo ? demoMessages : messages;
  const displayAnnouncements = isDemo ? demoAnnouncements : announcements;

  useEffect(() => {
    loadCommunicationData();
  }, []);

  const loadCommunicationData = async () => {
    setIsLoading(true);
    try {
      if (isDemoUser()) {
        const [messagesData, announcementsData] = await Promise.all([
          demoDataApi.parent.getMessages(),
          demoDataApi.parent.getAnnouncements(),
        ]);
        setDemoMessages(messagesData);
        setDemoAnnouncements(announcementsData);
      } else {
        await Promise.all([dispatch(fetchMessages()), dispatch(fetchAnnouncements())]);
      }
    } catch (error) {
      console.error('Failed to load communication data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommunicationData();
    setRefreshing(false);
  };

  const handleMessagePress = async (messageId: number, isRead: boolean) => {
    if (!isRead) {
      try {
        if (isDemoUser()) {
          const updatedMessages = demoMessages.map((msg) =>
            msg.id === messageId ? { ...msg, read: true } : msg
          );
          setDemoMessages(updatedMessages);
        } else {
          await dispatch(markMessageAsRead(messageId));
        }
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const renderMessages = () => {
    const unreadMessages = displayMessages.filter((m) => !m.read);
    const readMessages = displayMessages.filter((m) => m.read);

    return (
      <View style={styles.tabContent}>
        {unreadMessages.length > 0 && (
          <>
            <Text style={styles.categoryTitle}>Unread Messages ({unreadMessages.length})</Text>
            {unreadMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                style={[styles.messageCard, !message.read && styles.messageUnread]}
                onPress={() => handleMessagePress(message.id, message.read)}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.messageSender}>
                    <Text style={styles.messageSenderName}>{message.sender_name}</Text>
                    <Text style={styles.messageSenderRole}>{message.sender_role}</Text>
                  </View>
                  {message.priority && (
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(message.priority) },
                      ]}
                    >
                      <Text style={styles.priorityText}>{message.priority}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.messageSubject}>{message.subject}</Text>
                <Text style={styles.messageText} numberOfLines={2}>
                  {message.message}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(message.sent_at).toLocaleString()}
                </Text>
                {!message.read && <View style={styles.unreadIndicator} />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {readMessages.length > 0 && (
          <>
            <Text style={styles.categoryTitle}>Read Messages</Text>
            {readMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                style={styles.messageCard}
                onPress={() => handleMessagePress(message.id, message.read)}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.messageSender}>
                    <Text style={styles.messageSenderName}>{message.sender_name}</Text>
                    <Text style={styles.messageSenderRole}>{message.sender_role}</Text>
                  </View>
                  {message.priority && (
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(message.priority) },
                      ]}
                    >
                      <Text style={styles.priorityText}>{message.priority}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.messageSubject}>{message.subject}</Text>
                <Text style={styles.messageText} numberOfLines={2}>
                  {message.message}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(message.sent_at).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {displayMessages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAnnouncements = () => {
    const importantAnnouncements = displayAnnouncements.filter((a) => a.is_important);
    const regularAnnouncements = displayAnnouncements.filter((a) => !a.is_important);

    return (
      <View style={styles.tabContent}>
        {importantAnnouncements.length > 0 && (
          <>
            <Text style={styles.categoryTitle}>Important Announcements</Text>
            {importantAnnouncements.map((announcement) => (
              <View
                key={announcement.id}
                style={[styles.announcementCard, styles.announcementImportant]}
              >
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementTitle}>📌 {announcement.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{announcement.category}</Text>
                  </View>
                </View>
                <Text style={styles.announcementContent}>{announcement.content}</Text>
                <View style={styles.announcementFooter}>
                  <Text style={styles.announcementAuthor}>By: {announcement.posted_by}</Text>
                  <Text style={styles.announcementTime}>
                    {new Date(announcement.posted_at).toLocaleDateString()}
                  </Text>
                </View>
                {announcement.attachments && announcement.attachments.length > 0 && (
                  <View style={styles.attachments}>
                    <Text style={styles.attachmentsLabel}>
                      📎 {announcement.attachments.length} attachment(s)
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {regularAnnouncements.length > 0 && (
          <>
            <Text style={styles.categoryTitle}>All Announcements</Text>
            {regularAnnouncements.map((announcement) => (
              <View key={announcement.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{announcement.category}</Text>
                  </View>
                </View>
                <Text style={styles.announcementContent}>{announcement.content}</Text>
                <View style={styles.announcementFooter}>
                  <Text style={styles.announcementAuthor}>By: {announcement.posted_by}</Text>
                  <Text style={styles.announcementTime}>
                    {new Date(announcement.posted_at).toLocaleDateString()}
                  </Text>
                </View>
                {announcement.attachments && announcement.attachments.length > 0 && (
                  <View style={styles.attachments}>
                    <Text style={styles.attachmentsLabel}>
                      📎 {announcement.attachments.length} attachment(s)
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {displayAnnouncements.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>No announcements yet</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5856D6" />
      </View>
    );
  }

  const unreadCount = displayMessages.filter((m) => !m.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communication</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Messages
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.tabActive]}
          onPress={() => setActiveTab('announcements')}
        >
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.tabTextActive]}>
            Announcements
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {activeTab === 'messages' ? renderMessages() : renderAnnouncements()}
      </ScrollView>
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
  header: {
    backgroundColor: '#5856D6',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#5856D6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#5856D6',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 12,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  messageUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#5856D6',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageSender: {
    flex: 1,
  },
  messageSenderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  messageSenderRole: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5856D6',
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementImportant: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  announcementContent: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementAuthor: {
    fontSize: 12,
    color: '#8E8E93',
  },
  announcementTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  attachments: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  attachmentsLabel: {
    fontSize: 12,
    color: '#5856D6',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
