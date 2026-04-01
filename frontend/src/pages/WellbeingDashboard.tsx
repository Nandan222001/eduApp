import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  IconButton,
  Divider,
  Alert,
  Badge,
  Tooltip,
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  LocalHospital as LocalHospitalIcon,
  Psychology as PsychologyIcon,
  Shield as ShieldIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { wellbeingApi } from '@/api/wellbeing';
import { WellbeingAlert, Intervention, MentalHealthResource } from '@/types/wellbeing';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Very Sad', icon: SentimentVeryDissatisfied, color: '#f44336' },
  { value: 2, emoji: '😟', label: 'Sad', icon: SentimentDissatisfied, color: '#ff9800' },
  { value: 3, emoji: '😐', label: 'Neutral', icon: SentimentNeutral, color: '#ffc107' },
  { value: 4, emoji: '😊', label: 'Happy', icon: SentimentSatisfied, color: '#8bc34a' },
  { value: 5, emoji: '😄', label: 'Very Happy', icon: SentimentVerySatisfied, color: '#4caf50' },
];

const PHQ9_QUESTIONS = [
  { key: 'little_interest', text: 'Little interest or pleasure in doing things' },
  { key: 'feeling_down', text: 'Feeling down, depressed, or hopeless' },
  { key: 'sleep_problems', text: 'Trouble falling or staying asleep, or sleeping too much' },
  { key: 'feeling_tired', text: 'Feeling tired or having little energy' },
  { key: 'appetite_changes', text: 'Poor appetite or overeating' },
  { key: 'feeling_bad', text: 'Feeling bad about yourself or that you are a failure' },
  { key: 'concentration_problems', text: 'Trouble concentrating on things' },
  { key: 'moving_slowly', text: 'Moving or speaking slowly, or being fidgety or restless' },
  {
    key: 'self_harm_thoughts',
    text: 'Thoughts that you would be better off dead or of hurting yourself',
  },
];

const GAD7_QUESTIONS = [
  { key: 'feeling_nervous', text: 'Feeling nervous, anxious, or on edge' },
  { key: 'cant_stop_worrying', text: 'Not being able to stop or control worrying' },
  { key: 'worrying_too_much', text: 'Worrying too much about different things' },
  { key: 'trouble_relaxing', text: 'Trouble relaxing' },
  { key: 'restless', text: 'Being so restless that it is hard to sit still' },
  { key: 'irritable', text: 'Becoming easily annoyed or irritable' },
  { key: 'feeling_afraid', text: 'Feeling afraid, as if something awful might happen' },
];

const RESPONSE_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

interface MoodTrackerDialogProps {
  open: boolean;
  onClose: () => void;
  institutionId: number;
  studentId: number;
  onSubmit: () => void;
}

