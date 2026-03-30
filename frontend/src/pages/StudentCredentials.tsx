import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  WorkspacePremium as BadgeIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Fingerprint as FingerprintIcon,
  AccountBalance as BlockchainIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { credentialsApi } from '@/api/credentials';
import { isDemoUser } from '@/api/demoDataApi';
import { demoDataApi } from '@/api/demoDataApi';
import {
  Credential,
  CredentialType,
  CredentialStatus,
  CredentialPrivacy,
} from '@/types/credential';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const StudentCredentials: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [blockchainDialogOpen, setBlockchainDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [shareUrl, setShareUrl] = useState('');
  const [shareCreating, setShareCreating] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<Record<number, CredentialPrivacy>>({});
  const [blockchainData, setBlockchainData] = useState<unknown>(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const isDemo = isDemoUser();

  const loadCredentials = React.useCallback(async () => {
    try {
      setLoading(true);
      const api = isDemo ? demoDataApi.credentials : credentialsApi;
      const data = await api.getMyCredentials();
      setCredentials(data);
      const initialPrivacy: Record<number, CredentialPrivacy> = {};
      data.forEach((cred) => {
        initialPrivacy[cred.id] = CredentialPrivacy.PRIVATE;
      });
      setPrivacySettings(initialPrivacy);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleViewDetails = (credential: Credential) => {
    setSelectedCredential(credential);
    setDetailDialogOpen(true);
  };

  const handleShare = (credential: Credential) => {
    setSelectedCredential(credential);
    setShareDialogOpen(true);
    setShareUrl('');
  };

  const handleCreateShareLink = async () => {
    if (!selectedCredential) return;

    try {
      setShareCreating(true);
      const api = isDemo ? demoDataApi.credentials : credentialsApi;
      const shareData = await api.createShareLink(selectedCredential.id, {});
      setShareUrl(shareData.share_url);
    } catch (err) {
      alert('Failed to create share link: ' + (err as Error).message);
    } finally {
      setShareCreating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleShareToLinkedIn = () => {
    if (!selectedCredential) return;
    const url = shareUrl || window.location.href;
    const text = `I earned ${selectedCredential.title}!`;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const handleShareToTwitter = () => {
    if (!selectedCredential) return;
    const url = shareUrl || window.location.href;
    const text = `I earned ${selectedCredential.title}! 🎓`;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const handleDownloadJSON = async (credential: Credential) => {
    const api = isDemo ? demoDataApi.credentials : credentialsApi;
    await api.downloadCredentialAsJSON(credential);
  };

  const handleDownloadPDF = async (credential: Credential) => {
    try {
      const api = isDemo ? demoDataApi.credentials : credentialsApi;
      await api.downloadCredentialAsPDF(credential.id);
    } catch (err) {
      alert('PDF download not available yet');
    }
  };

  const handleViewBlockchain = async (credential: Credential) => {
    setSelectedCredential(credential);
    setBlockchainDialogOpen(true);
    setBlockchainLoading(true);
    try {
      const api = isDemo ? demoDataApi.credentials : credentialsApi;
      const data = await api.getBlockchainHistory(credential.certificate_number);
      setBlockchainData(data);
    } catch (err) {
      setBlockchainData({ error: (err as Error).message });
    } finally {
      setBlockchainLoading(false);
    }
  };

  const handlePrivacyChange = (credentialId: number, privacy: CredentialPrivacy) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [credentialId]: privacy,
    }));
  };

  const handleOpenPrivacyDialog = (credential: Credential) => {
    setSelectedCredential(credential);
    setPrivacyDialogOpen(true);
  };

  const handleOpenEmbedDialog = (credential: Credential) => {
    setSelectedCredential(credential);
    setEmbedDialogOpen(true);
  };

  const getEmbedCode = (credential: Credential) => {
    const embedUrl = `${window.location.origin}/credentials/embed/${credential.id}`;
    return `<iframe src="${embedUrl}" width="400" height="300" frameborder="0"></iframe>`;
  };

  const getCredentialIcon = (credential: Credential) => {
    if (credential.credential_type === CredentialType.DIGITAL_BADGE) {
      return <BadgeIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
    }
    return <SchoolIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
  };

  const getStatusColor = (status: CredentialStatus) => {
    switch (status) {
      case CredentialStatus.ACTIVE:
        return 'success';
      case CredentialStatus.PENDING:
        return 'warning';
      case CredentialStatus.REVOKED:
        return 'error';
      case CredentialStatus.EXPIRED:
        return 'default';
      default:
        return 'default';
    }
  };

  const filterCredentials = (type?: CredentialType) => {
    if (!type) return credentials;
    return credentials.filter((c) => c.credential_type === type);
  };

  const activeCredentials = filterCredentials();
  const certificates = filterCredentials(CredentialType.CERTIFICATE);
  const badges = filterCredentials(CredentialType.DIGITAL_BADGE);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {isDemo && (
        <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 3 }}>
          Demo Mode: Viewing sample credentials with mock blockchain verification
        </Alert>
      )}
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Digital Credentials Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and share your earned certificates and badges
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
            }}
          >
            <TrophyIcon sx={{ fontSize: 36 }} />
          </Avatar>
        </Stack>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label={`All Credentials (${credentials.length})`} />
            <Tab label={`Certificates (${certificates.length})`} />
            <Tab label={`Badges (${badges.length})`} />
          </Tabs>
        </Paper>

        <TabPanel value={activeTab} index={0}>
          <CredentialGrid
            credentials={activeCredentials}
            onViewDetails={handleViewDetails}
            onShare={handleShare}
            onDownloadJSON={handleDownloadJSON}
            onDownloadPDF={handleDownloadPDF}
            onViewBlockchain={handleViewBlockchain}
            onPrivacySettings={handleOpenPrivacyDialog}
            onEmbed={handleOpenEmbedDialog}
            getCredentialIcon={getCredentialIcon}
            getStatusColor={getStatusColor}
            privacySettings={privacySettings}
            isDemo={isDemo}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CredentialGrid
            credentials={certificates}
            onViewDetails={handleViewDetails}
            onShare={handleShare}
            onDownloadJSON={handleDownloadJSON}
            onDownloadPDF={handleDownloadPDF}
            onViewBlockchain={handleViewBlockchain}
            onPrivacySettings={handleOpenPrivacyDialog}
            onEmbed={handleOpenEmbedDialog}
            getCredentialIcon={getCredentialIcon}
            getStatusColor={getStatusColor}
            privacySettings={privacySettings}
            isDemo={isDemo}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CredentialGrid
            credentials={badges}
            onViewDetails={handleViewDetails}
            onShare={handleShare}
            onDownloadJSON={handleDownloadJSON}
            onDownloadPDF={handleDownloadPDF}
            onViewBlockchain={handleViewBlockchain}
            onPrivacySettings={handleOpenPrivacyDialog}
            onEmbed={handleOpenEmbedDialog}
            getCredentialIcon={getCredentialIcon}
            getStatusColor={getStatusColor}
            privacySettings={privacySettings}
            isDemo={isDemo}
          />
        </TabPanel>
      </Box>

      <DetailDialog
        open={detailDialogOpen}
        credential={selectedCredential}
        onClose={() => setDetailDialogOpen(false)}
        getCredentialIcon={getCredentialIcon}
        getStatusColor={getStatusColor}
        isDemo={isDemo}
      />

      <ShareDialog
        open={shareDialogOpen}
        credential={selectedCredential}
        shareUrl={shareUrl}
        shareCreating={shareCreating}
        onClose={() => setShareDialogOpen(false)}
        onCreateShareLink={handleCreateShareLink}
        onCopyToClipboard={handleCopyToClipboard}
        onShareToLinkedIn={handleShareToLinkedIn}
        onShareToTwitter={handleShareToTwitter}
        isDemo={isDemo}
      />

      <BlockchainDialog
        open={blockchainDialogOpen}
        credential={selectedCredential}
        blockchainData={blockchainData}
        loading={blockchainLoading}
        onClose={() => setBlockchainDialogOpen(false)}
        isDemo={isDemo}
      />

      <PrivacyDialog
        open={privacyDialogOpen}
        credential={selectedCredential}
        privacySetting={selectedCredential ? privacySettings[selectedCredential.id] : undefined}
        onClose={() => setPrivacyDialogOpen(false)}
        onPrivacyChange={handlePrivacyChange}
      />

      <EmbedDialog
        open={embedDialogOpen}
        credential={selectedCredential}
        embedCode={selectedCredential ? getEmbedCode(selectedCredential) : ''}
        onClose={() => setEmbedDialogOpen(false)}
        onCopyToClipboard={handleCopyToClipboard}
      />
    </Container>
  );
};

