import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  TextField,
  Chip,
  useTheme,
  alpha,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Draw as DrawIcon,
  Chat as ChatIcon,
  CallEnd as CallEndIcon,
  Send as SendIcon,
  OpenInNew as OpenInNewIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { peerTutoringApi, TutoringSession } from '@/api/peerTutoring';

interface TutoringSessionInterfaceProps {
  session: TutoringSession;
  onComplete: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

export default function TutoringSessionInterface({
  session,
  onComplete,
}: TutoringSessionInterfaceProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: '',
    was_helpful: true,
    tutor_knowledge: 5,
    communication_skills: 5,
    punctuality: 5,
    would_recommend: true,
  });

  useEffect(() => {
    if (session.status === 'scheduled') {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const startSession = async () => {
    try {
      await peerTutoringApi.startSession(session.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleVideoToggle = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleAudioToggle = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const handleWhiteboardToggle = () => {
    setShowWhiteboard(!showWhiteboard);
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'You',
        message: messageInput,
        timestamp: new Date(),
      };
      setChatMessages([...chatMessages, newMessage]);
      setMessageInput('');
    }
  };

  const handleEndSession = async () => {
    try {
      await peerTutoringApi.endSession(session.id, sessionNotes);
      setShowFeedbackDialog(true);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await peerTutoringApi.submitFeedback(session.id, feedbackForm);
      setShowFeedbackDialog(false);
      onComplete();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = theme.palette.primary.main;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleSaveWhiteboard = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      try {
        await peerTutoringApi.saveWhiteboardData(session.id, dataUrl);
      } catch (error) {
        console.error('Failed to save whiteboard:', error);
      }
    }
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {session.subject} - {session.topic}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              with {session.tutor_name} • {session.duration_minutes} minutes
            </Typography>
          </Box>
          <Chip
            label={session.status}
            color={session.status === 'in_progress' ? 'success' : 'default'}
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={showChat ? 9 : 12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              minHeight: 500,
              bgcolor: alpha(theme.palette.common.black, 0.02),
            }}
          >
            {session.meeting_link && (
              <Box sx={{ mb: 2 }}>
                <Alert
                  severity="info"
                  action={
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      href={session.meeting_link}
                      target="_blank"
                    >
                      Join
                    </Button>
                  }
                >
                  {session.meeting_platform === 'zoom' ? 'Zoom' : 'Google Meet'} meeting link
                  available
                </Alert>
              </Box>
            )}

            <Box
              sx={{
                height: 400,
                bgcolor: '#000',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                mb: 2,
              }}
            >
              {showWhiteboard ? (
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  style={{
                    cursor: 'crosshair',
                    backgroundColor: 'white',
                    borderRadius: 8,
                    maxWidth: '100%',
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: 'white' }}>
                  <VideocamIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6">Video Chat Area</Typography>
                  <Typography variant="body2" color="grey.400">
                    {isVideoEnabled ? 'Camera On' : 'Camera Off'} •{' '}
                    {isAudioEnabled ? 'Mic On' : 'Mic Off'}
                  </Typography>
                  {isScreenSharing && (
                    <Typography variant="body2" color="success.light" sx={{ mt: 1 }}>
                      Screen Sharing Active
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center">
              <Tooltip title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
                <IconButton
                  onClick={handleVideoToggle}
                  sx={{
                    bgcolor: isVideoEnabled ? 'primary.main' : 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: isVideoEnabled ? 'primary.dark' : 'error.dark',
                    },
                  }}
                >
                  {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
                <IconButton
                  onClick={handleAudioToggle}
                  sx={{
                    bgcolor: isAudioEnabled ? 'primary.main' : 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: isAudioEnabled ? 'primary.dark' : 'error.dark',
                    },
                  }}
                >
                  {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
                <IconButton
                  onClick={handleScreenShare}
                  sx={{
                    bgcolor: isScreenSharing ? 'success.main' : 'grey.300',
                    color: isScreenSharing ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: isScreenSharing ? 'success.dark' : 'grey.400',
                    },
                  }}
                >
                  {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={showWhiteboard ? 'Hide whiteboard' : 'Show whiteboard'}>
                <IconButton
                  onClick={handleWhiteboardToggle}
                  sx={{
                    bgcolor: showWhiteboard ? 'success.main' : 'grey.300',
                    color: showWhiteboard ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: showWhiteboard ? 'success.dark' : 'grey.400',
                    },
                  }}
                >
                  <DrawIcon />
                </IconButton>
              </Tooltip>

              {showWhiteboard && (
                <>
                  <Tooltip title="Clear whiteboard">
                    <IconButton onClick={handleClearWhiteboard} color="warning">
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Save whiteboard">
                    <IconButton onClick={handleSaveWhiteboard} color="primary">
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              <Tooltip title="Toggle chat">
                <IconButton
                  onClick={() => setShowChat(!showChat)}
                  sx={{ bgcolor: showChat ? 'primary.main' : 'grey.300', color: 'white' }}
                >
                  <ChatIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="End session">
                <IconButton
                  onClick={handleEndSession}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                >
                  <CallEndIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Session Notes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add notes about this session..."
              />
            </Box>
          </Paper>
        </Grid>

        {showChat && (
          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                height: 600,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Chat
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                {chatMessages.map((msg) => (
                  <Box key={msg.id} sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {msg.sender} • {msg.timestamp.toLocaleTimeString()}
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1,
                        mt: 0.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">{msg.message}</Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <IconButton size="small" onClick={handleSendMessage}>
                        <SendIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={showFeedbackDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Rate Your Session
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Overall Rating
            </Typography>
            <Rating
              value={feedbackForm.rating}
              onChange={(_e, value) => setFeedbackForm({ ...feedbackForm, rating: value || 5 })}
              size="large"
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" gutterBottom>
                Tutor Knowledge
              </Typography>
              <Rating
                value={feedbackForm.tutor_knowledge}
                onChange={(_e, value) =>
                  setFeedbackForm({ ...feedbackForm, tutor_knowledge: value || 5 })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" gutterBottom>
                Communication
              </Typography>
              <Rating
                value={feedbackForm.communication_skills}
                onChange={(_e, value) =>
                  setFeedbackForm({ ...feedbackForm, communication_skills: value || 5 })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" gutterBottom>
                Punctuality
              </Typography>
              <Rating
                value={feedbackForm.punctuality}
                onChange={(_e, value) =>
                  setFeedbackForm({ ...feedbackForm, punctuality: value || 5 })
                }
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Feedback"
              value={feedbackForm.comment}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
              placeholder="Share your experience with this tutoring session..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeedbackDialog(false)}>Skip</Button>
          <Button variant="contained" onClick={handleSubmitFeedback}>
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
