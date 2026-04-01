import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Collapse,
  List,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Forum as ForumIcon,
  Reply as ReplyIcon,
  Send as SendIcon,
  PushPin as PinIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentEducationApi } from '@/api/parentEducation';
import { useToast } from '@/hooks/useToast';

export const ParentCourseDiscussions: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());

  const {
    data: discussions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['course-discussions', courseId],
    queryFn: () => parentEducationApi.getDiscussionThreads(Number(courseId)),
    enabled: !!courseId,
  });

  const { data: threadReplies = [] } = useQuery({
    queryKey: ['thread-replies', selectedThreadId],
    queryFn: () => parentEducationApi.getThreadReplies(selectedThreadId!),
    enabled: !!selectedThreadId,
  });

  const createThreadMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      parentEducationApi.createDiscussionThread(Number(courseId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-discussions'] });
      setNewThreadDialogOpen(false);
      setThreadTitle('');
      setThreadContent('');
      toast.success('Discussion created successfully!');
    },
    onError: () => {
      toast.error('Failed to create discussion');
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: (data: { threadId: number; content: string; parentId?: number }) =>
      parentEducationApi.createThreadReply(data.threadId, {
        content: data.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-replies'] });
      queryClient.invalidateQueries({ queryKey: ['course-discussions'] });
      setReplyContent('');
      toast.success('Reply posted successfully!');
    },
    onError: () => {
      toast.error('Failed to post reply');
    },
  });

  const handleCreateThread = () => {
    if (!threadTitle.trim() || !threadContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createThreadMutation.mutate({ title: threadTitle, content: threadContent });
  };

  const handleReply = (threadId: number, parentId?: number) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    createReplyMutation.mutate({ threadId, content: replyContent, parentId });
  };

  const toggleThread = (threadId: number) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
        }
      } else {
        newSet.add(threadId);
        setSelectedThreadId(threadId);
      }
      return newSet;
    });
  };

  const filteredDiscussions = discussions
    .filter((thread) => {
      if (searchQuery) {
        return (
          thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter((thread) => {
      if (filterType === 'pinned') return thread.is_pinned;
      if (filterType === 'answered') {
        // Assuming a thread with is_answer=true in replies is answered
        return false; // Simplified for now
      }
      return true;
    });

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load discussions
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Course Discussions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connect with fellow parents and instructors
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewThreadDialogOpen(true)}
          >
            New Discussion
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterType}
                onChange={(e: SelectChangeEvent) => setFilterType(e.target.value)}
                label="Filter"
              >
                <MenuItem value="all">All Discussions</MenuItem>
                <MenuItem value="pinned">Pinned</MenuItem>
                <MenuItem value="answered">Answered</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Discussion List */}
        {filteredDiscussions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ForumIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No discussions found
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewThreadDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Start the First Discussion
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredDiscussions.map((thread) => (
              <Card key={thread.id} sx={{ mb: 2 }}>
                <CardContent>
                  {/* Thread Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar src={thread.parent_photo_url} sx={{ width: 48, height: 48 }}>
                      {thread.parent_name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {thread.title}
                        </Typography>
                        {thread.is_pinned && (
                          <Chip
                            icon={<PinIcon />}
                            label="Pinned"
                            size="small"
                            color="primary"
                            sx={{ height: 20 }}
                          />
                        )}
                        {thread.is_locked && (
                          <Chip
                            icon={<LockIcon />}
                            label="Locked"
                            size="small"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {thread.parent_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(thread.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton onClick={() => toggleThread(thread.id)}>
                      {expandedThreads.has(thread.id) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Thread Content */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {thread.content}
                  </Typography>

                  {/* Thread Stats */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                      icon={<ReplyIcon />}
                      label={`${thread.reply_count} replies`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip label={`${thread.view_count} views`} size="small" variant="outlined" />
                  </Box>

                  {/* Replies Section */}
                  <Collapse in={expandedThreads.has(thread.id)}>
                    <Divider sx={{ my: 2 }} />

                    {/* Reply List */}
                    {selectedThreadId === thread.id && (
                      <Box sx={{ pl: 6, mb: 2 }}>
                        {threadReplies.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No replies yet. Be the first to reply!
                          </Typography>
                        ) : (
                          threadReplies.map((reply) => (
                            <Box key={reply.id} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <Avatar src={reply.user_photo_url} sx={{ width: 32, height: 32 }}>
                                  {(reply.user_name || 'U').charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {reply.user_name}
                                    </Typography>
                                    {reply.user_role === 'teacher' && (
                                      <Chip
                                        label="Teacher"
                                        size="small"
                                        color="primary"
                                        sx={{ height: 18, fontSize: '0.65rem' }}
                                      />
                                    )}
                                    {reply.user_role === 'counselor' && (
                                      <Chip
                                        label="Counselor"
                                        size="small"
                                        color="secondary"
                                        sx={{ height: 18, fontSize: '0.65rem' }}
                                      />
                                    )}
                                    {reply.is_answer && (
                                      <Chip
                                        icon={<CheckCircleIcon />}
                                        label="Answer"
                                        size="small"
                                        color="success"
                                        sx={{ height: 18, fontSize: '0.65rem' }}
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {reply.content}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          ))
                        )}
                      </Box>
                    )}

                    {/* Reply Input */}
                    {!thread.is_locked && (
                      <Box sx={{ pl: 6 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SendIcon />}
                          onClick={() => handleReply(thread.id)}
                          disabled={!replyContent.trim()}
                        >
                          Post Reply
                        </Button>
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Box>

      {/* New Thread Dialog */}
      <Dialog
        open={newThreadDialogOpen}
        onClose={() => setNewThreadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Start New Discussion</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={threadTitle}
            onChange={(e) => setThreadTitle(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Content"
            value={threadContent}
            onChange={(e) => setThreadContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewThreadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateThread}
            disabled={createThreadMutation.isPending}
          >
            {createThreadMutation.isPending ? 'Creating...' : 'Create Discussion'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ParentCourseDiscussions;
