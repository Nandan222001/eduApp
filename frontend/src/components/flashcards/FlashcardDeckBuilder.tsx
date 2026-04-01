import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  FlashcardDeckCreateInput,
  FlashcardCreateInput,
  FlashcardDeckVisibility,
} from '@/types/flashcard';

interface FlashcardDeckBuilderProps {
  onSave: (deck: FlashcardDeckCreateInput, cards: Omit<FlashcardCreateInput, 'deck_id'>[]) => void;
  onCancel: () => void;
  institutionId: number;
  userId: number;
}

interface CardData {
  front_content: string;
  back_content: string;
  hint?: string;
  tags?: string;
  [key: string]: unknown;
}

export const FlashcardDeckBuilder: React.FC<FlashcardDeckBuilderProps> = ({
  onSave,
  onCancel,
  institutionId,
  userId,
}) => {
  const [deckData, setDeckData] = useState<FlashcardDeckCreateInput>({
    institution_id: institutionId,
    creator_id: userId,
    title: '',
    description: '',
    visibility: FlashcardDeckVisibility.PRIVATE,
  });

  const [cards, setCards] = useState<CardData[]>([{ front_content: '', back_content: '' }]);

  const handleDeckChange = (
    field: keyof FlashcardDeckCreateInput,
    value: string | number | FlashcardDeckVisibility
  ) => {
    setDeckData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (index: number, field: keyof CardData, value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const addCard = () => {
    setCards([...cards, { front_content: '', back_content: '' }]);
  };

  const removeCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    const validCards = cards.filter((card) => card.front_content && card.back_content);
    if (deckData.title && validCards.length > 0) {
      onSave(deckData, validCards);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Flashcard Deck
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Deck Title"
              value={deckData.title}
              onChange={(e) => handleDeckChange('title', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={deckData.description}
              onChange={(e) => handleDeckChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={deckData.visibility}
                onChange={(e) => handleDeckChange('visibility', e.target.value)}
              >
                <MenuItem value={FlashcardDeckVisibility.PRIVATE}>Private</MenuItem>
                <MenuItem value={FlashcardDeckVisibility.INSTITUTION}>Institution</MenuItem>
                <MenuItem value={FlashcardDeckVisibility.PUBLIC}>Public</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={deckData.tags}
              onChange={(e) => handleDeckChange('tags', e.target.value)}
              placeholder="math, algebra, equations"
            />
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Flashcards ({cards.length})
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <IconButton size="small" sx={{ mt: 1 }}>
                <DragIcon />
              </IconButton>

              <Grid container spacing={2} sx={{ flex: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={`Card ${index + 1} - Front`}
                    multiline
                    rows={3}
                    value={card.front_content}
                    onChange={(e) => handleCardChange(index, 'front_content', e.target.value)}
                    placeholder="Question or term"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={`Card ${index + 1} - Back`}
                    multiline
                    rows={3}
                    value={card.back_content}
                    onChange={(e) => handleCardChange(index, 'back_content', e.target.value)}
                    placeholder="Answer or definition"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Hint (optional)"
                    value={card.hint || ''}
                    onChange={(e) => handleCardChange(index, 'hint', e.target.value)}
                    placeholder="Optional hint for this card"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tags (optional)"
                    value={card.tags || ''}
                    onChange={(e) => handleCardChange(index, 'tags', e.target.value)}
                    placeholder="chapter1, important"
                  />
                </Grid>
              </Grid>

              <IconButton color="error" onClick={() => removeCard(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Stack>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={addCard}>
          Add Card
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={
              !deckData.title || cards.filter((c) => c.front_content && c.back_content).length === 0
            }
          >
            Save Deck
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
