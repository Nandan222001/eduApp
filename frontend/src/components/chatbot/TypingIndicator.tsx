import React from 'react';
import { Box, Paper } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
`;

export const TypingIndicator: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          borderRadius: 2,
          borderTopLeftRadius: 0,
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: `${bounce} 1.4s infinite ease-in-out`,
              animationDelay: `${index * 0.16}s`,
            }}
          />
        ))}
      </Paper>
    </Box>
  );
};