function MoodTrackerDialog({
  open,
  onClose,
  institutionId,
  studentId,
  onSubmit,
}: MoodTrackerDialogProps) {
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [journalEntry, setJournalEntry] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const moodOption = MOOD_OPTIONS.find((m) => m.value === selectedMood);
      await wellbeingApi.submitMoodEntry(institutionId, {
        student_id: studentId,
        institution_id: institutionId,
        mood_rating: selectedMood,
        mood_emoji: moodOption?.emoji || '😐',
        journal_entry: journalEntry || undefined,
        date: new Date().toISOString().split('T')[0],
      });
      setJournalEntry('');
      setSelectedMood(3);
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting mood entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">How are you feeling today?</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom align="center">
            Select your mood
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            {MOOD_OPTIONS.map((mood) => {
              const Icon = mood.icon;
              return (
                <Tooltip key={mood.value} title={mood.label}>
                  <IconButton
                    onClick={() => setSelectedMood(mood.value)}
                    sx={{
                      fontSize: 48,
                      color: selectedMood === mood.value ? mood.color : 'grey.400',
                      transform: selectedMood === mood.value ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.2)',
                      },
                    }}
                  >
                    <Icon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Journal Entry (Optional)"
          placeholder="How has your day been? What's on your mind?"
          value={journalEntry}
          onChange={(e) => setJournalEntry(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface SurveyDialogProps {
  open: boolean;
  onClose: () => void;
  institutionId: number;
  studentId: number;
  surveyType: 'PHQ-9' | 'GAD-7';
  onSubmit: () => void;
}

function SurveyDialog({
  open,
  onClose,
  institutionId,
  studentId,
  surveyType,
  onSubmit,
}: SurveyDialogProps) {
  const questions = surveyType === 'PHQ-9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const handleResponseChange = (key: string, value: number) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const calculateScore = () => {
    return Object.values(responses).reduce((sum, val) => sum + val, 0);
  };

  const getSeverityLevel = (score: number) => {
    if (surveyType === 'PHQ-9') {
      if (score <= 4) return 'Minimal';
      if (score <= 9) return 'Mild';
      if (score <= 14) return 'Moderate';
      if (score <= 19) return 'Moderately Severe';
      return 'Severe';
    } else {
      if (score <= 4) return 'Minimal';
      if (score <= 9) return 'Mild';
      if (score <= 14) return 'Moderate';
      return 'Severe';
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const totalScore = calculateScore();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      await wellbeingApi.submitSurvey(institutionId, {
        student_id: studentId,
        institution_id: institutionId,
        survey_type: surveyType,
        responses,
        total_score: totalScore,
        severity_level: getSeverityLevel(totalScore),
        week_start_date: weekStart.toISOString().split('T')[0],
      });
      setResponses({});
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setLoading(false);
    }
  };

  const allQuestionsAnswered = questions.every((q) => responses[q.key] !== undefined);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              {surveyType === 'PHQ-9'
                ? 'Depression Screening (PHQ-9)'
                : 'Anxiety Screening (GAD-7)'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Over the last 2 weeks, how often have you been bothered by the following?
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                {RESPONSE_OPTIONS.map((option) => (
                  <TableCell key={option.value} align="center">
                    {option.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((question, index) => (
                <TableRow key={question.key}>
                  <TableCell>
                    {index + 1}. {question.text}
                  </TableCell>
                  {RESPONSE_OPTIONS.map((option) => (
                    <TableCell key={option.value} align="center">
                      <ToggleButton
                        value={option.value}
                        selected={responses[question.key] === option.value}
                        onChange={() => handleResponseChange(question.key, option.value)}
                        size="small"
                        sx={{ border: 'none' }}
                      >
                        {option.value}
                      </ToggleButton>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {allQuestionsAnswered && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Total Score: {calculateScore()} - Severity: {getSeverityLevel(calculateScore())}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!allQuestionsAnswered || loading}
        >
          Submit Survey
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface AnonymousReportDialogProps {
  open: boolean;
  onClose: () => void;
  institutionId: number;
  onSubmit: () => void;
}

function AnonymousReportDialog({
  open,
  onClose,
  institutionId,
  onSubmit,
}: AnonymousReportDialogProps) {
  const [reportType, setReportType] = useState<'bullying' | 'safety' | 'harassment' | 'other'>(
    'bullying'
  );
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateOfIncident, setDateOfIncident] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await wellbeingApi.submitAnonymousReport(institutionId, {
        institution_id: institutionId,
        report_type: reportType,
        description,
        location: location || undefined,
        date_of_incident: dateOfIncident || undefined,
        witnesses: witnesses || undefined,
        status: 'pending',
        severity: 'medium',
      });
      setDescription('');
      setLocation('');
      setDateOfIncident('');
      setWitnesses('');
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Anonymous Report</Typography>
            <Typography variant="caption" color="text.secondary">
              Your report is completely anonymous and confidential
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) =>
                  setReportType(e.target.value as 'bullying' | 'safety' | 'harassment' | 'other')
                }
                label="Report Type"
              >
                <MenuItem value="bullying">Bullying</MenuItem>
                <MenuItem value="safety">Safety Concern</MenuItem>
                <MenuItem value="harassment">Harassment</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              required
              label="Description"
              placeholder="Please describe what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location (Optional)"
              placeholder="Where did this occur?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Date of Incident"
              InputLabelProps={{ shrink: true }}
              value={dateOfIncident}
              onChange={(e) => setDateOfIncident(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Witnesses (Optional)"
              placeholder="Were there any witnesses?"
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info" icon={<ShieldIcon />}>
              This report is completely anonymous. We take all reports seriously and will
              investigate appropriately.
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!description || loading}>
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface CounselorInterfaceProps {
  institutionId: number;
  currentUserId: number;
}

function CounselorInterface({ institutionId, currentUserId }: CounselorInterfaceProps) {
  const theme = useTheme();
  const [alerts, setAlerts] = useState<WellbeingAlert[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [_selectedAlert, setSelectedAlert] = useState<WellbeingAlert | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await wellbeingApi.getAlerts(institutionId, {
        status: filterStatus || undefined,
        severity: filterSeverity || undefined,
        limit: 50,
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterventions = async () => {
    try {
      const response = await wellbeingApi.getInterventions(institutionId, {
        completed: false,
        limit: 20,
      });
      setInterventions(response.data);
    } catch (error) {
      console.error('Error loading interventions:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
    loadInterventions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSeverity]);

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await wellbeingApi.updateAlert(institutionId, alertId, currentUserId, {
        status: 'acknowledged',
      });
      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      default:
        return theme.palette.success.main;
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Flagged Students"
            subheader="Students requiring attention or intervention"
            action={
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="acknowledged">Acknowledged</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    label="Severity"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            }
          />
          <CardContent>
            {loading ? (
              <LinearProgress />
            ) : alerts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No alerts matching the current filters
                </Typography>
              </Box>
            ) : (
              <List>
                {alerts.map((alert, index) => (
                  <Box key={alert.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                        mb: 1,
                        bgcolor: alpha(getSeverityColor(alert.severity), 0.05),
                        borderRadius: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={alert.severity}
                          color={alert.severity === 'critical' ? 'error' : 'warning'}
                          overlap="circular"
                        >
                          <Avatar src={alert.student?.photo_url}>
                            {alert.student?.first_name?.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {alert.student?.first_name} {alert.student?.last_name}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={alert.status.replace('_', ' ')}
                                size="small"
                                color={alert.status === 'resolved' ? 'success' : 'default'}
                              />
                              <Chip
                                label={`Risk: ${alert.risk_score.toFixed(1)}`}
                                size="small"
                                color="error"
                              />
                            </Stack>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                              {alert.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {alert.description}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {alert.recommended_actions.slice(0, 2).map((action, idx) => (
                                <Chip key={idx} label={action} size="small" variant="outlined" />
                              ))}
                            </Box>
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                              {alert.status === 'pending' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleAcknowledgeAlert(alert.id)}
                                >
                                  Acknowledge
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => setSelectedAlert(alert)}
                              >
                                View Details
                              </Button>
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < alerts.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Pending Interventions"
            subheader="Scheduled interventions requiring action"
            avatar={<AssignmentIcon />}
          />
          <CardContent>
            {interventions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No pending interventions
                </Typography>
              </Box>
            ) : (
              <List dense>
                {interventions.slice(0, 5).map((intervention) => (
                  <ListItem key={intervention.id}>
                    <ListItemText
                      primary={intervention.intervention_type}
                      secondary={
                        <>
                          {intervention.description}
                          <br />
                          {intervention.scheduled_at && (
                            <Typography variant="caption" color="text.secondary">
                              Scheduled: {new Date(intervention.scheduled_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Communication History"
            subheader="Recent interactions with students"
            avatar={<GroupsIcon />}
          />
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Communication history available in individual student views
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

interface ResourceDirectoryProps {
  institutionId: number;
}

function ResourceDirectory({ institutionId }: ResourceDirectoryProps) {
  const theme = useTheme();
  const [resources, setResources] = useState<MentalHealthResource[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await wellbeingApi.getResources(institutionId, selectedType || undefined);
      setResources(response.data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'counselor':
        return <PsychologyIcon />;
      case 'clinic':
        return <LocalHospitalIcon />;
      case 'hotline':
        return <PhoneIcon />;
      case 'emergency':
        return <WarningIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  return (
    <Card>
      <CardHeader
        title="Mental Health Resources"
        subheader="Directory of support services and resources"
        action={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Filter by Type"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="counselor">Counselors</MenuItem>
              <MenuItem value="clinic">Clinics</MenuItem>
              <MenuItem value="hotline">Hotlines</MenuItem>
              <MenuItem value="support_group">Support Groups</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        {loading ? (
          <LinearProgress />
        ) : resources.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No resources found
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {resources.map((resource) => (
              <Grid item xs={12} md={6} key={resource.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: resource.is_emergency
                      ? `4px solid ${theme.palette.error.main}`
                      : undefined,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ color: resource.is_emergency ? 'error.main' : 'primary.main' }}>
                      {getResourceIcon(resource.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {resource.name}
                        {resource.is_emergency && (
                          <Chip label="Emergency" color="error" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {resource.description}
                      </Typography>
                      {resource.contact_info.phone && (
                        <Typography variant="caption" display="block">
                          <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          {resource.contact_info.phone}
                        </Typography>
                      )}
                      {resource.contact_info.email && (
                        <Typography variant="caption" display="block">
                          <EmailIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          {resource.contact_info.email}
                        </Typography>
                      )}
                      {resource.availability && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {resource.availability}
                        </Typography>
                      )}
                      {resource.specializations && resource.specializations.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {resource.specializations.map((spec, idx) => (
                            <Chip key={idx} label={spec} size="small" variant="outlined" />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

export default function WellbeingDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [surveyType, setSurveyType] = useState<'PHQ-9' | 'GAD-7'>('PHQ-9');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const institutionId = 1;
  const studentId = 1;
  const currentUserId = 1;

  const handleMoodSubmit = () => {
    console.log('Mood entry submitted');
  };

  const handleSurveySubmit = () => {
    console.log('Survey submitted');
  };

  const handleReportSubmit = () => {
    console.log('Report submitted');
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Student Wellbeing Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Mental health support, check-ins, and intervention tools
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Student Check-in" />
          <Tab label="Counselor Interface" />
          <Tab label="Resources & Referrals" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Daily Mood Tracker"
                subheader="Track your daily mood and feelings"
                avatar={<SentimentSatisfied />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Take a moment to reflect on how you&apos;re feeling today. Your responses are
                  private and help us support you better.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => setMoodDialogOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Log Today&apos;s Mood
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Weekly Wellbeing Survey"
                subheader="Mental health screening questionnaires"
                avatar={<AssignmentIcon />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Complete validated screening tools to help identify support needs.
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setSurveyType('PHQ-9');
                      setSurveyDialogOpen(true);
                    }}
                  >
                    PHQ-9 (Depression)
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setSurveyType('GAD-7');
                      setSurveyDialogOpen(true);
                    }}
                  >
                    GAD-7 (Anxiety)
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Anonymous Reporting"
                subheader="Report safety concerns confidentially"
                avatar={<ShieldIcon />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Report bullying, harassment, or safety concerns anonymously. Your identity is
                  protected.
                </Typography>
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  startIcon={<WarningIcon />}
                  onClick={() => setReportDialogOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Submit Anonymous Report
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info" icon={<PsychologyIcon />}>
              <strong>Need immediate help?</strong> If you&apos;re in crisis or need immediate
              support, please contact the crisis hotline at <strong>1-800-273-8255</strong> or speak
              with a school counselor.
            </Alert>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <CounselorInterface institutionId={institutionId} currentUserId={currentUserId} />
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ResourceDirectory institutionId={institutionId} />
          </Grid>
        </Grid>
      )}

      <MoodTrackerDialog
        open={moodDialogOpen}
        onClose={() => setMoodDialogOpen(false)}
        institutionId={institutionId}
        studentId={studentId}
        onSubmit={handleMoodSubmit}
      />

      <SurveyDialog
        open={surveyDialogOpen}
        onClose={() => setSurveyDialogOpen(false)}
        institutionId={institutionId}
        studentId={studentId}
        surveyType={surveyType}
        onSubmit={handleSurveySubmit}
      />

      <AnonymousReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        institutionId={institutionId}
        onSubmit={handleReportSubmit}
      />
    </Box>
  );
}
