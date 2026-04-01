import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  IconButton,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AutoAwesome as AIIcon,
  History as HistoryIcon,
  RateReview as ReviewIcon,
  LibraryBooks as LibraryIcon,
  Psychology as PsychologyIcon,
  Spellcheck as GrammarIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatBold as BoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
} from '@mui/icons-material';
import { scholarshipEssayApi } from '@/api/scholarshipEssay';
import { useAuth } from '@/hooks/useAuth';
import type {
  EssayPrompt,
  SavedEssay,
  EssayVersion,
  AISuggestion,
  GrammarIssue,
} from '@/types/scholarshipEssay';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ mt: 3 }}>{children}</Box>}
    </div>
  );
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  wordCount: number;
  wordLimit: number;
  grammarIssues: GrammarIssue[];
  aiSuggestions: AISuggestion[];
  onCheckGrammar: () => void;
  onGenerateAISuggestions: () => void;
}

function RichTextEditor({
  content,
  onChange,
  onSave,
  wordCount,
  wordLimit,
  grammarIssues,
  aiSuggestions,
  onCheckGrammar,
  onGenerateAISuggestions,
}: RichTextEditorProps) {
  const theme = useTheme();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = selectedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    onChange(newContent);
  };

  const wordCountPercentage = (wordCount / wordLimit) * 100;
  const isOverLimit = wordCount > wordLimit;

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.default',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={1}>
            <Tooltip title="Bold">
              <IconButton size="small" onClick={() => applyFormat('bold')}>
                <BoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton size="small" onClick={() => applyFormat('italic')}>
                <FormatItalicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
              <IconButton size="small" onClick={() => applyFormat('underline')}>
                <UnderlineIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Bullet List">
              <IconButton size="small">
                <BulletListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton size="small">
                <NumberListIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Undo">
              <IconButton size="small">
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton size="small">
                <RedoIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<GrammarIcon />}
              onClick={onCheckGrammar}
              variant="outlined"
            >
              Check Grammar
            </Button>
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={onGenerateAISuggestions}
              variant="outlined"
              color="secondary"
            >
              AI Suggestions
            </Button>
            <Button size="small" startIcon={<SaveIcon />} onClick={onSave} variant="contained">
              Save
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        <TextField
          inputRef={editorRef}
          fullWidth
          multiline
          rows={20}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing your essay..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: 1.8,
            },
          }}
        />
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.default',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="body2" color={isOverLimit ? 'error' : 'text.secondary'}>
                Word Count: {wordCount} / {wordLimit}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(wordCountPercentage, 100)}
                sx={{
                  mt: 0.5,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: isOverLimit ? theme.palette.error.main : theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2}>
              <Chip
                icon={<GrammarIcon />}
                label={`${grammarIssues.length} grammar issues`}
                color={grammarIssues.length > 0 ? 'warning' : 'success'}
                size="small"
              />
              <Chip
                icon={<AIIcon />}
                label={`${aiSuggestions.length} AI suggestions`}
                color="secondary"
                size="small"
              />
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export default function ScholarshipEssayCenter() {
  const theme = useTheme();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [prompts, setPrompts] = useState<EssayPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<EssayPrompt[]>([]);
  const [selectedPromptType, setSelectedPromptType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [essays, setEssays] = useState<SavedEssay[]>([]);
  const [selectedEssay, setSelectedEssay] = useState<SavedEssay | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [versions, setVersions] = useState<EssayVersion[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);

  const [showNewEssayDialog, setShowNewEssayDialog] = useState(false);
  const [newEssayData, setNewEssayData] = useState({
    promptId: '',
    title: '',
  });

  useEffect(() => {
    loadData();
    const essayId = searchParams.get('essay');
    if (essayId) {
      loadEssay(essayId);
      setCurrentTab(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    filterPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts, selectedPromptType, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promptsData, essaysData] = await Promise.all([
        scholarshipEssayApi.getPrompts(),
        scholarshipEssayApi.getEssays(user?.id || '1'),
      ]);
      setPrompts(promptsData);
      setEssays(essaysData);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEssay = async (essayId: string) => {
    try {
      const essay = await scholarshipEssayApi.getEssayById(essayId);
      setSelectedEssay(essay);
      setEditingContent(essay.content);
      setAISuggestions(essay.aiSuggestions || []);
      setGrammarIssues(essay.grammarIssues || []);

      const versionsData = await scholarshipEssayApi.getEssayVersions(essayId);
      setVersions(versionsData);
    } catch (err) {
      setError('Failed to load essay');
      console.error(err);
    }
  };

  const filterPrompts = () => {
    let filtered = prompts;

    if (selectedPromptType !== 'all') {
      filtered = filtered.filter((p) => p.type === selectedPromptType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    setFilteredPrompts(filtered);
  };

  const handleCreateEssay = async () => {
    try {
      const prompt = prompts.find((p) => p.id === newEssayData.promptId);
      if (!prompt) return;

      const essay = await scholarshipEssayApi.createEssay({
        promptId: newEssayData.promptId,
        promptTitle: prompt.title,
        title: newEssayData.title,
        content: '',
        wordCount: 0,
        completionStatus: 'not_started',
      });

      setEssays([...essays, essay]);
      setShowNewEssayDialog(false);
      setNewEssayData({ promptId: '', title: '' });
      setSuccess('Essay created successfully');

      setSearchParams({ essay: essay.id });
    } catch (err) {
      setError('Failed to create essay');
      console.error(err);
    }
  };

  const handleSaveEssay = async () => {
    if (!selectedEssay) return;

    try {
      const wordCount = editingContent.trim().split(/\s+/).filter(Boolean).length;

      const updated = await scholarshipEssayApi.updateEssay(selectedEssay.id, {
        content: editingContent,
        wordCount,
      });

      await scholarshipEssayApi.createEssayVersion(selectedEssay.id, editingContent);

      setSelectedEssay(updated);
      setEssays(essays.map((e) => (e.id === updated.id ? updated : e)));
      setSuccess('Essay saved successfully');
    } catch (err) {
      setError('Failed to save essay');
      console.error(err);
    }
  };

  const handleCheckGrammar = async () => {
    if (!selectedEssay) return;

    try {
      const result = await scholarshipEssayApi.checkGrammar({
        text: editingContent,
        language: 'en-US',
      });
      setGrammarIssues(result.matches);
    } catch (err) {
      setError('Failed to check grammar');
      console.error(err);
    }
  };

  const handleGenerateAISuggestions = async () => {
    if (!selectedEssay) return;

    try {
      const suggestions = await scholarshipEssayApi.generateAISuggestions(
        selectedEssay.id,
        editingContent
      );
      setAISuggestions(suggestions);
    } catch (err) {
      setError('Failed to generate AI suggestions');
      console.error(err);
    }
  };

  const handleDeleteEssay = async (essayId: string) => {
    if (!confirm('Are you sure you want to delete this essay?')) return;

    try {
      await scholarshipEssayApi.deleteEssay(essayId);
      setEssays(essays.filter((e) => e.id !== essayId));
      if (selectedEssay?.id === essayId) {
        setSelectedEssay(null);
        setSearchParams({});
      }
      setSuccess('Essay deleted successfully');
    } catch (err) {
      setError('Failed to delete essay');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'default';
      case 'draft':
        return 'warning';
      case 'in_review':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Scholarship Essay Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create compelling essays with AI-powered writing assistance and peer feedback
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Prompt Library" icon={<LibraryIcon />} iconPosition="start" />
          <Tab label="My Essays" icon={<EditIcon />} iconPosition="start" />
          {selectedEssay && <Tab label="Editor" icon={<EditIcon />} iconPosition="start" />}
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedPromptType}
                  onChange={(e) => setSelectedPromptType(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="personal_statement">Personal Statement</MenuItem>
                  <MenuItem value="extracurricular">Extracurricular</MenuItem>
                  <MenuItem value="community_service">Community Service</MenuItem>
                  <MenuItem value="leadership">Leadership</MenuItem>
                  <MenuItem value="career_goals">Career Goals</MenuItem>
                  <MenuItem value="diversity">Diversity</MenuItem>
                  <MenuItem value="challenge_overcome">Challenge Overcome</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {filteredPrompts.map((prompt) => (
            <Grid item xs={12} md={6} lg={4} key={prompt.id}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardHeader
                  title={prompt.title}
                  subheader={
                    <Chip label={prompt.type.replace('_', ' ')} size="small" sx={{ mt: 0.5 }} />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {prompt.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Word Limit: {prompt.wordLimit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {prompt.successRate}% success rate
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setNewEssayData({ ...newEssayData, promptId: prompt.id });
                      setShowNewEssayDialog(true);
                    }}
                  >
                    Start Essay
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {essays.length} Essay{essays.length !== 1 ? 's' : ''}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCurrentTab(0)}>
            New Essay
          </Button>
        </Box>

        <Grid container spacing={3}>
          {essays.map((essay) => (
            <Grid item xs={12} md={6} lg={4} key={essay.id}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                }}
              >
                <CardHeader
                  title={essay.title}
                  subheader={essay.promptTitle}
                  action={
                    <IconButton onClick={() => handleDeleteEssay(essay.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Chip
                        label={getStatusLabel(essay.completionStatus)}
                        color={
                          getStatusColor(essay.completionStatus) as
                            | 'default'
                            | 'warning'
                            | 'info'
                            | 'success'
                        }
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Word Count
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {essay.wordCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {new Date(essay.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Badge badgeContent={essay.versions?.length || 0} color="primary">
                        <Chip icon={<HistoryIcon />} label="Versions" size="small" />
                      </Badge>
                      <Badge badgeContent={essay.peerReviews?.length || 0} color="secondary">
                        <Chip icon={<ReviewIcon />} label="Reviews" size="small" />
                      </Badge>
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSearchParams({ essay: essay.id });
                        setCurrentTab(2);
                      }}
                    >
                      Edit Essay
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {selectedEssay && (
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <RichTextEditor
                content={editingContent}
                onChange={setEditingContent}
                onSave={handleSaveEssay}
                wordCount={editingContent.trim().split(/\s+/).filter(Boolean).length}
                wordLimit={prompts.find((p) => p.id === selectedEssay.promptId)?.wordLimit || 1000}
                grammarIssues={grammarIssues}
                aiSuggestions={aiSuggestions}
                onCheckGrammar={handleCheckGrammar}
                onGenerateAISuggestions={handleGenerateAISuggestions}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardHeader
                    title="AI Suggestions"
                    avatar={<PsychologyIcon color="secondary" />}
                  />
                  <CardContent>
                    {aiSuggestions.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Click &quot;AI Suggestions&quot; to get writing recommendations
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {aiSuggestions.slice(0, 5).map((suggestion) => (
                          <Paper
                            key={suggestion.id}
                            elevation={0}
                            sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}
                          >
                            <Chip
                              label={suggestion.type}
                              size="small"
                              color="secondary"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" gutterBottom>
                              {suggestion.suggestion}
                            </Typography>
                            {suggestion.suggestedText && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontStyle: 'italic' }}
                              >
                                &quot;{suggestion.suggestedText}&quot;
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardHeader title="Grammar Issues" avatar={<GrammarIcon color="warning" />} />
                  <CardContent>
                    {grammarIssues.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No grammar issues found
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {grammarIssues.slice(0, 5).map((issue) => (
                          <Paper
                            key={issue.id}
                            elevation={0}
                            sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05) }}
                          >
                            <Typography variant="body2" gutterBottom>
                              {issue.message}
                            </Typography>
                            {issue.replacements.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Suggestion: {issue.replacements[0]}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardHeader title="Version History" avatar={<HistoryIcon />} />
                  <CardContent>
                    {versions.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No versions saved yet
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {versions.slice(0, 5).map((version) => (
                          <Box
                            key={version.id}
                            sx={{
                              p: 1.5,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              Version {version.versionNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(version.createdAt).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {version.wordCount} words
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>
      )}

      <Dialog
        open={showNewEssayDialog}
        onClose={() => setShowNewEssayDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Essay</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Essay Title"
              value={newEssayData.title}
              onChange={(e) => setNewEssayData({ ...newEssayData, title: e.target.value })}
              placeholder="Give your essay a descriptive title"
            />
            <Alert severity="info">
              You&apos;ve selected: {prompts.find((p) => p.id === newEssayData.promptId)?.title}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewEssayDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateEssay}
            variant="contained"
            disabled={!newEssayData.title || !newEssayData.promptId}
          >
            Create Essay
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
