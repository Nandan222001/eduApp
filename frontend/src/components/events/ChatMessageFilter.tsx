import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Chip, Badge } from '@mui/material';
import {
  Message as MessageIcon,
  EmojiEmotions as EmojiIcon,
  AllInclusive as AllIcon,
} from '@mui/icons-material';

interface ChatMessageFilterProps {
  activeFilter: 'all' | 'text' | 'emoji';
  onChange: (filter: 'all' | 'text' | 'emoji') => void;
  counts?: {
    all: number;
    text: number;
    emoji: number;
  };
  compact?: boolean;
}

export const ChatMessageFilter: React.FC<ChatMessageFilterProps> = ({
  activeFilter,
  onChange,
  counts,
  compact = false,
}) => {
  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Chip
          icon={<AllIcon />}
          label="All"
          onClick={() => onChange('all')}
          color={activeFilter === 'all' ? 'primary' : 'default'}
          variant={activeFilter === 'all' ? 'filled' : 'outlined'}
          size="small"
        />
        <Chip
          icon={<MessageIcon />}
          label="Messages"
          onClick={() => onChange('text')}
          color={activeFilter === 'text' ? 'primary' : 'default'}
          variant={activeFilter === 'text' ? 'filled' : 'outlined'}
          size="small"
        />
        <Chip
          icon={<EmojiIcon />}
          label="Reactions"
          onClick={() => onChange('emoji')}
          color={activeFilter === 'emoji' ? 'primary' : 'default'}
          variant={activeFilter === 'emoji' ? 'filled' : 'outlined'}
          size="small"
        />
      </Box>
    );
  }

  return (
    <ToggleButtonGroup
      value={activeFilter}
      exclusive
      onChange={(_, value) => value && onChange(value)}
      aria-label="chat filter"
      size="small"
      fullWidth
    >
      <ToggleButton value="all" aria-label="all messages">
        <Badge badgeContent={counts?.all} color="primary" max={999}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AllIcon fontSize="small" />
            All
          </Box>
        </Badge>
      </ToggleButton>
      <ToggleButton value="text" aria-label="text messages">
        <Badge badgeContent={counts?.text} color="primary" max={999}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MessageIcon fontSize="small" />
            Messages
          </Box>
        </Badge>
      </ToggleButton>
      <ToggleButton value="emoji" aria-label="emoji reactions">
        <Badge badgeContent={counts?.emoji} color="primary" max={999}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiIcon fontSize="small" />
            Reactions
          </Box>
        </Badge>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ChatMessageFilter;
