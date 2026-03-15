import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Paper,
  TextField,
  Avatar,
  Chip,
  IconButton,
  Stack,
  List,
  ListItem,
  Divider,
  Alert,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  VideoLibrary as VideoIcon,
  Image as ImageIcon,
  Analytics as AnalyticsIcon,
  ThumbUp as ThumbUpIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import electionsApi from '@/api/elections';
import { Candidate, CampaignAnalytics, PosterTemplate } from '@/types/elections';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

const CampaignManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [posterTemplates, setPosterTemplates] = useState<PosterTemplate[]>([]);
  const [campaignStatement, setCampaignStatement] = useState('');
  const [platformPoints, setPlatformPoints] = useState<string[]>(['']);
  const [slogan, setSlogan] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchCandidateData();
    fetchPosterTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      await electionsApi.getElections(institutionId);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch candidate data:', error);
      setLoading(false);
    }
  };

  const fetchPosterTemplates = async () => {
    try {
      const templates = await electionsApi.getPosterTemplates();
      setPosterTemplates(templates);
    } catch (error) {
      console.error('Failed to fetch poster templates:', error);
    }
  };

  const fetchAnalytics = async (candidateId: number) => {
    try {
      const data = await electionsApi.getCampaignAnalytics(institutionId, candidateId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!candidate) return;

    try {
      await electionsApi.updateCandidate(institutionId, candidate.id, {
        campaign_statement: campaignStatement,
        platform_points: platformPoints.filter((p) => p.trim() !== ''),
        slogan,
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleUploadPoster = async () => {
    if (!candidate || !posterFile) return;

    try {
      const posterUrl = await electionsApi.uploadPoster(institutionId, candidate.id, posterFile);
      setCandidate({ ...candidate, poster_url: posterUrl });
      setPosterFile(null);
      alert('Poster uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload poster:', error);
      alert('Failed to upload poster. Please try again.');
    }
  };

  const handleUploadVideo = async () => {
    if (!candidate || !videoFile) return;

    try {
      const videoUrl = await electionsApi.uploadVideo(institutionId, candidate.id, videoFile);
      setCandidate({ ...candidate, video_url: videoUrl });
      setVideoFile(null);
      alert('Video uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Failed to upload video. Please try again.');
    }
  };

  const handleAddPlatformPoint = () => {
    setPlatformPoints([...platformPoints, '']);
  };

  const handleRemovePlatformPoint = (index: number) => {
    setPlatformPoints(platformPoints.filter((_, i) => i !== index));
  };

  const handlePlatformPointChange = (index: number, value: string) => {
    const newPoints = [...platformPoints];
    newPoints[index] = value;
    setPlatformPoints(newPoints);
  };

  useEffect(() => {
    if (candidate) {
      setCampaignStatement(candidate.campaign_statement || '');
      setPlatformPoints(candidate.platform_points.length > 0 ? candidate.platform_points : ['']);
      setSlogan(candidate.slogan || '');
      if (activeTab === 4) {
        fetchAnalytics(candidate.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate, activeTab]);

  const viewsTrendData = analytics
    ? {
        labels: analytics.views_trend.map((v) => v.date),
        datasets: [
          {
            label: 'Profile Views',
            data: analytics.views_trend.map((v) => v.views),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
          },
        ],
      }
    : null;

  const comparisonData = analytics
    ? {
        labels: analytics.comparison_with_others.map((c) => c.candidate_name),
        datasets: [
          {
            label: 'Profile Views',
            data: analytics.comparison_with_others.map((c) => c.profile_views),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
          },
          {
            label: 'Endorsements',
            data: analytics.comparison_with_others.map((c) => c.endorsements_count),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Campaign Manager
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your election campaign and track your performance
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              }}
            >
              <CampaignIcon sx={{ fontSize: 36 }} />
            </Avatar>
          </Stack>

          {candidate && (
            <Alert severity="info">
              <AlertTitle>Campaign Status: {candidate.status.toUpperCase()}</AlertTitle>
              {candidate.status === 'pending' && 'Your candidacy is pending approval.'}
              {candidate.status === 'approved' && 'Your candidacy has been approved. Good luck!'}
              {candidate.status === 'rejected' &&
                `Your candidacy was rejected: ${candidate.rejected_reason}`}
            </Alert>
          )}
        </Box>

        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { minHeight: 64, fontSize: '1rem', fontWeight: 600 },
            }}
          >
            <Tab icon={<EditIcon />} label="Profile Editor" iconPosition="start" />
            <Tab icon={<AddIcon />} label="Platform Builder" iconPosition="start" />
            <Tab icon={<ImageIcon />} label="Poster" iconPosition="start" />
            <Tab icon={<VideoIcon />} label="Video" iconPosition="start" />
            <Tab icon={<ThumbUpIcon />} label="Endorsements" iconPosition="start" />
            <Tab icon={<AnalyticsIcon />} label="Analytics" iconPosition="start" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title="Edit Your Profile" />
                  <CardContent>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Campaign Slogan"
                        placeholder="Your catchy campaign slogan"
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                        helperText="A short, memorable phrase (max 100 characters)"
                        inputProps={{ maxLength: 100 }}
                      />

                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Campaign Statement"
                        placeholder="Tell voters why you're running and what you stand for..."
                        value={campaignStatement}
                        onChange={(e) => setCampaignStatement(e.target.value)}
                        helperText="Explain your vision and qualifications (500-1000 characters)"
                        inputProps={{ maxLength: 1000 }}
                      />

                      <Button variant="contained" onClick={handleSaveProfile} size="large">
                        Save Profile
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Profile Preview" />
                  <CardContent>
                    <Stack alignItems="center" spacing={2}>
                      <Avatar sx={{ width: 100, height: 100 }}>
                        {candidate?.student?.first_name.charAt(0)}
                      </Avatar>
                      <Typography variant="h6">
                        {candidate?.student?.first_name} {candidate?.student?.last_name}
                      </Typography>
                      {slogan && (
                        <Typography
                          variant="body2"
                          fontStyle="italic"
                          color="primary"
                          textAlign="center"
                        >
                          &ldquo;{slogan}&rdquo;
                        </Typography>
                      )}
                      <Chip label={candidate?.student?.grade} size="small" />
                      <Divider flexItem />
                      <Box width="100%">
                        <Typography variant="caption" color="text.secondary">
                          Character count: {campaignStatement.length}/1000
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Card>
              <CardHeader
                title="Platform Points"
                subheader="List your key campaign promises and goals"
                action={
                  <Button startIcon={<AddIcon />} onClick={handleAddPlatformPoint}>
                    Add Point
                  </Button>
                }
              />
              <CardContent>
                <Stack spacing={2}>
                  {platformPoints.map((point, index) => (
                    <Box key={index} display="flex" gap={2} alignItems="center">
                      <TextField
                        fullWidth
                        label={`Platform Point ${index + 1}`}
                        value={point}
                        onChange={(e) => handlePlatformPointChange(index, e.target.value)}
                        placeholder="E.g., Improve cafeteria food quality"
                      />
                      {platformPoints.length > 1 && (
                        <IconButton color="error" onClick={() => handleRemovePlatformPoint(index)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Save Platform
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Upload Campaign Poster" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        fullWidth
                      >
                        Choose Poster Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                        />
                      </Button>
                      {posterFile && <Alert severity="success">Selected: {posterFile.name}</Alert>}
                      <Button
                        variant="contained"
                        onClick={handleUploadPoster}
                        disabled={!posterFile}
                      >
                        Upload Poster
                      </Button>
                      {candidate?.poster_url && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Current Poster:
                          </Typography>
                          <img
                            src={candidate.poster_url}
                            alt="Campaign poster"
                            style={{ width: '100%', borderRadius: 8 }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Poster Templates"
                    subheader="Choose from pre-designed templates"
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      {posterTemplates.map((template) => (
                        <Grid item xs={6} key={template.id}>
                          <Paper
                            sx={{
                              p: 1,
                              cursor: 'pointer',
                              '&:hover': { boxShadow: 4 },
                            }}
                          >
                            <img
                              src={template.thumbnail_url}
                              alt={template.name}
                              style={{ width: '100%', borderRadius: 4 }}
                            />
                            <Typography variant="caption" textAlign="center" display="block" mt={1}>
                              {template.name}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Card>
              <CardHeader
                title="Campaign Video"
                subheader="Upload a video introducing yourself (max 3 minutes)"
              />
              <CardContent>
                <Stack spacing={2}>
                  <Button variant="outlined" component="label" startIcon={<VideoIcon />} fullWidth>
                    Choose Video File
                    <input
                      type="file"
                      hidden
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {videoFile && <Alert severity="success">Selected: {videoFile.name}</Alert>}
                  <Button variant="contained" onClick={handleUploadVideo} disabled={!videoFile}>
                    Upload Video
                  </Button>
                  {candidate?.video_url && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current Video:
                      </Typography>
                      <video
                        src={candidate.video_url}
                        controls
                        style={{ width: '100%', borderRadius: 8 }}
                      />
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <Card>
              <CardHeader
                title="Endorsements"
                subheader={`${candidate?.endorsements_count || 0} endorsements received`}
              />
              <CardContent>
                <List>
                  {candidate?.endorsements?.map((endorsement) => (
                    <React.Fragment key={endorsement.id}>
                      <ListItem>
                        <Stack direction="row" spacing={2} alignItems="center" width="100%">
                          <Avatar src={endorsement.endorser?.photo_url}>
                            {endorsement.endorser?.first_name.charAt(0)}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {endorsement.endorser?.first_name} {endorsement.endorser?.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {endorsement.message}
                            </Typography>
                            <Chip
                              label={endorsement.is_public ? 'Public' : 'Private'}
                              size="small"
                              color={endorsement.is_public ? 'success' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Stack>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <ViewIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                      <Typography variant="h3" fontWeight="bold">
                        {analytics?.profile_views || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Profile Views
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <ThumbUpIcon sx={{ fontSize: 48, color: 'success.main' }} />
                      <Typography variant="h3" fontWeight="bold">
                        {analytics?.endorsements_count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Endorsements
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <ImageIcon sx={{ fontSize: 48, color: 'warning.main' }} />
                      <Typography variant="h3" fontWeight="bold">
                        {analytics?.poster_downloads || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Poster Downloads
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <VideoIcon sx={{ fontSize: 48, color: 'error.main' }} />
                      <Typography variant="h3" fontWeight="bold">
                        {analytics?.video_plays || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Video Plays
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {viewsTrendData && (
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardHeader title="Profile Views Trend" />
                    <CardContent>
                      <Line data={viewsTrendData} options={{ responsive: true }} />
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {comparisonData && (
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardHeader title="Engagement Score" />
                    <CardContent>
                      <Stack alignItems="center" spacing={2}>
                        <Typography variant="h2" fontWeight="bold" color="primary">
                          {analytics?.engagement_score || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          Based on views, endorsements, and interactions
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {comparisonData && (
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Comparison with Other Candidates" />
                    <CardContent>
                      <Bar data={comparisonData} options={{ responsive: true }} />
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default CampaignManager;
