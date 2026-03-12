import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Button,
  Chip,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { ExitToApp, Settings, People, Chat, Folder, Timeline } from '@mui/icons-material';
import {
  GroupChatInterface,
  MemberManagement,
  ResourceLibrary,
  GroupActivityFeed,
} from '../components/studyGroups';
import studyGroupsApi from '../api/studyGroups';
import {
  StudyGroup,
  GroupMember,
  GroupMessage,
  GroupResource,
  GroupActivity,
  GroupMemberRole,
} from '../types/studyGroup';

const StudyGroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const currentUserId = 1;

  useEffect(() => {
    if (groupId) {
      const id = parseInt(groupId);
      loadGroup(id);
      loadMembers(id);
      loadMessages(id);
      loadResources(id);
      loadActivities(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadGroup = async (id: number) => {
    try {
      const data = await studyGroupsApi.getGroup(id);
      setGroup(data);
    } catch (error) {
      showSnackbar('Failed to load group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (id: number) => {
    try {
      const data = await studyGroupsApi.getMembers(id);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadMessages = async (id: number) => {
    try {
      const response = await studyGroupsApi.getMessages(id);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadResources = async (id: number) => {
    try {
      const data = await studyGroupsApi.getResources(id);
      setResources(data);
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const loadActivities = async (id: number) => {
    try {
      const data = await studyGroupsApi.getActivities(id);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleSendMessage = async (content: string, attachments: File[], replyToId?: number) => {
    if (!group) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('message_type', 'text');
      if (replyToId) formData.append('reply_to_id', String(replyToId));
      attachments.forEach((file) => formData.append('attachments', file));

      await studyGroupsApi.sendMessage(group.id, formData);
      loadMessages(group.id);
      loadActivities(group.id);
    } catch (error) {
      showSnackbar('Failed to send message', 'error');
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await studyGroupsApi.deleteMessage(messageId);
      showSnackbar('Message deleted', 'success');
      if (group) loadMessages(group.id);
    } catch (error) {
      showSnackbar('Failed to delete message', 'error');
    }
  };

  const handlePinMessage = async (messageId: number) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (message?.is_pinned) {
        await studyGroupsApi.unpinMessage(messageId);
        showSnackbar('Message unpinned', 'success');
      } else {
        await studyGroupsApi.pinMessage(messageId);
        showSnackbar('Message pinned', 'success');
      }
      if (group) loadMessages(group.id);
    } catch (error) {
      showSnackbar('Failed to update pin status', 'error');
    }
  };

  const handleUpdateMemberRole = async (memberId: number, role: GroupMemberRole) => {
    if (!group) return;

    try {
      await studyGroupsApi.updateMemberRole(group.id, memberId, role);
      showSnackbar('Member role updated', 'success');
      loadMembers(group.id);
      loadActivities(group.id);
    } catch (error) {
      showSnackbar('Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!group) return;

    try {
      await studyGroupsApi.removeMember(group.id, memberId);
      showSnackbar('Member removed', 'success');
      loadMembers(group.id);
      loadActivities(group.id);
    } catch (error) {
      showSnackbar('Failed to remove member', 'error');
    }
  };

  const handleUploadResource = async (title: string, description: string, file: File) => {
    if (!group) return;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);

      await studyGroupsApi.uploadResource(group.id, formData);
      showSnackbar('Resource uploaded successfully', 'success');
      loadResources(group.id);
      loadActivities(group.id);
    } catch (error) {
      showSnackbar('Failed to upload resource', 'error');
      throw error;
    }
  };

  const handleDownloadResource = async (resourceId: number) => {
    try {
      const response = await studyGroupsApi.downloadResource(resourceId);
      window.open(response.download_url, '_blank');
      if (group) loadResources(group.id);
    } catch (error) {
      showSnackbar('Failed to download resource', 'error');
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    try {
      await studyGroupsApi.deleteResource(resourceId);
      showSnackbar('Resource deleted', 'success');
      if (group) loadResources(group.id);
    } catch (error) {
      showSnackbar('Failed to delete resource', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await studyGroupsApi.leaveGroup(group.id);
      showSnackbar('Left group successfully', 'success');
      window.location.href = '/study-groups';
    } catch (error) {
      showSnackbar('Failed to leave group', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading || !group) {
    return <Container>Loading...</Container>;
  }

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const canManage =
    currentMember?.role === GroupMemberRole.OWNER || currentMember?.role === GroupMemberRole.ADMIN;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="flex-start">
          {group.cover_image_url && (
            <Box
              sx={{
                width: '100%',
                height: 200,
                backgroundImage: `url(${group.cover_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 2,
                mb: 2,
              }}
            />
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={2} alignItems="center">
            <Avatar src={group.avatar_url} alt={group.name} sx={{ width: 80, height: 80 }}>
              {group.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h4">{group.name}</Typography>
              <Typography color="text.secondary" gutterBottom>
                {group.description}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                {group.subject_name && (
                  <Chip label={group.subject_name} color="primary" size="small" />
                )}
                {group.chapter_name && <Chip label={group.chapter_name} size="small" />}
                <Chip label={`${group.member_count} members`} icon={<People />} size="small" />
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            {canManage && (
              <Button variant="outlined" startIcon={<Settings />}>
                Settings
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<ExitToApp />}
              onClick={handleLeaveGroup}
            >
              Leave
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
              <Tab icon={<Chat />} label="Chat" />
              <Tab icon={<Folder />} label="Resources" />
              <Tab icon={<Timeline />} label="Activity" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {tabValue === 0 && (
                <GroupChatInterface
                  groupId={group.id}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={canManage ? handleDeleteMessage : undefined}
                  onPinMessage={canManage ? handlePinMessage : undefined}
                  currentUserId={currentUserId}
                />
              )}

              {tabValue === 1 && (
                <ResourceLibrary
                  resources={resources}
                  canUpload={true}
                  onUpload={handleUploadResource}
                  onDownload={handleDownloadResource}
                  onDelete={canManage ? handleDeleteResource : undefined}
                />
              )}

              {tabValue === 2 && <GroupActivityFeed activities={activities} />}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <MemberManagement
            members={members}
            currentUserRole={currentMember?.role || GroupMemberRole.MEMBER}
            currentUserId={currentUserId}
            onUpdateRole={canManage ? handleUpdateMemberRole : undefined}
            onRemoveMember={canManage ? handleRemoveMember : undefined}
          />
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StudyGroupDetail;
