import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  Tabs,
  Tab,
  Badge,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  DragIndicator as DragIcon,
  Publish as PublishIcon,
  Schedule as ScheduleIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';

interface Submission {
  id: number;
  title: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  submittedDate: string;
  wordCount: number;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  comments: number;
  priority: 'high' | 'medium' | 'low';
}

interface EditionSection {
  id: string;
  title: string;
  articles: {
    id: number;
    title: string;
    author: string;
    wordCount: number;
  }[];
}

const mockSubmissions: Submission[] = [
  {
    id: 1,
    title: 'Climate Change and Student Activism',
    author: { name: 'Sarah Johnson', avatar: '' },
    category: 'opinion',
    submittedDate: '2024-03-15',
    wordCount: 1200,
    status: 'pending',
    comments: 2,
    priority: 'high',
  },
  {
    id: 2,
    title: 'Soccer Team Championship Win',
    author: { name: 'Mike Chen', avatar: '' },
    category: 'sports',
    submittedDate: '2024-03-14',
    wordCount: 900,
    status: 'reviewing',
    comments: 5,
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Spring Concert Preparations',
    author: { name: 'Emily Davis', avatar: '' },
    category: 'arts',
    submittedDate: '2024-03-13',
    wordCount: 750,
    status: 'approved',
    comments: 1,
    priority: 'low',
  },
];

const initialSections: EditionSection[] = [
  {
    id: 'news',
    title: 'News',
    articles: [
      { id: 101, title: 'School Funding Update', author: 'John Doe', wordCount: 800 },
      { id: 102, title: 'New Principal Announcement', author: 'Jane Smith', wordCount: 650 },
    ],
  },
  {
    id: 'sports',
    title: 'Sports',
    articles: [{ id: 201, title: 'Basketball Season Recap', author: 'Mike Chen', wordCount: 950 }],
  },
  {
    id: 'opinion',
    title: 'Opinion',
    articles: [],
  },
  {
    id: 'arts',
    title: 'Arts & Culture',
    articles: [
      { id: 301, title: 'Theater Production Review', author: 'Emily Davis', wordCount: 700 },
    ],
  },
];

