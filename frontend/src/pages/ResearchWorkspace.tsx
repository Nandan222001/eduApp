import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Stack,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Badge,
  Menu,
} from '@mui/material';
import {
  Save,
  Add,
  Delete,
  Edit,
  Comment,
  Upload,
  Download,
  AttachFile,
  Send,
  CheckCircle,
  Schedule,
  VideoCall,
  Notifications,
  MoreVert,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
} from '@mui/icons-material';
import {
  ResearchProject,
  ResearchDocument,
  DataTable,
  LiteratureEntry,
  ExperimentLog,
  ResearchFile,
  ChatMessage,
  Milestone,
} from '@/types/research';
import { formatDistanceToNow } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export default function ResearchWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [document, setDocument] = useState<ResearchDocument | null>(null);
  const [documentContent, setDocumentContent] = useState('');
  const [_dataTables, setDataTables] = useState<DataTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DataTable | null>(null);
  const [literature, setLiterature] = useState<LiteratureEntry[]>([]);
  const [experiments, setExperiments] = useState<ExperimentLog[]>([]);
  const [files] = useState<ResearchFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [citationDialogOpen, setCitationDialogOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<LiteratureEntry | null>(null);
  const [citationStyle, setCitationStyle] = useState<'mla' | 'apa' | 'chicago'>('apa');
  const [addLiteratureDialogOpen, setAddLiteratureDialogOpen] = useState(false);
  const [addExperimentDialogOpen, setAddExperimentDialogOpen] = useState(false);
  const [addMilestoneDialogOpen, setAddMilestoneDialogOpen] = useState(false);
  const [commentAnchor, setCommentAnchor] = useState<null | HTMLElement>(null);
  const [newComment, setNewComment] = useState('');

  const [newLiterature, setNewLiterature] = useState({
    title: '',
    authors: '',
    publication_year: new Date().getFullYear(),
    source: '',
    url: '',
    notes: '',
  });

  const [newExperiment, setNewExperiment] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    procedure: '',
    observations: '',
    results: '',
    conclusion: '',
  });

  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    due_date: '',
  });

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    const mockProject: ResearchProject = {
      id: 1,
      title: 'Effect of pH Levels on Plant Growth',
      abstract:
        'This study investigates how different pH levels in soil affect the growth rate and health of common garden plants.',
      research_question: 'How do varying soil pH levels impact plant growth rates?',
      methodology:
        'Controlled experiment with multiple plant groups and pH treatments over 8 weeks',
      status: 'in_progress',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
      team_lead_id: 1,
      team_lead_name: 'Sarah Johnson',
      team_members: [
        {
          id: 1,
          user_id: 1,
          name: 'Sarah Johnson',
          role: 'Lead Researcher',
          joined_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          user_id: 2,
          name: 'Mike Chen',
          role: 'Data Analyst',
          joined_at: '2024-01-15T10:30:00Z',
        },
      ],
      milestones: [
        {
          id: 1,
          title: 'Literature Review',
          description: 'Complete comprehensive literature review',
          due_date: '2024-02-01T00:00:00Z',
          completed: true,
          completed_at: '2024-01-28T00:00:00Z',
          approved_by_advisor: true,
          order: 1,
        },
        {
          id: 2,
          title: 'Experiment Setup',
          description: 'Prepare all experimental materials and controls',
          due_date: '2024-02-15T00:00:00Z',
          completed: true,
          approved_by_advisor: false,
          advisor_feedback: 'Please add more detail to the methodology section',
          order: 2,
        },
      ],
      progress_percentage: 65,
      category: 'Biology',
      tags: ['plants', 'soil', 'pH'],
      is_member: true,
      is_public: true,
      awards: [],
    };

    const mockDocument: ResearchDocument = {
      id: 1,
      project_id: 1,
      title: 'Research Paper Draft',
      content:
        'Introduction\n\nThis study explores the relationship between soil pH and plant growth...',
      version: 3,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
      created_by: 1,
      created_by_name: 'Sarah Johnson',
      comments: [
        {
          id: 1,
          document_id: 1,
          user_id: 10,
          user_name: 'Dr. Anderson',
          content: 'Great introduction! Consider adding more recent studies from 2023.',
          created_at: '2024-01-18T14:00:00Z',
          is_advisor: true,
        },
      ],
    };

    const mockDataTable: DataTable = {
      id: 1,
      project_id: 1,
      name: 'Plant Growth Measurements',
      description: 'Weekly measurements of plant height and leaf count',
      columns: [
        { id: 'week', name: 'Week', type: 'number' },
        { id: 'ph_level', name: 'pH Level', type: 'number' },
        { id: 'height_cm', name: 'Height (cm)', type: 'number' },
        { id: 'leaf_count', name: 'Leaf Count', type: 'number' },
        { id: 'health', name: 'Health Status', type: 'text' },
      ],
      rows: [
        {
          id: '1',
          data: { week: 1, ph_level: 6.5, height_cm: 5.2, leaf_count: 4, health: 'Good' },
        },
        {
          id: '2',
          data: { week: 2, ph_level: 6.5, height_cm: 7.8, leaf_count: 6, health: 'Good' },
        },
        {
          id: '3',
          data: { week: 3, ph_level: 6.5, height_cm: 10.5, leaf_count: 8, health: 'Excellent' },
        },
      ],
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-22T15:00:00Z',
    };

    const mockLiterature: LiteratureEntry[] = [
      {
        id: 1,
        project_id: 1,
        title: 'Soil pH and Plant Growth: A Comprehensive Review',
        authors: ['Smith, J.', 'Johnson, A.'],
        publication_year: 2023,
        source: 'Journal of Plant Science',
        url: 'https://example.com/article1',
        notes: 'Key reference for methodology',
        citation_apa:
          'Smith, J., & Johnson, A. (2023). Soil pH and Plant Growth: A Comprehensive Review. Journal of Plant Science, 45(2), 123-145.',
        citation_mla:
          'Smith, John, and Alice Johnson. "Soil pH and Plant Growth: A Comprehensive Review." Journal of Plant Science 45.2 (2023): 123-145.',
        citation_chicago:
          'Smith, John, and Alice Johnson. "Soil pH and Plant Growth: A Comprehensive Review." Journal of Plant Science 45, no. 2 (2023): 123-145.',
        created_at: '2024-01-16T10:00:00Z',
      },
    ];

    const mockExperiments: ExperimentLog[] = [
      {
        id: 1,
        project_id: 1,
        title: 'Week 1 Measurements',
        description: 'Initial measurements and observations',
        date: '2024-01-20T00:00:00Z',
        procedure: '1. Measure plant height\n2. Count leaves\n3. Assess overall health',
        observations: 'All plants showing healthy growth. No signs of stress.',
        results: 'Average height: 5.2cm, Average leaves: 4',
        conclusion: 'Baseline established successfully',
        media: [],
        created_by: 1,
        created_by_name: 'Sarah Johnson',
        created_at: '2024-01-20T16:00:00Z',
      },
    ];

    const mockMessages: ChatMessage[] = [
      {
        id: 1,
        project_id: 1,
        user_id: 1,
        user_name: 'Sarah Johnson',
        content: 'Hey team, I uploaded the latest measurements to the data table!',
        created_at: '2024-01-22T10:30:00Z',
      },
      {
        id: 2,
        project_id: 1,
        user_id: 2,
        user_name: 'Mike Chen',
        content: "Great! I'll start analyzing the trends this afternoon.",
        created_at: '2024-01-22T10:35:00Z',
      },
    ];

    setProject(mockProject);
    setDocument(mockDocument);
    setDocumentContent(mockDocument.content);
    setDataTables([mockDataTable]);
    setSelectedTable(mockDataTable);
    setLiterature(mockLiterature);
    setExperiments(mockExperiments);
    setMessages(mockMessages);
    setMilestones(mockProject.milestones);
  };

  const handleSaveDocument = () => {
    console.log('Saving document:', documentContent);
  };

  const handleAddLiterature = () => {
    const authors = newLiterature.authors.split(',').map((a) => a.trim());

    const apaYear = newLiterature.publication_year;
    const apaCitation = `${authors[0]} (${apaYear}). ${newLiterature.title}. ${newLiterature.source}.`;

    const mlaCitation = `${authors[0]}. "${newLiterature.title}." ${newLiterature.source}, ${apaYear}.`;

    const chicagoCitation = `${authors[0]}. "${newLiterature.title}." ${newLiterature.source} (${apaYear}).`;

    const entry: LiteratureEntry = {
      id: Date.now(),
      project_id: parseInt(projectId!),
      title: newLiterature.title,
      authors: authors,
      publication_year: newLiterature.publication_year,
      source: newLiterature.source,
      url: newLiterature.url || undefined,
      notes: newLiterature.notes || undefined,
      citation_apa: apaCitation,
      citation_mla: mlaCitation,
      citation_chicago: chicagoCitation,
      created_at: new Date().toISOString(),
    };

    setLiterature([...literature, entry]);
    setAddLiteratureDialogOpen(false);
    setNewLiterature({
      title: '',
      authors: '',
      publication_year: new Date().getFullYear(),
      source: '',
      url: '',
      notes: '',
    });
  };

  const handleAddExperiment = () => {
    const experiment: ExperimentLog = {
      id: Date.now(),
      project_id: parseInt(projectId!),
      title: newExperiment.title,
      description: newExperiment.description,
      date: newExperiment.date,
      procedure: newExperiment.procedure,
      observations: newExperiment.observations,
      results: newExperiment.results,
      conclusion: newExperiment.conclusion || undefined,
      media: [],
      created_by: 1,
      created_by_name: 'Current User',
      created_at: new Date().toISOString(),
    };

    setExperiments([...experiments, experiment]);
    setAddExperimentDialogOpen(false);
    setNewExperiment({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      observations: '',
      results: '',
      conclusion: '',
    });
  };

  const handleAddMilestone = () => {
    const milestone: Milestone = {
      id: Date.now(),
      title: newMilestone.title,
      description: newMilestone.description,
      due_date: newMilestone.due_date,
      completed: false,
      approved_by_advisor: false,
      order: milestones.length + 1,
    };

    setMilestones([...milestones, milestone]);
    setAddMilestoneDialogOpen(false);
    setNewMilestone({ title: '', description: '', due_date: '' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now(),
      project_id: parseInt(projectId!),
      user_id: 1,
      user_name: 'Current User',
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleCopyCitation = (style: 'apa' | 'mla' | 'chicago') => {
    if (!selectedCitation) return;

    let citation = '';
    switch (style) {
      case 'apa':
        citation = selectedCitation.citation_apa || '';
        break;
      case 'mla':
        citation = selectedCitation.citation_mla || '';
        break;
      case 'chicago':
        citation = selectedCitation.citation_chicago || '';
        break;
    }

    navigator.clipboard.writeText(citation);
  };

  if (!project) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {project.title}
          </Typography>
          <Chip label={project.status.replace('_', ' ')} color="primary" size="small" />
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<VideoCall />}>
            Meeting
          </Button>
          <Button variant="outlined" startIcon={<Notifications />}>
            Alerts
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={9}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} variant="scrollable">
              <Tab label="Document Editor" />
              <Tab label="Data Tables" />
              <Tab label="Literature Manager" />
              <Tab label="Experiment Log" />
              <Tab label="Files" />
              <Tab label="Milestones" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Research Paper</Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small">
                      <FormatBold />
                    </IconButton>
                    <IconButton size="small">
                      <FormatItalic />
                    </IconButton>
                    <IconButton size="small">
                      <FormatUnderlined />
                    </IconButton>
                    <Divider orientation="vertical" flexItem />
                    <IconButton size="small" onClick={(e) => setCommentAnchor(e.currentTarget)}>
                      <Comment />
                    </IconButton>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSaveDocument}>
                      Save
                    </Button>
                  </Stack>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  variant="outlined"
                  placeholder="Start writing your research paper..."
                />

                {document && document.comments.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Comments & Feedback
                    </Typography>
                    <Stack spacing={2}>
                      {document.comments.map((comment) => (
                        <Paper
                          key={comment.id}
                          sx={{
                            p: 2,
                            bgcolor: comment.is_advisor ? 'info.lighter' : 'background.default',
                          }}
                        >
                          <Box display="flex" gap={1} alignItems="flex-start">
                            <Avatar src={comment.user_avatar} sx={{ width: 32, height: 32 }}>
                              {comment.user_name[0]}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="subtitle2">
                                {comment.user_name}
                                {comment.is_advisor && (
                                  <Chip label="Advisor" size="small" color="info" sx={{ ml: 1 }} />
                                )}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {comment.content}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {formatDistanceToNow(new Date(comment.created_at), {
                                  addSuffix: true,
                                })}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Data Tables</Typography>
                  <Button variant="contained" startIcon={<Add />}>
                    New Table
                  </Button>
                </Box>

                {selectedTable && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {selectedTable.columns.map((col) => (
                            <TableCell key={col.id}>{col.name}</TableCell>
                          ))}
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedTable.rows.map((row) => (
                          <TableRow key={row.id}>
                            {selectedTable.columns.map((col) => (
                              <TableCell key={col.id}>{String(row.data[col.id] || '')}</TableCell>
                            ))}
                            <TableCell>
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                              <IconButton size="small">
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Button startIcon={<Add />} sx={{ mt: 2 }}>
                  Add Row
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Literature Manager</Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setAddLiteratureDialogOpen(true)}
                  >
                    Add Reference
                  </Button>
                </Box>

                <Stack spacing={2}>
                  {literature.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          {entry.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {entry.authors.join(', ')} ({entry.publication_year})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {entry.source}
                        </Typography>
                        {entry.notes && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Notes: {entry.notes}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} mt={2}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedCitation(entry);
                              setCitationDialogOpen(true);
                            }}
                          >
                            Generate Citation
                          </Button>
                          {entry.url && (
                            <Button size="small" href={entry.url} target="_blank">
                              View Source
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Experiment Log</Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setAddExperimentDialogOpen(true)}
                  >
                    New Entry
                  </Button>
                </Box>

                <Stack spacing={2}>
                  {experiments.map((exp) => (
                    <Card key={exp.id}>
                      <CardHeader
                        title={exp.title}
                        subheader={`${new Date(exp.date).toLocaleDateString()} • by ${exp.created_by_name}`}
                        action={
                          <IconButton>
                            <MoreVert />
                          </IconButton>
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" paragraph>
                          {exp.description}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Procedure
                        </Typography>
                        <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                          {exp.procedure}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Observations
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {exp.observations}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Results
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {exp.results}
                        </Typography>
                        {exp.conclusion && (
                          <>
                            <Typography variant="subtitle2" gutterBottom>
                              Conclusion
                            </Typography>
                            <Typography variant="body2">{exp.conclusion}</Typography>
                          </>
                        )}
                        <Button startIcon={<Upload />} sx={{ mt: 2 }}>
                          Add Photo/Video
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Shared Files</Typography>
                  <Button variant="contained" startIcon={<Upload />}>
                    Upload File
                  </Button>
                </Box>

                <List>
                  {files.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" py={4}>
                      No files uploaded yet
                    </Typography>
                  ) : (
                    files.map((file) => (
                      <ListItem key={file.id}>
                        <ListItemAvatar>
                          <Avatar>
                            <AttachFile />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.file_size / 1024).toFixed(2)} KB • ${file.uploaded_by_name}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" href={file.url}>
                            <Download />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={5}>
              <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Milestones</Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setAddMilestoneDialogOpen(true)}
                  >
                    Add Milestone
                  </Button>
                </Box>

                <Stack spacing={2}>
                  {milestones.map((milestone) => (
                    <Card key={milestone.id}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {milestone.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {milestone.description}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Schedule fontSize="small" />
                              <Typography variant="caption">
                                Due: {new Date(milestone.due_date).toLocaleDateString()}
                              </Typography>
                              {milestone.completed && (
                                <Chip
                                  icon={<CheckCircle />}
                                  label="Completed"
                                  size="small"
                                  color="success"
                                />
                              )}
                              {milestone.approved_by_advisor && (
                                <Chip label="Advisor Approved" size="small" color="info" />
                              )}
                            </Stack>
                            {milestone.advisor_feedback && (
                              <Paper sx={{ p: 2, mt: 2, bgcolor: 'info.lighter' }}>
                                <Typography variant="caption" fontWeight={600}>
                                  Advisor Feedback:
                                </Typography>
                                <Typography variant="body2">
                                  {milestone.advisor_feedback}
                                </Typography>
                              </Paper>
                            )}
                          </Box>
                          {!milestone.completed && (
                            <Button size="small" variant="outlined">
                              Mark Complete
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Team Members" />
              <CardContent>
                <Stack spacing={2}>
                  {project.team_members.map((member) => (
                    <Box key={member.id} display="flex" alignItems="center" gap={1}>
                      <Avatar src={member.avatar} sx={{ width: 32, height: 32 }}>
                        {member.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {member.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.role}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Progress" />
              <CardContent>
                <Box textAlign="center" mb={2}>
                  <Typography variant="h3" fontWeight={700}>
                    {project.progress_percentage}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress_percentage}
                    sx={{ height: 8, borderRadius: 4, mt: 1 }}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  {milestones.filter((m) => m.completed).length} of {milestones.length} milestones
                  completed
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Team Chat"
                action={
                  <Badge badgeContent={messages.length} color="primary">
                    <Comment />
                  </Badge>
                }
              />
              <CardContent>
                <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
                  <Stack spacing={2}>
                    {messages.map((msg) => (
                      <Box key={msg.id}>
                        <Box display="flex" gap={1} alignItems="flex-start">
                          <Avatar src={msg.user_avatar} sx={{ width: 28, height: 28 }}>
                            {msg.user_name[0]}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="caption" fontWeight={600}>
                              {msg.user_name}
                            </Typography>
                            <Typography variant="body2">{msg.content}</Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <IconButton color="primary" onClick={handleSendMessage}>
                    <Send />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={citationDialogOpen}
        onClose={() => setCitationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Citation Generator</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
            <InputLabel>Citation Style</InputLabel>
            <Select
              value={citationStyle}
              onChange={(e) => setCitationStyle(e.target.value as 'mla' | 'apa' | 'chicago')}
            >
              <MenuItem value="apa">APA</MenuItem>
              <MenuItem value="mla">MLA</MenuItem>
              <MenuItem value="chicago">Chicago</MenuItem>
            </Select>
          </FormControl>

          {selectedCitation && (
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {citationStyle === 'apa' && selectedCitation.citation_apa}
                {citationStyle === 'mla' && selectedCitation.citation_mla}
                {citationStyle === 'chicago' && selectedCitation.citation_chicago}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCitationDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => handleCopyCitation(citationStyle)}>
            Copy Citation
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addLiteratureDialogOpen}
        onClose={() => setAddLiteratureDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Literature Reference</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={newLiterature.title}
              onChange={(e) => setNewLiterature({ ...newLiterature, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Authors (comma-separated)"
              value={newLiterature.authors}
              onChange={(e) => setNewLiterature({ ...newLiterature, authors: e.target.value })}
              placeholder="Smith, J., Johnson, A."
            />
            <TextField
              fullWidth
              type="number"
              label="Publication Year"
              value={newLiterature.publication_year}
              onChange={(e) =>
                setNewLiterature({ ...newLiterature, publication_year: parseInt(e.target.value) })
              }
            />
            <TextField
              fullWidth
              label="Source"
              value={newLiterature.source}
              onChange={(e) => setNewLiterature({ ...newLiterature, source: e.target.value })}
              placeholder="Journal of Plant Science"
            />
            <TextField
              fullWidth
              label="URL (optional)"
              value={newLiterature.url}
              onChange={(e) => setNewLiterature({ ...newLiterature, url: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              value={newLiterature.notes}
              onChange={(e) => setNewLiterature({ ...newLiterature, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddLiteratureDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddLiterature}
            disabled={!newLiterature.title || !newLiterature.authors}
          >
            Add Reference
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addExperimentDialogOpen}
        onClose={() => setAddExperimentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>New Experiment Log</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={newExperiment.title}
              onChange={(e) => setNewExperiment({ ...newExperiment, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              value={newExperiment.description}
              onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={newExperiment.date}
              onChange={(e) => setNewExperiment({ ...newExperiment, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Procedure"
              value={newExperiment.procedure}
              onChange={(e) => setNewExperiment({ ...newExperiment, procedure: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observations"
              value={newExperiment.observations}
              onChange={(e) => setNewExperiment({ ...newExperiment, observations: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Results"
              value={newExperiment.results}
              onChange={(e) => setNewExperiment({ ...newExperiment, results: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Conclusion (optional)"
              value={newExperiment.conclusion}
              onChange={(e) => setNewExperiment({ ...newExperiment, conclusion: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddExperimentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddExperiment} disabled={!newExperiment.title}>
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addMilestoneDialogOpen}
        onClose={() => setAddMilestoneDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Milestone</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={newMilestone.due_date}
              onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMilestoneDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMilestone}
            disabled={!newMilestone.title || !newMilestone.due_date}
          >
            Add Milestone
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={commentAnchor}
        open={Boolean(commentAnchor)}
        onClose={() => setCommentAnchor(null)}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add Comment
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1 }}
            onClick={() => setCommentAnchor(null)}
          >
            Add Comment
          </Button>
        </Box>
      </Menu>
    </Container>
  );
}
