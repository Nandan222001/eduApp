import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

interface TypingIndicatorProps {
  userNames?: string[];
  showNames?: boolean;
}

const dotAnimation = keyframes`
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
`;

export const TypingIndicator = ({ userNames = [], showNames = true }: TypingIndicatorProps) => {
  if (userNames.length === 0) {
    return null;
  }

  const displayText =
    userNames.length === 1
      ? `${userNames[0]} is typing`
      : userNames.length === 2
        ? `${userNames[0]} and ${userNames[1]} are typing`
        : `${userNames.length} people are typing`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 2,
      }}
    >
      {showNames && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {displayText}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'text.secondary',
              animation: `${dotAnimation} 1.4s infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
