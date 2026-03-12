import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  PlayArrow as StudyIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardApi } from '@/api/flashcards';
import { FlashcardDeck } from '@/types/flashcard';
import { useNavigate } from 'react-router-dom';
import { FlashcardDeckBuilder } from '@/components/flashcards';
import { FlashcardDeckCreateInput, FlashcardCreateInput } from '@/types/flashcard';

export const FlashcardDeckList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);

  const institutionId = 1; // Get from auth context
  const userId = 1; // Get from auth context

  const { data: decks = [] } = useQuery({
    queryKey: ['flashcard-decks', search],
    queryFn: () => flashcardApi.listDecks({ search, institution_id: institutionId }),
  });

  const createDeckMutation = useMutation({
    mutationFn: (data: {
      deck: FlashcardDeckCreateInput;
      flashcards: Omit<FlashcardCreateInput, 'deck_id'>[];
    }) => flashcardApi.createDeckWithCards(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      setShowCreateForm(false);
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: (deckId: number) => flashcardApi.deleteDeck(deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, deck: FlashcardDeck) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeck(deck);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeck(null);
  };

  const handleStudy = (deckId: number) => {
    navigate(`/flashcards/deck/${deckId}/study`);
  };

  const handleShare = (deckId: number) => {
    navigate(`/flashcards/deck/${deckId}/share`);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedDeck) {
      deleteDeckMutation.mutate(selectedDeck.id);
    }
    handleMenuClose();
  };

  if (showCreateForm) {
    return (
      <FlashcardDeckBuilder
        onSave={(deck, cards) => createDeckMutation.mutate({ deck, flashcards: cards })}
        onCancel={() => setShowCreateForm(false)}
        institutionId={institutionId}
        userId={userId}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Flashcard Decks</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateForm(true)}>
          Create Deck
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search decks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {decks.map((deck: FlashcardDeck) => (
          <Grid item xs={12} sm={6} md={4} key={deck.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                    {deck.title}
                  </Typography>
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, deck)}>
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {deck.description || 'No description'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={`${deck.total_cards} cards`} size="small" />
                  <Chip label={deck.visibility} size="small" color="primary" variant="outlined" />
                </Box>

                {deck.tags && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {deck.tags.split(',').map((tag, index) => (
                      <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<StudyIcon />}
                  onClick={() => handleStudy(deck.id)}
                  variant="contained"
                  fullWidth
                >
                  Study
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => selectedDeck && handleShare(selectedDeck.id)}>
          <ShareIcon sx={{ mr: 1 }} /> Share
        </MenuItem>
        <MenuItem
          onClick={() => selectedDeck && navigate(`/flashcards/deck/${selectedDeck.id}/edit`)}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FlashcardDeckList;
