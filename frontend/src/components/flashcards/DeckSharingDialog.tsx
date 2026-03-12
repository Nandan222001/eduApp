import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import { Delete as DeleteIcon, Share as ShareIcon } from '@mui/icons-material';
import { FlashcardDeckShare } from '@/types/flashcard';

interface DeckSharingDialogProps {
  open: boolean;
  onClose: () => void;
  onShare: (shareData: Omit<FlashcardDeckShare, 'id' | 'deck_id' | 'shared_at'>) => void;
  onUnshare: (shareId: number) => void;
  currentShares: FlashcardDeckShare[];
}

export const DeckSharingDialog: React.FC<DeckSharingDialogProps> = ({
  open,
  onClose,
  onShare,
  onUnshare,
  currentShares,
}) => {
  const [shareType, setShareType] = useState<'user' | 'grade' | 'section'>('grade');
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [canEdit, setCanEdit] = useState(false);

  const handleShare = () => {
    const shareData: Partial<Omit<FlashcardDeckShare, 'id' | 'deck_id' | 'shared_at'>> = {
      can_edit: canEdit,
    };

    if (shareType === 'user') {
      shareData.shared_with_user_id = selectedId;
    } else if (shareType === 'grade') {
      shareData.shared_with_grade_id = selectedId;
    } else if (shareType === 'section') {
      shareData.shared_with_section_id = selectedId;
    }

    onShare(shareData);
    setSelectedId('');
    setCanEdit(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShareIcon sx={{ mr: 1 }} />
          Share Deck
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Share With</InputLabel>
            <Select
              value={shareType}
              onChange={(e) => setShareType(e.target.value as 'user' | 'grade' | 'section')}
            >
              <MenuItem value="user">Specific User</MenuItem>
              <MenuItem value="grade">Entire Grade</MenuItem>
              <MenuItem value="section">Specific Section</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={`Select ${shareType === 'user' ? 'User' : shareType === 'grade' ? 'Grade' : 'Section'} ID`}
            type="number"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value ? parseInt(e.target.value) : '')}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={<Checkbox checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} />}
            label="Allow editing"
          />

          <Button variant="contained" fullWidth onClick={handleShare} disabled={!selectedId}>
            Share
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <InputLabel sx={{ mb: 1 }}>Currently Shared With</InputLabel>
          {currentShares.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
              Not shared with anyone yet
            </Box>
          ) : (
            <List>
              {currentShares.map((share) => (
                <ListItem
                  key={share.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => onUnshare(share.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      share.shared_with_user_id
                        ? `User ID: ${share.shared_with_user_id}`
                        : share.shared_with_grade_id
                          ? `Grade ID: ${share.shared_with_grade_id}`
                          : `Section ID: ${share.shared_with_section_id}`
                    }
                    secondary={share.can_edit ? 'Can edit' : 'View only'}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
