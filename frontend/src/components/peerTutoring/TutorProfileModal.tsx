import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Rating,
  Chip,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  CircularProgress,
  useTheme,
  alpha,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as VerifiedIcon,
  Star as StarIcon,
  Language as LanguageIcon,
  EmojiEvents as AwardIcon,
  ThumbUp as ThumbUpIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { peerTutoringApi, Tutor, TutorProfile, TutorReview } from '@/api/peerTutoring';

interface TutorProfileModalProps {
  tutor: Tutor;
  open: boolean;
  onClose: () => void;
  onBook: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function ReviewCard({ review }: { review: TutorReview }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar src={review.student_photo_url} sx={{ mr: 2 }}>
          {review.student_name.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {review.student_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Rating value={review.rating} size="small" readOnly />
            <Typography variant="caption" color="text.secondary">
              {new Date(review.session_date).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {review.comment}
      </Typography>
      {review.helpful_count > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <ThumbUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {review.helpful_count} found this helpful
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default function TutorProfileModal({
  tutor,
  open,
  onClose,
  onBook,
}: TutorProfileModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tutor.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await peerTutoringApi.getTutorProfile(tutor.id);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load tutor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            Tutor Profile
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : profile ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Avatar
                  src={profile.photo_url}
                  alt={profile.name}
                  sx={{ width: 100, height: 100, mr: 3 }}
                >
                  {profile.name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                      {profile.name}
                    </Typography>
                    {profile.is_verified && (
                      <VerifiedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {profile.grade}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating value={profile.rating} precision={0.1} readOnly />
                    <Typography variant="body2" fontWeight={600}>
                      {profile.rating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({profile.total_reviews} reviews)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.subjects.map((subject, index) => (
                      <Chip key={index} label={subject} size="small" color="primary" />
                    ))}
                  </Box>
                </Box>
              </Box>

              {profile.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {profile.bio}
                </Typography>
              )}

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {profile.sessions_completed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sessions
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      {profile.success_rate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} color="info.main">
                      {profile.response_time}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Response Time
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {profile.acceptance_rate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Acceptance
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="About" />
              <Tab label={`Reviews (${profile.reviews.length})`} />
              <Tab label="Achievements" />
            </Tabs>

            <TabPanel value={currentTab} index={0}>
              {profile.expertise_areas.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Expertise Areas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.expertise_areas.map((area, index) => (
                      <Chip key={index} label={area} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {profile.languages.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Languages
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <LanguageIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {profile.languages.join(', ')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {profile.preferred_teaching_style && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Teaching Style
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.preferred_teaching_style}
                  </Typography>
                </Box>
              )}

              {profile.certifications.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Certifications
                  </Typography>
                  <List dense>
                    {profile.certifications.map((cert) => (
                      <ListItem key={cert.id} disablePadding sx={{ mb: 1 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            width: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {cert.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {cert.issuer} • {new Date(cert.issue_date).getFullYear()}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              {profile.reviews.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <StarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No reviews yet
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {profile.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              {profile.achievement_badges.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AwardIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No achievements yet
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {profile.achievement_badges.map((badge) => {
                    const getRarityColor = (rarity: string) => {
                      switch (rarity) {
                        case 'legendary':
                          return '#FFD700';
                        case 'epic':
                          return '#9C27B0';
                        case 'rare':
                          return '#2196F3';
                        default:
                          return theme.palette.grey[500];
                      }
                    };

                    return (
                      <Grid item xs={12} sm={6} key={badge.id}>
                        <Card
                          elevation={0}
                          sx={{
                            border: `2px solid ${getRarityColor(badge.rarity)}`,
                            bgcolor: alpha(getRarityColor(badge.rarity), 0.05),
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h4" sx={{ mr: 2 }}>
                                {badge.icon}
                              </Typography>
                              <Box>
                                <Typography variant="body1" fontWeight={600}>
                                  {badge.name}
                                </Typography>
                                <Chip
                                  label={badge.rarity}
                                  size="small"
                                  sx={{
                                    bgcolor: getRarityColor(badge.rarity),
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    height: 18,
                                    textTransform: 'uppercase',
                                  }}
                                />
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {badge.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Earned: {new Date(badge.earned_at).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </TabPanel>
          </>
        ) : (
          <Typography>Failed to load profile</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onBook} disabled={!tutor.is_available}>
          Book Session
        </Button>
      </DialogActions>
    </Dialog>
  );
}
