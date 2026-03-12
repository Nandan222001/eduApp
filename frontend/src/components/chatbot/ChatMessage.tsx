import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { SmartToy, Person } from '@mui/icons-material';
import type { Message } from '../../types/chatbot';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.role === 'bot';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isBot ? 'row' : 'row-reverse',
        gap: 1,
        mb: 2,
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isBot ? 'primary.main' : 'secondary.main',
          width: 32,
          height: 32,
        }}
      >
        {isBot ? <SmartToy sx={{ fontSize: 18 }} /> : <Person sx={{ fontSize: 18 }} />}
      </Avatar>

      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          maxWidth: '75%',
          bgcolor: isBot ? 'background.paper' : 'primary.main',
          color: isBot ? 'text.primary' : 'primary.contrastText',
          borderRadius: 2,
          borderTopLeftRadius: isBot ? 0 : 2,
          borderTopRightRadius: isBot ? 2 : 0,
        }}
      >
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {message.content}
        </Typography>

        {message.imageUrl && (
          <Box
            component="img"
            src={message.imageUrl}
            alt="Uploaded"
            sx={{
              mt: 1,
              maxWidth: '100%',
              borderRadius: 1,
              display: 'block',
            }}
          />
        )}

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            opacity: 0.7,
            fontSize: '0.7rem',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Paper>
    </Box>
  );
};