interface CredentialGridProps {
  credentials: Credential[];
  onViewDetails: (credential: Credential) => void;
  onShare: (credential: Credential) => void;
  onDownloadJSON: (credential: Credential) => void;
  onDownloadPDF: (credential: Credential) => void;
  onViewBlockchain: (credential: Credential) => void;
  onPrivacySettings: (credential: Credential) => void;
  onEmbed: (credential: Credential) => void;
  getCredentialIcon: (credential: Credential) => React.ReactNode;
  getStatusColor: (status: CredentialStatus) => 'success' | 'warning' | 'error' | 'default';
  privacySettings: Record<number, CredentialPrivacy>;
  isDemo: boolean;
}

const CredentialGrid: React.FC<CredentialGridProps> = ({
  credentials,
  onViewDetails,
  onShare,
  onDownloadJSON,
  onDownloadPDF,
  onViewBlockchain,
  onPrivacySettings,
  _onEmbed,
  getCredentialIcon,
  getStatusColor,
  privacySettings,
  isDemo,
}) => {
  if (credentials.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No credentials found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {credentials.map((credential) => (
        <Grid item xs={12} sm={6} md={4} key={credential.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
              }}
            >
              <Chip
                label={credential.status}
                color={getStatusColor(credential.status)}
                size="small"
              />
            </Box>

            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
              }}
            >
              <Tooltip title={`Privacy: ${privacySettings[credential.id] || 'Private'}`}>
                <IconButton size="small" onClick={() => onPrivacySettings(credential)}>
                  {privacySettings[credential.id] === CredentialPrivacy.PUBLIC ? (
                    <PublicIcon fontSize="small" />
                  ) : (
                    <LockIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>

            <CardContent sx={{ flexGrow: 1, pt: 6 }}>
              <Box display="flex" justifyContent="center" mb={2}>
                {getCredentialIcon(credential)}
              </Box>

              <Typography variant="h6" align="center" gutterBottom fontWeight="bold">
                {credential.title}
              </Typography>

              <Typography variant="body2" color="text.secondary" align="center" mb={2}>
                {credential.description || 'No description available'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <FingerprintIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {credential.certificate_number}
                  </Typography>
                </Box>

                {credential.issued_at && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <HistoryIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Issued: {format(new Date(credential.issued_at), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                )}

                {credential.blockchain_status && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <VerifiedIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main">
                      {isDemo ? 'Blockchain Verified (Demo)' : 'Blockchain Verified'}
                    </Typography>
                  </Box>
                )}

                {credential.skills && credential.skills.length > 0 && (
                  <Box mt={1}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                      {credential.skills.slice(0, 3).map((skill, idx) => (
                        <Chip key={idx} label={skill} size="small" variant="outlined" />
                      ))}
                      {credential.skills.length > 3 && (
                        <Chip label={`+${credential.skills.length - 3}`} size="small" />
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              <Button size="small" onClick={() => onViewDetails(credential)}>
                View Details
              </Button>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Share">
                  <IconButton size="small" onClick={() => onShare(credential)}>
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download JSON">
                  <IconButton size="small" onClick={() => onDownloadJSON(credential)}>
                    <CodeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download PDF">
                  <IconButton size="small" onClick={() => onDownloadPDF(credential)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {credential.blockchain_credential_id && (
                  <Tooltip title="Blockchain Verification">
                    <IconButton size="small" onClick={() => onViewBlockchain(credential)}>
                      <BlockchainIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

interface DetailDialogProps {
  open: boolean;
  credential: Credential | null;
  onClose: () => void;
  getCredentialIcon: (credential: Credential) => React.ReactNode;
  getStatusColor: (status: CredentialStatus) => 'success' | 'warning' | 'error' | 'default';
  isDemo: boolean;
}

const DetailDialog: React.FC<DetailDialogProps> = ({
  open,
  credential,
  onClose,
  getCredentialIcon,
  getStatusColor,
  isDemo,
}) => {
  if (!credential) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Credential Details</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {isDemo && (
          <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 2 }}>
            Demo Credential - Template preview with watermark
          </Alert>
        )}
        <Stack spacing={3}>
          <Box textAlign="center">
            {getCredentialIcon(credential)}
            <Typography variant="h5" fontWeight="bold" mt={2}>
              {credential.title}
            </Typography>
            <Chip
              label={credential.status}
              color={getStatusColor(credential.status)}
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">{credential.description || 'N/A'}</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Certificate Number
              </Typography>
              <Typography variant="body2">{credential.certificate_number}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Type
              </Typography>
              <Typography variant="body2">
                {credential.credential_type.replace('_', ' ')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Issued Date
              </Typography>
              <Typography variant="body2">
                {credential.issued_at
                  ? format(new Date(credential.issued_at), 'MMMM dd, yyyy')
                  : 'N/A'}
              </Typography>
            </Grid>
            {credential.expires_at && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Expires
                </Typography>
                <Typography variant="body2">
                  {format(new Date(credential.expires_at), 'MMMM dd, yyyy')}
                </Typography>
              </Grid>
            )}
            {credential.grade && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Grade
                </Typography>
                <Typography variant="body2">{credential.grade}</Typography>
              </Grid>
            )}
            {credential.score !== undefined && credential.score !== null && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Score
                </Typography>
                <Typography variant="body2">{credential.score}</Typography>
              </Grid>
            )}
          </Grid>

          {credential.skills && credential.skills.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Skills
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {credential.skills.map((skill, idx) => (
                  <Chip key={idx} label={skill} variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          {credential.blockchain_status && (
            <Alert severity="success" icon={<VerifiedIcon />}>
              {isDemo
                ? 'This credential is verified on the blockchain (Demo)'
                : 'This credential is verified on the blockchain'}
            </Alert>
          )}

          {credential.verification_count !== undefined && credential.verification_count > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Verification Statistics
              </Typography>
              <Typography variant="body2">
                Verified {credential.verification_count} time(s)
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface ShareDialogProps {
  open: boolean;
  credential: Credential | null;
  shareUrl: string;
  shareCreating: boolean;
  onClose: () => void;
  onCreateShareLink: () => void;
  onCopyToClipboard: (text: string) => void;
  onShareToLinkedIn: () => void;
  onShareToTwitter: () => void;
  isDemo: boolean;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  credential,
  shareUrl,
  shareCreating,
  onClose,
  onCreateShareLink,
  onCopyToClipboard,
  onShareToLinkedIn,
  onShareToTwitter,
  isDemo,
}) => {
  if (!credential) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Share Credential</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {isDemo && (
          <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 2 }}>
            Demo Mode - Mock share link generated
          </Alert>
        )}
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              {credential.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {credential.certificate_number}
            </Typography>
          </Box>

          {credential.qr_code_url && (
            <Box textAlign="center">
              <Typography variant="subtitle2" gutterBottom>
                QR Code
              </Typography>
              <img src={credential.qr_code_url} alt="QR Code" style={{ maxWidth: 200 }} />
            </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Share Link
            </Typography>
            {shareUrl ? (
              <Stack spacing={1}>
                <TextField
                  fullWidth
                  value={shareUrl}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={() => onCopyToClipboard(shareUrl)}>
                        <CopyIcon />
                      </IconButton>
                    ),
                  }}
                  size="small"
                />
                <Alert severity="info">
                  {isDemo ? 'Mock link created successfully!' : 'Link created successfully!'}
                </Alert>
              </Stack>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={onCreateShareLink}
                disabled={shareCreating}
                startIcon={<LinkIcon />}
              >
                {shareCreating ? 'Creating...' : 'Generate Share Link'}
              </Button>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Share on Social Media
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Tooltip title="Share on LinkedIn">
                <IconButton
                  onClick={onShareToLinkedIn}
                  sx={{ bgcolor: '#0077b5', color: 'white', '&:hover': { bgcolor: '#006399' } }}
                >
                  <LinkedInIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share on Twitter">
                <IconButton
                  onClick={onShareToTwitter}
                  sx={{ bgcolor: '#1DA1F2', color: 'white', '&:hover': { bgcolor: '#1a8cd8' } }}
                >
                  <TwitterIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {credential.verification_url && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Verification Link
              </Typography>
              <TextField
                fullWidth
                value={credential.verification_url}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => onCopyToClipboard(credential.verification_url!)}>
                      <CopyIcon />
                    </IconButton>
                  ),
                }}
                size="small"
              />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface BlockchainDialogProps {
  open: boolean;
  credential: Credential | null;
  blockchainData: unknown;
  loading: boolean;
  onClose: () => void;
  isDemo: boolean;
}

const BlockchainDialog: React.FC<BlockchainDialogProps> = ({
  open,
  credential,
  blockchainData,
  loading,
  onClose,
  isDemo,
}) => {
  if (!credential) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Blockchain Verification</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {isDemo && (
          <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 2 }}>
            Demo Mode - Mock blockchain verification data
          </Alert>
        )}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (blockchainData as { error?: string })?.error ? (
          <Alert severity="error">{(blockchainData as { error: string }).error}</Alert>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {credential.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certificate: {credential.certificate_number}
              </Typography>
            </Box>

            <Divider />

            {credential.blockchain_credential_id && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Blockchain Credential ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {credential.blockchain_credential_id}
                </Typography>
              </Box>
            )}

            {credential.blockchain_hash && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Transaction Hash
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {credential.blockchain_hash}
                </Typography>
              </Box>
            )}

            {credential.issued_at && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Issuance Timestamp
                </Typography>
                <Typography variant="body2">
                  {format(new Date(credential.issued_at), 'MMMM dd, yyyy HH:mm:ss')}
                </Typography>
              </Box>
            )}

            {credential.blockchain_status && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <strong>Authenticity Verified</strong>
                <br />
                {isDemo
                  ? 'This credential has been verified on the blockchain (Demo).'
                  : 'This credential has been verified on the blockchain and is authentic.'}
              </Alert>
            )}

            {(blockchainData as { history?: Array<{ action?: string; timestamp: string }> })
              ?.history && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Transaction History
                </Typography>
                <List dense>
                  {(
                    blockchainData as { history: Array<{ action?: string; timestamp: string }> }
                  ).history.map((item, idx: number) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <HistoryIcon />
                      </ListItemIcon>
                      <ListItemText primary={item.action || 'Event'} secondary={item.timestamp} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface PrivacyDialogProps {
  open: boolean;
  credential: Credential | null;
  privacySetting?: CredentialPrivacy;
  onClose: () => void;
  onPrivacyChange: (credentialId: number, privacy: CredentialPrivacy) => void;
}

const PrivacyDialog: React.FC<PrivacyDialogProps> = ({
  open,
  credential,
  privacySetting,
  onClose,
  onPrivacyChange,
}) => {
  const [localPrivacy, setLocalPrivacy] = useState<CredentialPrivacy>(
    privacySetting || CredentialPrivacy.PRIVATE
  );

  useEffect(() => {
    if (privacySetting) {
      setLocalPrivacy(privacySetting);
    }
  }, [privacySetting]);

  const handleSave = () => {
    if (credential) {
      onPrivacyChange(credential.id, localPrivacy);
      onClose();
    }
  };

  if (!credential) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Privacy Settings</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {credential.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {credential.certificate_number}
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Privacy Level</InputLabel>
            <Select
              value={localPrivacy}
              onChange={(e) => setLocalPrivacy(e.target.value as CredentialPrivacy)}
              label="Privacy Level"
            >
              <MenuItem value={CredentialPrivacy.PUBLIC}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PublicIcon />
                  <Box>
                    <Typography variant="body2">Public</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Anyone can view this credential
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value={CredentialPrivacy.PRIVATE}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LockIcon />
                  <Box>
                    <Typography variant="body2">Private</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only you can view this credential
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value={CredentialPrivacy.SELECTIVE}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VisibilityIcon />
                  <Box>
                    <Typography variant="body2">Selective</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Share via links only
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info">
            Privacy settings control who can view your credential. Public credentials appear in
            searches and your portfolio.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface EmbedDialogProps {
  open: boolean;
  credential: Credential | null;
  embedCode: string;
  onClose: () => void;
  onCopyToClipboard: (text: string) => void;
}

const EmbedDialog: React.FC<EmbedDialogProps> = ({
  open,
  credential,
  embedCode,
  onClose,
  onCopyToClipboard,
}) => {
  if (!credential) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Embed Credential</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {credential.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Embed this credential in your portfolio or resume
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Embed Code
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={embedCode}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton onClick={() => onCopyToClipboard(embedCode)}>
                    <CopyIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>

          <Alert severity="info">
            Copy this code and paste it into your website or portfolio to embed this credential.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => onCopyToClipboard(embedCode)}>
          Copy Code
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentCredentials;
