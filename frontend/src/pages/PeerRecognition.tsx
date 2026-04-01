import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  alpha,
  Tab,
  Tabs,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Group as TeamIcon,
  Lightbulb as LightbulbIcon,
  Psychology as LeadershipIcon,
  Favorite as KindnessIcon,
  TrendingUp as PerseveranceIcon,
  Star as ImprovementIcon,
  Send as SendIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Flag as FlagIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import recognitionApi from '@/api/recognition';
import { useToast } from '@/hooks/useToast';
import type { RecognitionType, RecognitionTypeInfo } from '@/types/recognition';

const recognitionTypes: RecognitionTypeInfo[] = [
  {
    type: 'academic_excellence',
    label: 'Academic Excellence',
    description: 'For outstanding academic achievement',
    icon: 'trophy',
    color: '#FFD700',
  },
  {
    type: 'helpful_peer',
    label: 'Helpful Peer',
    description: 'For always being ready to help others',
    icon: 'school',
    color: '#4CAF50',
  },
  {
    type: 'team_player',
    label: 'Team Player',
    description: 'For great collaboration and teamwork',
    icon: 'team',
    color: '#2196F3',
  },
  {
    type: 'creative_thinker',
    label: 'Creative Thinker',
    description: 'For innovative and creative ideas',
    icon: 'lightbulb',
    color: '#FF9800',
  },
  {
    type: 'leadership',
    label: 'Leadership',
    description: 'For showing leadership qualities',
    icon: 'leadership',
    color: '#9C27B0',
  },
  {
    type: 'kindness',
    label: 'Kindness',
    description: 'For compassion and kindness',
    icon: 'kindness',
    color: '#E91E63',
  },
  {
    type: 'perseverance',
    label: 'Perseverance',
    description: 'For determination and persistence',
    icon: 'perseverance',
    color: '#FF5722',
  },
  {
    type: 'improvement',
    label: 'Most Improved',
    description: 'For significant progress and growth',
    icon: 'improvement',
    color: '#00BCD4',
  },
];