export default function NewspaperEditor() {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [sections, setSections] = useState(initialSections);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [inlineComment, setInlineComment] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedArticleMenu, setSelectedArticleMenu] = useState<number | null>(null);
  const [publishForm, setPublishForm] = useState({
    date: '',
    time: '',
    edition: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewing':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleApprove = (id: number) => {
    setSubmissions(
      submissions.map((s) => (s.id === id ? { ...s, status: 'approved' as const } : s))
    );
    setReviewDialogOpen(false);
  };

  const handleReject = (id: number) => {
    setSubmissions(
      submissions.map((s) => (s.id === id ? { ...s, status: 'rejected' as const } : s))
    );
    setReviewDialogOpen(false);
  };

  const handleAddComment = () => {
    console.log('Adding comment:', inlineComment);
    setInlineComment('');
  };

  const moveArticle = (sectionId: string, articleIndex: number, direction: 'up' | 'down') => {
    setSections(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        const articles = [...section.articles];
        const newIndex = direction === 'up' ? articleIndex - 1 : articleIndex + 1;
        if (newIndex < 0 || newIndex >= articles.length) return section;
        [articles[articleIndex], articles[newIndex]] = [articles[newIndex], articles[articleIndex]];
        return { ...section, articles };
      })
    );
  };

  const removeArticle = (sectionId: string, articleId: number) => {
    setSections(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        return { ...section, articles: section.articles.filter((a) => a.id !== articleId) };
      })
    );
  };

  const handlePublish = () => {
    console.log('Publishing edition:', publishForm);
    setPublishDialogOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, articleId: number) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedArticleMenu(articleId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedArticleMenu(null);
  };

  const filteredSubmissions =
    selectedTab === 0
      ? submissions
      : submissions.filter((s) => {
          if (selectedTab === 1) return s.status === 'pending';
          if (selectedTab === 2) return s.status === 'reviewing';
          if (selectedTab === 3) return s.status === 'approved';
          return false;
        });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Editor Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review submissions and manage publication
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PublishIcon />}
          onClick={() => setPublishDialogOpen(true)}
        >
          Publish Edition
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardHeader
              title={
                <Badge
                  badgeContent={submissions.filter((s) => s.status === 'pending').length}
                  color="error"
                >
                  <Typography variant="h6">Submission Queue</Typography>
                </Badge>
              }
              action={
                <IconButton>
                  <FilterIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
                <Tab label="All" />
                <Tab label="Pending" />
                <Tab label="Reviewing" />
                <Tab label="Approved" />
              </Tabs>

              <List>
                {filteredSubmissions.map((submission) => (
                  <Paper
                    key={submission.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderLeft: `4px solid ${getPriorityColor(submission.priority)}`,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={submission.author.avatar} sx={{ width: 32, height: 32 }}>
                          {submission.author.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {submission.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {submission.author.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={submission.status}
                        size="small"
                        color={
                          getStatusColor(submission.status) as
                            | 'warning'
                            | 'info'
                            | 'success'
                            | 'error'
                            | 'default'
                        }
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Chip
                        label={submission.category.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {submission.wordCount} words
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(submission.submittedDate).toLocaleDateString()}
                      </Typography>
                      <Chip
                        icon={<CommentIcon />}
                        label={submission.comments}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<PreviewIcon />}
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setReviewDialogOpen(true);
                        }}
                      >
                        Review
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ApproveIcon />}
                        color="success"
                        onClick={() => handleApprove(submission.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        startIcon={<RejectIcon />}
                        color="error"
                        onClick={() => handleReject(submission.id)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card>
            <CardHeader
              title="Edition Planner"
              subheader="Organize articles by section"
              action={
                <IconButton>
                  <ScheduleIcon />
                </IconButton>
              }
            />
            <CardContent>
              {sections.map((section) => (
                <Box key={section.id} sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {section.title}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                    {section.articles.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        No articles in this section
                      </Typography>
                    ) : (
                      section.articles.map((article, index) => (
                        <Paper
                          key={article.id}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            border: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <DragIcon sx={{ color: 'text.secondary' }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {article.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {article.author} • {article.wordCount} words
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => moveArticle(section.id, index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUpIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => moveArticle(section.id, index, 'down')}
                              disabled={index === section.articles.length - 1}
                            >
                              <ArrowDownIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, article.id)}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))
                    )}
                  </Paper>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Article</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {selectedSubmission.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={selectedSubmission.category.toUpperCase()} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    by {selectedSubmission.author.name}
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info">
                This is a preview of the article content. Use the comment section below to provide
                feedback.
              </Alert>

              <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
                <Typography variant="body1">
                  [Article content would be displayed here for review...]
                </Typography>
              </Paper>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Inline Comments
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add feedback or suggestions..."
                  value={inlineComment}
                  onChange={(e) => setInlineComment(e.target.value)}
                />
                <Button
                  startIcon={<SendIcon />}
                  sx={{ mt: 1 }}
                  onClick={handleAddComment}
                  disabled={!inlineComment}
                >
                  Add Comment
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
          <Button
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => selectedSubmission && handleReject(selectedSubmission.id)}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => selectedSubmission && handleApprove(selectedSubmission.id)}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Publish Edition</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Edition Name"
              value={publishForm.edition}
              onChange={(e) => setPublishForm({ ...publishForm, edition: e.target.value })}
              placeholder="e.g., April 2024 Edition"
            />
            <TextField
              fullWidth
              type="date"
              label="Publication Date"
              value={publishForm.date}
              onChange={(e) => setPublishForm({ ...publishForm, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="time"
              label="Publication Time"
              value={publishForm.time}
              onChange={(e) => setPublishForm({ ...publishForm, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <Alert severity="warning">
              This will publish all approved articles in the current edition layout.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<PublishIcon />} onClick={handlePublish}>
            Schedule Publication
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PreviewIcon fontSize="small" sx={{ mr: 1 }} /> Preview
        </MenuItem>
        <MenuItem
          onClick={() => {
            const section = sections.find((s) =>
              s.articles.some((a) => a.id === selectedArticleMenu)
            );
            if (section && selectedArticleMenu) {
              removeArticle(section.id, selectedArticleMenu);
            }
            handleMenuClose();
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Remove
        </MenuItem>
      </Menu>
    </Container>
  );
}
