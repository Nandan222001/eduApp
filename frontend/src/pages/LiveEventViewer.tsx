import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  IconButton,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Send as SendIcon,
  Share as ShareIcon,
  Videocam as VideocamIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const LiveEventViewer: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const [selectedCamera, setSelectedCamera] = useState('main');
  const [chatMessage, setChatMessage] = useState('');
  const [chatFilter, setChatFilter] = useState('all');
  const [sidebarTab, setSidebarTab] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: liveEvent, isLoading } = useQuery({
    queryKey: ['liveEvent', eventId],
    queryFn: () => eventsApi.getLiveEvent(Number(eventId)),
    refetchInterval: 30000,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['eventChat', eventId],
    queryFn: () => eventsApi.getChatMessages(Number(eventId)),
    refetchInterval: 2000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => eventsApi.sendChatMessage(Number(eventId), message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventChat', eventId] });
      setChatMessage('');
    },
  });

  const shareEventMutation = useMutation({
    mutationFn: (platform: string) => eventsApi.shareEvent(Number(eventId), platform),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessageMutation.mutate(chatMessage);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    sendMessageMutation.mutate(emoji);
  };

  const handleShareEvent = (platform: string) => {
    shareEventMutation.mutate(platform);
    setShareDialogOpen(false);
  };

  const filteredMessages = chatMessages.filter((msg) => {
    if (chatFilter === 'all') return true;
    if (chatFilter === 'emoji') return msg.message_type === 'emoji';
    if (chatFilter === 'text') return msg.message_type === 'text';
    return true;
  });

  const quickEmojis = ['👍', '❤️', '😂', '🎉', '👏', '🔥', '😮', '💯'];

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!liveEvent) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">Event not found</Alert>
        </Box>
      </Container>
    );
  }

  if (liveEvent.requires_purchase && !liveEvent.is_ticketed) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="warning">
            This event requires a ticket purchase. Please purchase a ticket to access the stream.
          </Alert>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate(`/events/${eventId}/purchase`)}
          >
            Purchase Ticket
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Paper
            ref={containerRef}
            sx={{
              position: 'relative',
              bgcolor: 'black',
              overflow: 'hidden',
              borderRadius: 2,
              '&:hover .controls': {
                opacity: 1,
              },
            }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(isPlaying ? false : true)}
          >
            <video
              ref={videoRef}
              src={
                liveEvent.camera_angles?.find((c) => c.id === selectedCamera)?.stream_url ||
                liveEvent.hls_url ||
                liveEvent.stream_url
              }
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onTimeUpdate={() => {
                // Time tracking handled by video element
              }}
              onClick={togglePlay}
              autoPlay
            />

            {liveEvent.is_live && (
              <Chip
                label="LIVE"
                color="error"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  fontWeight: 'bold',
                }}
              />
            )}

            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Chip
                icon={<PeopleIcon />}
                label={`${liveEvent.viewer_count || 0} watching`}
                sx={{
                  bgcolor: alpha('#000', 0.6),
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                }}
              />
            </Box>

            <Box
              className="controls"
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: `linear-gradient(to top, ${alpha('#000', 0.8)}, transparent)`,
                p: 2,
                transition: 'opacity 0.3s',
                opacity: showControls ? 1 : 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>

                <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>

                <Box sx={{ flex: 1 }} />

                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '.MuiSvgIcon-root': { color: 'white' },
                    }}
                  >
                    <MenuItem value="auto">Auto</MenuItem>
                    <MenuItem value="1080p">1080p</MenuItem>
                    <MenuItem value="720p">720p</MenuItem>
                    <MenuItem value="480p">480p</MenuItem>
                  </Select>
                </FormControl>

                {liveEvent.camera_angles && liveEvent.camera_angles.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      startAdornment={<VideocamIcon sx={{ mr: 1, color: 'white' }} />}
                      sx={{
                        color: 'white',
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                        '.MuiSvgIcon-root': { color: 'white' },
                      }}
                    >
                      {liveEvent.camera_angles.map((angle) => (
                        <MenuItem key={angle.id} value={angle.id}>
                          {angle.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <IconButton onClick={() => setShareDialogOpen(true)} sx={{ color: 'white' }}>
                  <ShareIcon />
                </IconButton>

                <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ mt: 2, p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {liveEvent.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip icon={<EventIcon />} label={format(new Date(liveEvent.start_date), 'PPP')} />
              <Chip
                icon={<AccessTimeIcon />}
                label={`${format(new Date(liveEvent.start_date), 'p')} - ${format(
                  new Date(liveEvent.end_date),
                  'p'
                )}`}
              />
              {liveEvent.location && <Chip label={liveEvent.location} />}
            </Box>

            <Tabs value={sidebarTab} onChange={(_, v) => setSidebarTab(v)} sx={{ mb: 2 }}>
              <Tab label="Description" />
              <Tab label="Documents" />
            </Tabs>

            <TabPanel value={sidebarTab} index={0}>
              <Typography variant="body1" color="text.secondary">
                {liveEvent.description || 'No description available'}
              </Typography>
            </TabPanel>

            <TabPanel value={sidebarTab} index={1}>
              {liveEvent.related_documents && liveEvent.related_documents.length > 0 ? (
                <List>
                  {liveEvent.related_documents.map((doc) => (
                    <ListItem key={doc.id} button component="a" href={doc.file_url} target="_blank">
                      <ListItemAvatar>
                        <Avatar>
                          <DescriptionIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={doc.title} secondary={doc.description} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No documents available
                </Typography>
              )}
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ height: '800px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Live Chat</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant={chatFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setChatFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="small"
                  variant={chatFilter === 'text' ? 'contained' : 'outlined'}
                  onClick={() => setChatFilter('text')}
                >
                  Text
                </Button>
                <Button
                  size="small"
                  variant={chatFilter === 'emoji' ? 'contained' : 'outlined'}
                  onClick={() => setChatFilter('emoji')}
                >
                  Reactions
                </Button>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <List>
                {filteredMessages.map((msg) => (
                  <ListItem key={msg.id} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar src={msg.user_avatar}>{msg.user_name[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" component="span">
                          {msg.user_name}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ fontSize: msg.message_type === 'emoji' ? '1.5rem' : 'inherit' }}
                        >
                          {msg.message}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                <div ref={chatEndRef} />
              </List>
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {quickEmojis.map((emoji) => (
                  <IconButton
                    key={emoji}
                    size="small"
                    onClick={() => handleEmojiClick(emoji)}
                    sx={{ fontSize: '1.2rem' }}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Button variant="outlined" onClick={() => handleShareEvent('facebook')}>
              Share on Facebook
            </Button>
            <Button variant="outlined" onClick={() => handleShareEvent('twitter')}>
              Share on Twitter
            </Button>
            <Button variant="outlined" onClick={() => handleShareEvent('whatsapp')}>
              Share on WhatsApp
            </Button>
            <Button variant="outlined" onClick={() => handleShareEvent('email')}>
              Share via Email
            </Button>
            <TextField
              fullWidth
              value={window.location.href}
              label="Event Link"
              InputProps={{
                readOnly: true,
              }}
              onClick={(e) => {
                (e.target as HTMLInputElement).select();
                navigator.clipboard.writeText(window.location.href);
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LiveEventViewer;
