import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Tooltip,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { ChatMessage } from '@/types/reverseClassroom';
import { format } from 'date-fns';

interface TeachingInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, isVoice?: boolean) => void;
  loading: boolean;
  aiPersona: {
    name: string;
    avatar?: string;
    confusion_level: 'low' | 'medium' | 'high';
  };
}

export default function TeachingInterface({
  messages,
  onSendMessage,
  loading,
  aiPersona,
}: TeachingInterfaceProps) {
  const theme = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim(), false);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (audioBlob) {
      onSendMessage('', true);
      setAudioBlob(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const getConfusionColor = () => {
    switch (aiPersona.confusion_level) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      default:
        return theme.palette.success.main;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={aiPersona.avatar}
            sx={{
              width: 56,
              height: 56,
              border: `3px solid ${getConfusionColor()}`,
            }}
          >
            <AIIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {aiPersona.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                label={`Confusion: ${aiPersona.confusion_level}`}
                size="small"
                sx={{
                  bgcolor: alpha(getConfusionColor(), 0.1),
                  color: getConfusionColor(),
                  fontWeight: 600,
                }}
              />
              <Chip label="Confused Student" size="small" variant="outlined" />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          p: 3,
          mb: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflowY: 'auto',
          bgcolor: alpha(theme.palette.background.default, 0.5),
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.6,
            }}
          >
            <AIIcon sx={{ fontSize: 64, mb: 2, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Ready to Learn!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              The AI student is waiting for you to teach them.
              <br />
              Start by explaining the topic in your own words.
            </Typography>
          </Box>
        ) : (
          <Box>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: message.role === 'student' ? 'row-reverse' : 'row',
                  gap: 2,
                  mb: 3,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor:
                      message.role === 'student'
                        ? theme.palette.primary.main
                        : theme.palette.grey[400],
                  }}
                >
                  {message.role === 'student' ? <PersonIcon /> : <AIIcon />}
                </Avatar>
                <Box
                  sx={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'student' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor:
                        message.role === 'student'
                          ? theme.palette.primary.main
                          : theme.palette.background.paper,
                      color:
                        message.role === 'student'
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.primary,
                      borderRadius: 2,
                      border: message.role === 'ai' ? `1px solid ${theme.palette.divider}` : 'none',
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    {message.confusion_markers && message.confusion_markers.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {message.confusion_markers.map((marker, idx) => (
                          <Chip
                            key={idx}
                            label={marker}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.warning.main, 0.2),
                              color: theme.palette.warning.dark,
                              fontSize: '0.7rem',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
                    {format(message.timestamp, 'HH:mm')}
                  </Typography>
                </Box>
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: theme.palette.grey[400] }}>
                  <AIIcon />
                </Avatar>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CircularProgress size={8} />
                  <CircularProgress size={8} sx={{ animationDelay: '0.2s' }} />
                  <CircularProgress size={8} sx={{ animationDelay: '0.4s' }} />
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your explanation here..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <Tooltip title={isRecording ? 'Stop Recording' : 'Voice Input'}>
            <IconButton
              color={isRecording ? 'error' : 'default'}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              sx={{
                bgcolor: isRecording ? alpha(theme.palette.error.main, 0.1) : 'transparent',
              }}
            >
              {isRecording ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Send Message">
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={loading || !inputMessage.trim()}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );
}
