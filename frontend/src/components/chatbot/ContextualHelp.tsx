import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import type { ContextualSuggestion } from '../../types/chatbot';

interface ContextualHelpProps {
  suggestions: ContextualSuggestion[];
  onSuggestionClick: (text: string) => void;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  suggestions,
  onSuggestionClick,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        bgcolor: 'info.lighter',
        borderLeft: 4,
        borderColor: 'info.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Lightbulb color="info" sx={{ fontSize: 20 }} />
        <Typography variant="subtitle2" color="info.dark">
          Suggestions for this page
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestions.map((suggestion) => (
          <Chip
            key={suggestion.id}
            label={suggestion.text}
            size="small"
            onClick={() => onSuggestionClick(suggestion.text)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'info.light',
              },
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};