const getRecognitionIcon = (type: string) => {
  switch (type) {
    case 'trophy':
      return <TrophyIcon />;
    case 'school':
      return <SchoolIcon />;
    case 'team':
      return <TeamIcon />;
    case 'lightbulb':
      return <LightbulbIcon />;
    case 'leadership':
      return <LeadershipIcon />;
    case 'kindness':
      return <KindnessIcon />;
    case 'perseverance':
      return <PerseveranceIcon />;
    case 'improvement':
      return <ImprovementIcon />;
    default:
      return <TrophyIcon />;
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface QuickRecognitionSenderProps {
  onRecognitionSent: () => void;
}

function QuickRecognitionSender({ onRecognitionSent }: QuickRecognitionSenderProps) {
  const theme = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<{
    id: number;
    name: string;
    avatar?: string;
    grade?: string;
    section?: string;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<RecognitionType | null>(null);
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: students = [], isLoading: searchLoading } = useQuery({
    queryKey: ['studentSearch', searchQuery],
    queryFn: () => recognitionApi.searchStudents(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const createRecognitionMutation = useMutation({
    mutationFn: recognitionApi.createRecognition,
    onSuccess: () => {
      showToast('Recognition sent successfully!', 'success');
      setSelectedStudent(null);
      setSelectedType(null);
      setMessage('');
      setSearchQuery('');
      queryClient.invalidateQueries({ queryKey: ['myRecognitions'] });
      queryClient.invalidateQueries({ queryKey: ['publicRecognitions'] });
      onRecognitionSent();
    },
    onError: () => {
      showToast('Failed to send recognition', 'error');
    },
  });

  const handleSend = () => {
    if (!selectedStudent || !selectedType || !message.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    createRecognitionMutation.mutate({
      recipient_id: selectedStudent.id,
      recognition_type: selectedType,
      message: message.trim(),
      is_public: isPublic,
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Send Recognition
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Autocomplete
            value={selectedStudent}
            onChange={(_, newValue) => setSelectedStudent(newValue)}
            inputValue={searchQuery}
            onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
            options={students}
            getOptionLabel={(option) =>
              `${option.name}${option.grade && option.section ? ` (${option.grade} - ${option.section})` : ''}`
            }
            loading={searchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Student"
                placeholder="Type to search..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={option.avatar} sx={{ width: 32, height: 32 }}>
                    {option.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    {option.grade && option.section && (
                      <Typography variant="caption" color="text.secondary">
                        {option.grade} - {option.section}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </li>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Recognition Type
          </Typography>
          <Grid container spacing={1.5}>
            {recognitionTypes.map((type) => (
              <Grid item xs={6} sm={4} md={3} key={type.type}>
                <Tooltip title={type.description} arrow>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border:
                        selectedType === type.type
                          ? `2px solid ${type.color}`
                          : `1px solid ${theme.palette.divider}`,
                      bgcolor:
                        selectedType === type.type ? alpha(type.color, 0.1) : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                    onClick={() => setSelectedType(type.type)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(type.color, 0.2),
                          color: type.color,
                          mx: 'auto',
                          mb: 1,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getRecognitionIcon(type.icon)}
                      </Avatar>
                      <Typography variant="caption" display="block" fontWeight={600}>
                        {type.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Message"
            placeholder="Write why you're recognizing this person..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${message.length}/500 characters`}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={isPublic}
              exclusive
              onChange={(_, newValue) => newValue !== null && setIsPublic(newValue)}
              size="small"
            >
              <ToggleButton value={true}>
                <PublicIcon sx={{ mr: 1, fontSize: 18 }} />
                Public
              </ToggleButton>
              <ToggleButton value={false}>
                <PrivateIcon sx={{ mr: 1, fontSize: 18 }} />
                Private
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSend}
              disabled={createRecognitionMutation.isPending}
            >
              {createRecognitionMutation.isPending ? 'Sending...' : 'Send Recognition'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

interface RecognitionCardProps {
  recognition: {
    id: number;
    sender_name: string;
    sender_avatar?: string;
    recipient_name: string;
    recipient_avatar?: string;
    recognition_type: string;
    message: string;
    created_at: string;
    likes_count: number;
    is_liked_by_user: boolean;
  };
  onLike: (id: number) => void;
  onUnlike: (id: number) => void;
  onFlag?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

function RecognitionCard({
  recognition,
  onLike,
  onUnlike,
  onFlag,
  onDelete,
  showActions = true,
}: RecognitionCardProps) {
  const typeInfo = recognitionTypes.find((t) => t.type === recognition.recognition_type);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={recognition.sender_avatar} sx={{ width: 40, height: 40 }}>
              {recognition.sender_name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {recognition.sender_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(recognition.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          {typeInfo && (
            <Chip
              icon={getRecognitionIcon(typeInfo.icon)}
              label={typeInfo.label}
              size="small"
              sx={{
                bgcolor: alpha(typeInfo.color, 0.1),
                color: typeInfo.color,
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={recognition.recipient_avatar} sx={{ width: 32, height: 32 }}>
            {recognition.recipient_name.charAt(0)}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            recognized <strong>{recognition.recipient_name}</strong>
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {recognition.message}
        </Typography>

        {showActions && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={recognition.is_liked_by_user ? 'Unlike' : 'Like'}>
                <IconButton
                  size="small"
                  onClick={() =>
                    recognition.is_liked_by_user ? onUnlike(recognition.id) : onLike(recognition.id)
                  }
                  color={recognition.is_liked_by_user ? 'primary' : 'default'}
                >
                  {recognition.is_liked_by_user ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                {recognition.likes_count}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {onFlag && (
                <Tooltip title="Report inappropriate content">
                  <IconButton size="small" onClick={() => onFlag(recognition.id)}>
                    <FlagIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => onDelete(recognition.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function PeerRecognition() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  const { data: receivedRecognitions, isLoading: receivedLoading } = useQuery({
    queryKey: ['myRecognitions', 'received'],
    queryFn: () => recognitionApi.getMyReceivedRecognitions(),
  });

  const { data: sentRecognitions, isLoading: sentLoading } = useQuery({
    queryKey: ['myRecognitions', 'sent'],
    queryFn: () => recognitionApi.getMySentRecognitions(),
  });

  const { data: stats } = useQuery({
    queryKey: ['myRecognitionStats'],
    queryFn: recognitionApi.getMyStats,
  });

  const likeMutation = useMutation({
    mutationFn: recognitionApi.likeRecognition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRecognitions'] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: recognitionApi.unlikeRecognition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRecognitions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: recognitionApi.deleteRecognition,
    onSuccess: () => {
      showToast('Recognition deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['myRecognitions'] });
    },
  });

  const handleRecognitionSent = () => {
    queryClient.invalidateQueries({ queryKey: ['myRecognitionStats'] });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Peer Recognition
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Celebrate your classmates&apos; achievements and positive contributions
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <QuickRecognitionSender onRecognitionSent={handleRecognitionSent} />
        </Grid>

        {stats && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Recognition Statistics
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {stats.total_received}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Received
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="secondary.main">
                        {stats.total_sent}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sent
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {stats.weekly_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This Week
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.monthly_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This Month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {stats.by_category && Object.keys(stats.by_category).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    By Category
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {Object.entries(stats.by_category).map(([type, count]) => {
                      const typeInfo = recognitionTypes.find((t) => t.type === type);
                      return typeInfo && count > 0 ? (
                        <Chip
                          key={type}
                          label={`${typeInfo.label}: ${count}`}
                          size="small"
                          sx={{
                            bgcolor: alpha(typeInfo.color, 0.1),
                            color: typeInfo.color,
                          }}
                        />
                      ) : null;
                    })}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Received" />
              <Tab label="Sent" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              {receivedLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : receivedRecognitions?.items.length === 0 ? (
                <Alert severity="info">No recognitions received yet</Alert>
              ) : (
                <Grid container spacing={2}>
                  {receivedRecognitions?.items.map((recognition) => (
                    <Grid item xs={12} key={recognition.id}>
                      <RecognitionCard
                        recognition={recognition}
                        onLike={likeMutation.mutate}
                        onUnlike={unlikeMutation.mutate}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {sentLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : sentRecognitions?.items.length === 0 ? (
                <Alert severity="info">No recognitions sent yet</Alert>
              ) : (
                <Grid container spacing={2}>
                  {sentRecognitions?.items.map((recognition) => (
                    <Grid item xs={12} key={recognition.id}>
                      <RecognitionCard
                        recognition={recognition}
                        onLike={likeMutation.mutate}
                        onUnlike={unlikeMutation.mutate}
                        onDelete={deleteMutation.mutate}
                        showActions={true}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
