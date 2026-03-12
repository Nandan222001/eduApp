import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import { Delete, History } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type { ConversationHistory } from '../../types/chatbot';

interface ConversationHistoryListProps {
  conversations: ConversationHistory[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ConversationHistoryList: React.FC<ConversationHistoryListProps> = ({
  conversations,
  onSelect,
  onDelete,
}) => {
  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <History sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No conversation history
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {conversations.map((conversation, index) => (
        <React.Fragment key={conversation.id}>
          {index > 0 && <Divider />}
          <ListItem
            disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton onClick={() => onSelect(conversation.id)}>
              <ListItemText
                primary={conversation.title}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conversation.lastMessage}
                    </Typography>
                    <Typography component="span" variant="caption" color="text.disabled">
                      {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
};
