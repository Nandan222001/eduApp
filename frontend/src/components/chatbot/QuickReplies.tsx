import React from 'react';
import { Box, Chip } from '@mui/material';
import { Assignment, Event, School, Grade, QuestionAnswer } from '@mui/icons-material';
import type { QuickReply } from '../../types/chatbot';

interface QuickRepliesProps {
  onSelect: (value: string) => void;
}

const quickReplies: QuickReply[] = [
  { id: '1', label: 'Homework Help', value: 'I need help with my homework', category: 'homework' },
  { id: '2', label: 'Exam Schedule', value: 'What is my exam schedule?', category: 'exam' },
  { id: '3', label: "Today's Classes", value: "Show me today's schedule", category: 'schedule' },
  { id: '4', label: 'My Grades', value: 'Show my recent grades', category: 'grades' },
  { id: '5', label: 'Study Tips', value: 'Give me study tips', category: 'general' },
];

const categoryIcons: Record<string, React.ReactNode> = {
  homework: <Assignment sx={{ fontSize: 16 }} />,
  exam: <Event sx={{ fontSize: 16 }} />,
  schedule: <School sx={{ fontSize: 16 }} />,
  grades: <Grade sx={{ fontSize: 16 }} />,
  general: <QuestionAnswer sx={{ fontSize: 16 }} />,
};

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {quickReplies.map((reply) => (
        <Chip
          key={reply.id}
          label={reply.label}
          icon={categoryIcons[reply.category || 'general'] as React.ReactElement}
          onClick={() => onSelect(reply.value)}
          size="small"
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            },
          }}
        />
      ))}
    </Box>
  );
};
