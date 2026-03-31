import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  Select,
  MenuItem,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Slider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  VolumeUp as VolumeUpIcon,
  CloudUpload as CloudUploadIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  HourglassEmpty as LoadingIcon,
  PhoneAndroid as MobileIcon,
  Help as HelpIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  Store as StoreIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`advanced-branding-tabpanel-${index}`}
      aria-labelledby={`advanced-branding-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: string;
  priority?: number;
}

interface EmailDomainConfig {
  domain: string;
  verified: boolean;
  dnsRecords: DNSRecord[];
  dkimConfigured: boolean;
  spfConfigured: boolean;
  dmarcConfigured: boolean;
  lastVerified?: string;
}

interface NotificationSound {
  id: string;
  name: string;
  file?: File;
  url?: string;
  type: 'preset' | 'custom';
  duration?: number;
}

interface NotificationSoundMapping {
  notificationType: string;
  soundId: string;
}

interface LoadingScreenConfig {
  animationUrl?: string;
  animationType: 'spinner' | 'progress' | 'custom';
  progressBarColor: string;
  loadingMessages: string[];
  backgroundColor: string;
}

interface SplashScreenConfig {
  portraitImageUrl?: string;
  landscapeImageUrl?: string;
  backgroundColor: string;
  duration: number;
  fadeOut: boolean;
}

interface HelpConfig {
  type: 'external' | 'embedded' | 'disabled';
  knowledgeBaseUrl?: string;
  embedWidgetCode?: string;
  customHelpText?: string;
}

const PRESET_SOUNDS: NotificationSound[] = [
  { id: 'chime', name: 'Chime', type: 'preset', url: '/sounds/chime.mp3', duration: 0.5 },
  { id: 'bell', name: 'Bell', type: 'preset', url: '/sounds/bell.mp3', duration: 0.8 },
  { id: 'ping', name: 'Ping', type: 'preset', url: '/sounds/ping.mp3', duration: 0.3 },
  { id: 'whoosh', name: 'Whoosh', type: 'preset', url: '/sounds/whoosh.mp3', duration: 0.6 },
  { id: 'pop', name: 'Pop', type: 'preset', url: '/sounds/pop.mp3', duration: 0.4 },
  { id: 'ding', name: 'Ding', type: 'preset', url: '/sounds/ding.mp3', duration: 0.5 },
];

const NOTIFICATION_TYPES = [
  { id: 'new_message', label: 'New Message' },
  { id: 'assignment_due', label: 'Assignment Due' },
  { id: 'announcement', label: 'Announcement' },
  { id: 'grade_posted', label: 'Grade Posted' },
  { id: 'attendance_alert', label: 'Attendance Alert' },
  { id: 'fee_reminder', label: 'Fee Reminder' },
  { id: 'exam_schedule', label: 'Exam Schedule' },
  { id: 'general', label: 'General Notification' },
];

export default function InstitutionBrandingAdvanced() {
  const { institutionId } = useParams<{ institutionId: string }>();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email Domain State
  const [emailDomain, setEmailDomain] = useState<EmailDomainConfig>({
    domain: '',
    verified: false,
    dnsRecords: [],
    dkimConfigured: false,
    spfConfigured: false,
    dmarcConfigured: false,
  });
  const [verifying, setVerifying] = useState(false);
  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState(false);
  const [verificationInterval, setVerificationInterval] = useState<number | null>(null);
  const [emailPreviewDialog, setEmailPreviewDialog] = useState(false);
  const [customEmailDomain, setCustomEmailDomain] = useState('');

  // Notification Sounds State
  const [customSounds, setCustomSounds] = useState<NotificationSound[]>([]);
  const [soundMappings, setSoundMappings] = useState<NotificationSoundMapping[]>(
    NOTIFICATION_TYPES.map((type) => ({
      notificationType: type.id,
      soundId: 'chime',
    }))
  );
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [uploadingSoundDialog, setUploadingSoundDialog] = useState(false);

  // Loading Screen State
  const [loadingScreenConfig, setLoadingScreenConfig] = useState<LoadingScreenConfig>({
    animationType: 'spinner',
    progressBarColor: '#1976d2',
    loadingMessages: ['Loading...', 'Please wait...', 'Almost there...'],
    backgroundColor: '#ffffff',
  });
  const [loadingPreviewDialog, setLoadingPreviewDialog] = useState(false);

  // Splash Screen State
  const [splashScreenConfig, setSplashScreenConfig] = useState<SplashScreenConfig>({
    backgroundColor: '#1976d2',
    duration: 3,
    fadeOut: true,
  });
  const [splashPreviewDialog, setSplashPreviewDialog] = useState(false);

  // Help Configuration State
  const [helpConfig, setHelpConfig] = useState<HelpConfig>({
    type: 'external',
    knowledgeBaseUrl: '',
    customHelpText: '',
  });

  useEffect(() => {
    loadAdvancedBrandingData();
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const loadAdvancedBrandingData = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real implementation, this would fetch from an API
      // For now, using placeholder data
      setEmailDomain({
        domain: 'schoolname.edu',
        verified: false,
        dnsRecords: [
          {
            type: 'CNAME',
            name: 'email.schoolname.edu',
            value: 'mail.platform.com',
            ttl: '3600',
          },
          {
            type: 'TXT',
            name: 'default._domainkey.schoolname.edu',
            value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
            ttl: '3600',
          },
          {
            type: 'TXT',
            name: 'schoolname.edu',
            value: 'v=spf1 include:_spf.platform.com ~all',
            ttl: '3600',
          },
          {
            type: 'TXT',
            name: '_dmarc.schoolname.edu',
            value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@schoolname.edu',
            ttl: '3600',
          },
        ],
        dkimConfigured: false,
        spfConfigured: false,
        dmarcConfigured: false,
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to load advanced branding data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // In a real implementation, this would save to an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('Advanced branding settings saved successfully');
    } catch (err) {
      setError((err as Error).message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  const verifyDNSRecords = async () => {
    try {
      setVerifying(true);
      setError(null);

      // Simulate DNS verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const verified = Math.random() > 0.5;
      setEmailDomain({
        ...emailDomain,
        verified,
        dkimConfigured: verified,
        spfConfigured: verified,
        dmarcConfigured: verified,
        lastVerified: new Date().toISOString(),
      });

      if (verified) {
        setSuccess('DNS records verified successfully');
      } else {
        setError('DNS records not yet propagated. Please try again later.');
      }
    } catch (err) {
      setError((err as Error).message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const toggleAutoVerify = () => {
    if (!autoVerifyEnabled) {
      const interval = window.setInterval(() => {
        verifyDNSRecords();
      }, 30000); // Poll every 30 seconds
      setVerificationInterval(interval);
      setAutoVerifyEnabled(true);
      setSuccess('Auto-verification enabled - checking every 30 seconds');
    } else {
      if (verificationInterval) {
        window.clearInterval(verificationInterval);
        setVerificationInterval(null);
      }
      setAutoVerifyEnabled(false);
      setSuccess('Auto-verification disabled');
    }
  };

  const setupCustomEmailDomain = async () => {
    if (!customEmailDomain) {
      setError('Please enter a custom email domain');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Simulate API call to set up custom domain
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate DNS records for the custom domain
      const newDnsRecords: DNSRecord[] = [
        {
          type: 'CNAME',
          name: `email.${customEmailDomain}`,
          value: 'mail.platform.com',
          ttl: '3600',
        },
        {
          type: 'TXT',
          name: `default._domainkey.${customEmailDomain}`,
          value: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
          ttl: '3600',
        },
        {
          type: 'TXT',
          name: customEmailDomain,
          value: 'v=spf1 include:_spf.platform.com ~all',
          ttl: '3600',
        },
        {
          type: 'TXT',
          name: `_dmarc.${customEmailDomain}`,
          value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${customEmailDomain}`,
          ttl: '3600',
        },
      ];

      setEmailDomain({
        domain: customEmailDomain,
        verified: false,
        dnsRecords: newDnsRecords,
        dkimConfigured: false,
        spfConfigured: false,
        dmarcConfigured: false,
      });

      setSuccess('Custom email domain configured. Please add the DNS records.');
    } catch (err) {
      setError((err as Error).message || 'Failed to set up custom email domain');
    } finally {
      setLoading(false);
    }
  };

  const handleSoundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file');
      return;
    }

    const newSound: NotificationSound = {
      id: `custom_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file,
      url: URL.createObjectURL(file),
      type: 'custom',
    };

    setCustomSounds([...customSounds, newSound]);
    setUploadingSoundDialog(false);
    setSuccess('Sound uploaded successfully');
  };

  const playSound = (soundId: string) => {
    const sound = [...PRESET_SOUNDS, ...customSounds].find((s) => s.id === soundId);
    if (!sound || !sound.url) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(sound.url);
    audioRef.current = audio;

    audio.play().catch((err) => {
      setError('Failed to play sound: ' + (err as Error).message);
    });

    setCurrentlyPlaying(soundId);

    audio.onended = () => {
      setCurrentlyPlaying(null);
    };
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentlyPlaying(null);
    }
  };

  const updateSoundMapping = (notificationType: string, soundId: string) => {
    setSoundMappings(
      soundMappings.map((mapping) =>
        mapping.notificationType === notificationType ? { ...mapping, soundId } : mapping
      )
    );
  };

  const deleteCustomSound = (soundId: string) => {
    setCustomSounds(customSounds.filter((sound) => sound.id !== soundId));
    setSoundMappings(
      soundMappings.map((mapping) =>
        mapping.soundId === soundId ? { ...mapping, soundId: 'chime' } : mapping
      )
    );
  };

  const handleLoadingAnimationUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setLoadingScreenConfig({ ...loadingScreenConfig, animationUrl: url, animationType: 'custom' });
    setSuccess('Loading animation uploaded successfully');
  };

  const addLoadingMessage = () => {
    setLoadingScreenConfig({
      ...loadingScreenConfig,
      loadingMessages: [...loadingScreenConfig.loadingMessages, ''],
    });
  };

  const updateLoadingMessage = (index: number, value: string) => {
    const newMessages = [...loadingScreenConfig.loadingMessages];
    newMessages[index] = value;
    setLoadingScreenConfig({ ...loadingScreenConfig, loadingMessages: newMessages });
  };

  const deleteLoadingMessage = (index: number) => {
    const newMessages = loadingScreenConfig.loadingMessages.filter((_, i) => i !== index);
    setLoadingScreenConfig({ ...loadingScreenConfig, loadingMessages: newMessages });
  };

  const handleSplashImageUpload = async (
    orientation: 'portrait' | 'landscape',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (orientation === 'portrait') {
      setSplashScreenConfig({ ...splashScreenConfig, portraitImageUrl: url });
    } else {
      setSplashScreenConfig({ ...splashScreenConfig, landscapeImageUrl: url });
    }
    setSuccess(`${orientation} splash image uploaded successfully`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Advanced Branding Customization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Institution ID: {institutionId}
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
        >
          <Tab label="Custom Email Domain" icon={<EmailIcon />} iconPosition="start" />
          <Tab label="Notification Sounds" icon={<VolumeUpIcon />} iconPosition="start" />
          <Tab label="Loading Screen" icon={<LoadingIcon />} iconPosition="start" />
          <Tab label="Splash Screen (PWA)" icon={<MobileIcon />} iconPosition="start" />
          <Tab label="Help Documentation" icon={<HelpIcon />} iconPosition="start" />
          <Tab label="Merchandise Store" icon={<StoreIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* Email Domain Setup */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Custom Email Domain Configuration
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Configure your institution&apos;s custom email domain for sending branded
                          notifications from addresses like notifications@
                          {emailDomain.domain || 'schoolname.edu'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Custom Email Domain"
                          value={customEmailDomain}
                          onChange={(e) => setCustomEmailDomain(e.target.value)}
                          placeholder="schoolname.edu"
                          fullWidth
                          helperText="Enter your institution's domain name"
                        />
                        <Button
                          variant="contained"
                          onClick={setupCustomEmailDomain}
                          disabled={!customEmailDomain || loading}
                          sx={{ minWidth: 120 }}
                        >
                          Setup
                        </Button>
                      </Box>

                      {emailDomain.domain && (
                        <>
                          <Alert
                            severity={emailDomain.verified ? 'success' : 'warning'}
                            icon={emailDomain.verified ? <CheckCircleIcon /> : <WarningIcon />}
                          >
                            Domain: {emailDomain.domain} -{' '}
                            {emailDomain.verified ? 'Verified' : 'Pending Verification'}
                            {emailDomain.lastVerified && (
                              <Typography variant="caption" display="block">
                                Last verified: {new Date(emailDomain.lastVerified).toLocaleString()}
                              </Typography>
                            )}
                          </Alert>

                          <Box>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                              }}
                            >
                              <Typography variant="h6">DNS Records</Typography>
                              <Stack direction="row" spacing={1}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={autoVerifyEnabled}
                                      onChange={toggleAutoVerify}
                                      size="small"
                                    />
                                  }
                                  label="Auto-verify"
                                />
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={
                                    verifying ? <CircularProgress size={16} /> : <RefreshIcon />
                                  }
                                  onClick={verifyDNSRecords}
                                  disabled={verifying}
                                >
                                  Verify Now
                                </Button>
                              </Stack>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Add these DNS records to your domain&apos;s DNS settings:
                            </Typography>

                            <List>
                              {emailDomain.dnsRecords.map((record, index) => (
                                <ListItem
                                  key={index}
                                  sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip label={record.type} size="small" color="primary" />
                                        <Typography variant="body2" fontWeight={600}>
                                          {record.name}
                                        </Typography>
                                      </Stack>
                                    }
                                    secondary={
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Value:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            wordBreak: 'break-all',
                                            fontFamily: 'monospace',
                                            bgcolor: 'grey.100',
                                            p: 1,
                                            borderRadius: 1,
                                            mt: 0.5,
                                          }}
                                        >
                                          {record.value}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ mt: 1 }}
                                        >
                                          TTL: {record.ttl}
                                          {record.priority && ` | Priority: ${record.priority}`}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                  <ListItemSecondaryAction>
                                    <Tooltip title="Copy to clipboard">
                                      <IconButton
                                        edge="end"
                                        onClick={() => copyToClipboard(record.value)}
                                      >
                                        <CopyIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </ListItemSecondaryAction>
                                </ListItem>
                              ))}
                            </List>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Configuration Status
                            </Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {emailDomain.dkimConfigured ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <WarningIcon color="warning" fontSize="small" />
                                )}
                                <Typography variant="body2">DKIM (Email Authentication)</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {emailDomain.spfConfigured ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <WarningIcon color="warning" fontSize="small" />
                                )}
                                <Typography variant="body2">
                                  SPF (Sender Policy Framework)
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {emailDomain.dmarcConfigured ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <WarningIcon color="warning" fontSize="small" />
                                )}
                                <Typography variant="body2">DMARC (Email Validation)</Typography>
                              </Box>
                            </Stack>
                          </Box>

                          <Button
                            variant="outlined"
                            startIcon={<EmailIcon />}
                            onClick={() => setEmailPreviewDialog(true)}
                          >
                            Preview Branded Email
                          </Button>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Setup Instructions
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" paragraph>
                      1. Enter your institution&apos;s domain name
                    </Typography>
                    <Typography variant="body2" paragraph>
                      2. Copy the DNS records provided
                    </Typography>
                    <Typography variant="body2" paragraph>
                      3. Add them to your domain&apos;s DNS settings
                    </Typography>
                    <Typography variant="body2" paragraph>
                      4. Wait for DNS propagation (usually 24-48 hours)
                    </Typography>
                    <Typography variant="body2" paragraph>
                      5. Click &quot;Verify Now&quot; to check configuration
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      DNS propagation can take up to 48 hours. Enable auto-verify to automatically
                      check for updates.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Notification Sounds */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Notification Sound Customization
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Customize notification sounds for different event types
                        </Typography>
                      </Box>

                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <Typography variant="subtitle2">Sound Library</Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => setUploadingSoundDialog(true)}
                          >
                            Upload Custom Sound
                          </Button>
                        </Box>

                        <Grid container spacing={2}>
                          {[...PRESET_SOUNDS, ...customSounds].map((sound) => (
                            <Grid item xs={12} sm={6} md={4} key={sound.id}>
                              <Paper
                                sx={{
                                  p: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {sound.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {sound.type === 'preset' ? 'Preset' : 'Custom'}
                                    {sound.duration && ` • ${sound.duration}s`}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      currentlyPlaying === sound.id
                                        ? stopSound()
                                        : playSound(sound.id)
                                    }
                                  >
                                    {currentlyPlaying === sound.id ? (
                                      <StopIcon />
                                    ) : (
                                      <PlayArrowIcon />
                                    )}
                                  </IconButton>
                                  {sound.type === 'custom' && (
                                    <IconButton
                                      size="small"
                                      onClick={() => deleteCustomSound(sound.id)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
                                </Stack>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Notification Type Sound Assignment
                        </Typography>
                        <List>
                          {NOTIFICATION_TYPES.map((type) => {
                            const mapping = soundMappings.find(
                              (m) => m.notificationType === type.id
                            );
                            return (
                              <ListItem
                                key={type.id}
                                sx={{
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  mb: 1,
                                }}
                              >
                                <ListItemText
                                  primary={type.label}
                                  secondary={
                                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                      <Select
                                        value={mapping?.soundId || 'chime'}
                                        onChange={(e) =>
                                          updateSoundMapping(type.id, e.target.value)
                                        }
                                      >
                                        <MenuItem value="" disabled>
                                          Select a sound
                                        </MenuItem>
                                        <MenuItem disabled>
                                          <em>Preset Sounds</em>
                                        </MenuItem>
                                        {PRESET_SOUNDS.map((sound) => (
                                          <MenuItem key={sound.id} value={sound.id}>
                                            {sound.name}
                                          </MenuItem>
                                        ))}
                                        {customSounds.length > 0 && (
                                          <MenuItem disabled>
                                            <em>Custom Sounds</em>
                                          </MenuItem>
                                        )}
                                        {customSounds.map((sound) => (
                                          <MenuItem key={sound.id} value={sound.id}>
                                            {sound.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    onClick={() => playSound(mapping?.soundId || 'chime')}
                                  >
                                    <PlayArrowIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sound Guidelines
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" paragraph>
                      • Keep sounds under 2 seconds
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Use MP3 or WAV format
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Maximum file size: 500KB
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Avoid loud or jarring sounds
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Users can override notification sounds in their personal settings.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Loading Screen Designer */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Loading Screen Designer
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={3}>
                      <FormControl>
                        <FormLabel>Animation Type</FormLabel>
                        <RadioGroup
                          value={loadingScreenConfig.animationType}
                          onChange={(e) =>
                            setLoadingScreenConfig({
                              ...loadingScreenConfig,
                              animationType: e.target.value as 'spinner' | 'progress' | 'custom',
                            })
                          }
                        >
                          <FormControlLabel
                            value="spinner"
                            control={<Radio />}
                            label="Spinner (Default)"
                          />
                          <FormControlLabel
                            value="progress"
                            control={<Radio />}
                            label="Progress Bar"
                          />
                          <FormControlLabel
                            value="custom"
                            control={<Radio />}
                            label="Custom Animation"
                          />
                        </RadioGroup>
                      </FormControl>

                      {loadingScreenConfig.animationType === 'custom' && (
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Upload Custom Animation (GIF, SVG, or animated WebP)
                          </Typography>
                          <input
                            accept="image/gif,image/svg+xml,image/webp"
                            style={{ display: 'none' }}
                            id="loading-animation-upload"
                            type="file"
                            onChange={handleLoadingAnimationUpload}
                          />
                          <label htmlFor="loading-animation-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<CloudUploadIcon />}
                            >
                              Upload Animation
                            </Button>
                          </label>
                          {loadingScreenConfig.animationUrl && (
                            <Box sx={{ mt: 2 }}>
                              <img
                                src={loadingScreenConfig.animationUrl}
                                alt="Loading animation preview"
                                style={{ maxHeight: 100, maxWidth: '100%' }}
                              />
                            </Box>
                          )}
                        </Box>
                      )}

                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Progress Bar Color
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <input
                            type="color"
                            value={loadingScreenConfig.progressBarColor}
                            onChange={(e) =>
                              setLoadingScreenConfig({
                                ...loadingScreenConfig,
                                progressBarColor: e.target.value,
                              })
                            }
                            style={{
                              width: 60,
                              height: 40,
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                          <TextField
                            value={loadingScreenConfig.progressBarColor}
                            onChange={(e) =>
                              setLoadingScreenConfig({
                                ...loadingScreenConfig,
                                progressBarColor: e.target.value,
                              })
                            }
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Background Color
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <input
                            type="color"
                            value={loadingScreenConfig.backgroundColor}
                            onChange={(e) =>
                              setLoadingScreenConfig({
                                ...loadingScreenConfig,
                                backgroundColor: e.target.value,
                              })
                            }
                            style={{
                              width: 60,
                              height: 40,
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                          <TextField
                            value={loadingScreenConfig.backgroundColor}
                            onChange={(e) =>
                              setLoadingScreenConfig({
                                ...loadingScreenConfig,
                                backgroundColor: e.target.value,
                              })
                            }
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle2">Loading Messages</Typography>
                          <Button size="small" startIcon={<AddIcon />} onClick={addLoadingMessage}>
                            Add Message
                          </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary" paragraph>
                          Messages will be displayed randomly during loading
                        </Typography>
                        <Stack spacing={1}>
                          {loadingScreenConfig.loadingMessages.map((message, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                value={message}
                                onChange={(e) => updateLoadingMessage(index, e.target.value)}
                                placeholder="Enter loading message"
                              />
                              <IconButton
                                size="small"
                                onClick={() => deleteLoadingMessage(index)}
                                disabled={loadingScreenConfig.loadingMessages.length <= 1}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      <Button
                        variant="outlined"
                        onClick={() => setLoadingPreviewDialog(true)}
                        startIcon={<PlayArrowIcon />}
                      >
                        Preview Loading Screen
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Loading Screen Preview
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Paper
                      sx={{
                        p: 3,
                        minHeight: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: loadingScreenConfig.backgroundColor,
                      }}
                    >
                      {loadingScreenConfig.animationType === 'spinner' && (
                        <CircularProgress
                          sx={{ color: loadingScreenConfig.progressBarColor }}
                          size={60}
                        />
                      )}
                      {loadingScreenConfig.animationType === 'progress' && (
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            sx={{
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: loadingScreenConfig.progressBarColor,
                              },
                            }}
                          />
                        </Box>
                      )}
                      {loadingScreenConfig.animationType === 'custom' &&
                        loadingScreenConfig.animationUrl && (
                          <img
                            src={loadingScreenConfig.animationUrl}
                            alt="Loading animation"
                            style={{ maxHeight: 80 }}
                          />
                        )}
                      <Typography
                        variant="body2"
                        sx={{ mt: 2, textAlign: 'center' }}
                        color="text.secondary"
                      >
                        {loadingScreenConfig.loadingMessages[0] || 'Loading...'}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Splash Screen Configuration */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Splash Screen Configuration (PWA)
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={3}>
                      <Typography variant="body2" color="text.secondary">
                        Configure splash screens for your Progressive Web App on mobile devices
                      </Typography>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Portrait Image (Mobile)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          Recommended: 1242x2688px
                        </Typography>
                        {splashScreenConfig.portraitImageUrl && (
                          <Box sx={{ mb: 2, textAlign: 'center' }}>
                            <img
                              src={splashScreenConfig.portraitImageUrl}
                              alt="Portrait splash"
                              style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }}
                            />
                          </Box>
                        )}
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="splash-portrait-upload"
                          type="file"
                          onChange={(e) => handleSplashImageUpload('portrait', e)}
                        />
                        <label htmlFor="splash-portrait-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                          >
                            Upload Portrait Image
                          </Button>
                        </label>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Landscape Image (Tablet)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          Recommended: 2688x1242px
                        </Typography>
                        {splashScreenConfig.landscapeImageUrl && (
                          <Box sx={{ mb: 2, textAlign: 'center' }}>
                            <img
                              src={splashScreenConfig.landscapeImageUrl}
                              alt="Landscape splash"
                              style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain' }}
                            />
                          </Box>
                        )}
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="splash-landscape-upload"
                          type="file"
                          onChange={(e) => handleSplashImageUpload('landscape', e)}
                        />
                        <label htmlFor="splash-landscape-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                          >
                            Upload Landscape Image
                          </Button>
                        </label>
                      </Box>

                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Background Color
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <input
                            type="color"
                            value={splashScreenConfig.backgroundColor}
                            onChange={(e) =>
                              setSplashScreenConfig({
                                ...splashScreenConfig,
                                backgroundColor: e.target.value,
                              })
                            }
                            style={{
                              width: 60,
                              height: 40,
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                          <TextField
                            value={splashScreenConfig.backgroundColor}
                            onChange={(e) =>
                              setSplashScreenConfig({
                                ...splashScreenConfig,
                                backgroundColor: e.target.value,
                              })
                            }
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Display Duration (seconds)
                        </Typography>
                        <Slider
                          value={splashScreenConfig.duration}
                          onChange={(_, value) =>
                            setSplashScreenConfig({
                              ...splashScreenConfig,
                              duration: value as number,
                            })
                          }
                          min={1}
                          max={10}
                          step={0.5}
                          marks
                          valueLabelDisplay="on"
                          sx={{ maxWidth: 300 }}
                        />
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={splashScreenConfig.fadeOut}
                            onChange={(e) =>
                              setSplashScreenConfig({
                                ...splashScreenConfig,
                                fadeOut: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Fade out animation"
                      />

                      <Button
                        variant="outlined"
                        onClick={() => setSplashPreviewDialog(true)}
                        startIcon={<PlayArrowIcon />}
                      >
                        Preview Splash Screen
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Splash Screen Tips
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" paragraph>
                      • Use high-resolution images for crisp display
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Keep duration between 2-4 seconds
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Ensure images match your brand identity
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Test on multiple devices
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Splash screens appear when users launch your PWA from their home screen.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Help Documentation Customizer */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Help Documentation Configuration
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={3}>
                      <FormControl>
                        <FormLabel>Help System Type</FormLabel>
                        <RadioGroup
                          value={helpConfig.type}
                          onChange={(e) =>
                            setHelpConfig({
                              ...helpConfig,
                              type: e.target.value as 'external' | 'embedded' | 'disabled',
                            })
                          }
                        >
                          <FormControlLabel
                            value="external"
                            control={<Radio />}
                            label="External Knowledge Base (Link)"
                          />
                          <FormControlLabel
                            value="embedded"
                            control={<Radio />}
                            label="Embedded Help Widget"
                          />
                          <FormControlLabel
                            value="disabled"
                            control={<Radio />}
                            label="Disabled (No help system)"
                          />
                        </RadioGroup>
                      </FormControl>

                      {helpConfig.type === 'external' && (
                        <Box>
                          <TextField
                            fullWidth
                            label="Knowledge Base URL"
                            value={helpConfig.knowledgeBaseUrl || ''}
                            onChange={(e) =>
                              setHelpConfig({ ...helpConfig, knowledgeBaseUrl: e.target.value })
                            }
                            placeholder="https://help.schoolname.edu"
                            helperText="Link to your institution's help documentation or knowledge base"
                          />
                        </Box>
                      )}

                      {helpConfig.type === 'embedded' && (
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Help Widget Embed Code
                          </Typography>
                          <Typography variant="caption" color="text.secondary" paragraph>
                            Paste the embed code from your help widget provider (e.g., Intercom,
                            Zendesk, Freshdesk)
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={6}
                            value={helpConfig.embedWidgetCode || ''}
                            onChange={(e) =>
                              setHelpConfig({ ...helpConfig, embedWidgetCode: e.target.value })
                            }
                            placeholder="<script>...</script>"
                            sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                          />
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            Only paste embed codes from trusted help widget providers. Malicious
                            code could compromise security.
                          </Alert>
                        </Box>
                      )}

                      {helpConfig.type !== 'disabled' && (
                        <Box>
                          <TextField
                            fullWidth
                            label="Custom Help Button Text (Optional)"
                            value={helpConfig.customHelpText || ''}
                            onChange={(e) =>
                              setHelpConfig({ ...helpConfig, customHelpText: e.target.value })
                            }
                            placeholder="Need help?"
                            helperText="Customize the text shown on the help button"
                          />
                        </Box>
                      )}

                      {helpConfig.type === 'external' && helpConfig.knowledgeBaseUrl && (
                        <Alert severity="success" icon={<LinkIcon />}>
                          Users will be directed to: {helpConfig.knowledgeBaseUrl}
                        </Alert>
                      )}

                      {helpConfig.type === 'embedded' && helpConfig.embedWidgetCode && (
                        <Alert severity="success" icon={<CodeIcon />}>
                          Help widget code configured. Widget will appear on all pages.
                        </Alert>
                      )}

                      {helpConfig.type === 'disabled' && (
                        <Alert severity="info">
                          Help system is disabled. Users will not see help buttons or links.
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Help System Guide
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      External Knowledge Base
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Link to your own help documentation. Good for custom guides and FAQs.
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Embedded Widget
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Integrate third-party help widgets like Intercom or Zendesk for live chat and
                      contextual help.
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Providing comprehensive help documentation improves user satisfaction and
                      reduces support requests.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Merchandise Store Configuration */}
          <TabPanel value={tabValue} index={5}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Merchandise Store Settings
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={3}>
                      <Alert severity="info" icon={<StoreIcon />}>
                        Configure your school&apos;s merchandise store to sell branded items to
                        students and parents. The store integrates with Stripe for secure payments.
                      </Alert>

                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Enable Merchandise Store"
                      />

                      <TextField
                        fullWidth
                        label="Store Welcome Message"
                        defaultValue="Welcome to our official school store!"
                        helperText="Message displayed at the top of the store"
                      />

                      <TextField
                        fullWidth
                        label="Commission Rate (%)"
                        type="number"
                        defaultValue="10"
                        helperText="Percentage of each sale going to the school"
                      />

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Store Logo
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          Upload a custom logo for your merchandise store
                        </Typography>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="store-logo-upload"
                          type="file"
                        />
                        <label htmlFor="store-logo-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                          >
                            Upload Store Logo
                          </Button>
                        </label>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Integration Links
                        </Typography>
                        <Stack spacing={2}>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                              Store URL
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Your merchandise store is accessible at:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  bgcolor: 'background.paper',
                                  p: 1,
                                  borderRadius: 1,
                                  flex: 1,
                                }}
                              >
                                /merchandise/store
                              </Typography>
                              <Tooltip title="Copy to clipboard">
                                <IconButton
                                  edge="end"
                                  onClick={() => copyToClipboard('/merchandise/store')}
                                >
                                  <CopyIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Paper>

                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                              Admin Panel
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Manage products and view analytics at:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  bgcolor: 'background.paper',
                                  p: 1,
                                  borderRadius: 1,
                                  flex: 1,
                                }}
                              >
                                /admin/merchandise
                              </Typography>
                              <Tooltip title="Copy to clipboard">
                                <IconButton
                                  edge="end"
                                  onClick={() => copyToClipboard('/admin/merchandise')}
                                >
                                  <CopyIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Paper>
                        </Stack>
                      </Box>

                      <Alert severity="success">
                        Merchandise store is integrated with school branding. Your logo, colors, and
                        theme will be applied automatically.
                      </Alert>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Store Features
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          ✓ Product Catalog
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage products with images, sizes, colors, and stock levels
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          ✓ Customization
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Allow personalization with student names, graduation years, and jersey
                          numbers
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          ✓ Secure Payments
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stripe integration for safe and reliable transactions
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          ✓ Order Tracking
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Real-time production status and shipping updates
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          ✓ Revenue Analytics
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Track sales, popular products, and commission earnings
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Grid>
      </Grid>

      {/* Email Preview Dialog */}
      <Dialog
        open={emailPreviewDialog}
        onClose={() => setEmailPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Branded Email Preview</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ borderBottom: 3, borderColor: 'primary.main', pb: 2, mb: 3 }}>
                <Typography variant="h6">New Assignment Posted</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Dear Student,
              </Typography>
              <Typography variant="body2" paragraph>
                A new assignment has been posted in your Mathematics class. Please review and submit
                before the deadline.
              </Typography>
              <Button variant="contained" sx={{ mb: 3 }}>
                View Assignment
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                From: notifications@{emailDomain.domain || 'schoolname.edu'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This email was sent by {emailDomain.domain || 'Your Institution'}
              </Typography>
            </Paper>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Sound Upload Dialog */}
      <Dialog
        open={uploadingSoundDialog}
        onClose={() => setUploadingSoundDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Custom Sound</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upload a custom notification sound (MP3 or WAV, max 500KB, under 2 seconds)
            </Typography>
            <input
              accept="audio/mp3,audio/wav,audio/mpeg"
              style={{ display: 'none' }}
              id="sound-upload-input"
              type="file"
              onChange={handleSoundUpload}
            />
            <label htmlFor="sound-upload-input">
              <Button fullWidth variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                Choose Audio File
              </Button>
            </label>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadingSoundDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Loading Screen Preview Dialog */}
      <Dialog
        open={loadingPreviewDialog}
        onClose={() => setLoadingPreviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box
            sx={{
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: loadingScreenConfig.backgroundColor,
            }}
          >
            {loadingScreenConfig.animationType === 'spinner' && (
              <CircularProgress sx={{ color: loadingScreenConfig.progressBarColor }} size={80} />
            )}
            {loadingScreenConfig.animationType === 'progress' && (
              <Box sx={{ width: '80%' }}>
                <LinearProgress
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: loadingScreenConfig.progressBarColor,
                    },
                  }}
                />
              </Box>
            )}
            {loadingScreenConfig.animationType === 'custom' && loadingScreenConfig.animationUrl && (
              <img
                src={loadingScreenConfig.animationUrl}
                alt="Loading animation"
                style={{ maxHeight: 120 }}
              />
            )}
            <Typography variant="h6" sx={{ mt: 3, textAlign: 'center' }}>
              {loadingScreenConfig.loadingMessages[
                Math.floor(Math.random() * loadingScreenConfig.loadingMessages.length)
              ] || 'Loading...'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoadingPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Splash Screen Preview Dialog */}
      <Dialog
        open={splashPreviewDialog}
        onClose={() => setSplashPreviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              minHeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: splashScreenConfig.backgroundColor,
            }}
          >
            {splashScreenConfig.portraitImageUrl ? (
              <img
                src={splashScreenConfig.portraitImageUrl}
                alt="Splash screen"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Typography variant="h5" color="white">
                Your Splash Screen
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, ml: 2 }}>
            Duration: {splashScreenConfig.duration}s{splashScreenConfig.fadeOut && ' with fade out'}
          </Typography>
          <Button onClick={() => setSplashPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
