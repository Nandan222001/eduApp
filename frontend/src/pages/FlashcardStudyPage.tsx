import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardApi } from '@/api/flashcards';
import { FlashcardStudyMode, ProgressTracker } from '@/components/flashcards';
import { SpacedRepetitionLevel } from '@/types/flashcard';

export const FlashcardStudyPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showResults, setShowResults] = useState(false);
  const userId = 1; // Get from auth context

  const { data: deck, isLoading: deckLoading } = useQuery({
    queryKey: ['flashcard-deck', deckId],
    queryFn: () => flashcardApi.getDeck(Number(deckId)),
    enabled: !!deckId,
  });

  const { data: dueCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['due-cards', deckId, userId],
    queryFn: () => flashcardApi.getDueCards(Number(deckId), userId),
    enabled: !!deckId,
  });

  const { data: stats } = useQuery({
    queryKey: ['deck-stats', deckId, userId],
    queryFn: () => flashcardApi.getDeckStats(Number(deckId), userId),
    enabled: !!deckId,
  });

  const studyMutation = useMutation({
    mutationFn: (data: { cardId: number; isCorrect: boolean }) =>
      flashcardApi.updateStudySession(data.cardId, userId, {
        repetition_level: data.isCorrect
          ? SpacedRepetitionLevel.LEARNING
          : SpacedRepetitionLevel.NEW,
        ease_factor: 2.5,
        interval_days: data.isCorrect ? 1 : 0,
        repetitions: 0,
        is_correct: data.isCorrect,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due-cards', deckId, userId] });
      queryClient.invalidateQueries({ queryKey: ['deck-stats', deckId, userId] });
    },
  });

  const handleCardStudied = (cardId: number, isCorrect: boolean) => {
    studyMutation.mutate({ cardId, isCorrect });
  };

  const handleComplete = () => {
    setShowResults(true);
  };

  if (deckLoading || cardsLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (showResults || dueCards.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/flashcards')} sx={{ mb: 3 }}>
          Back to Decks
        </Button>

        <Typography variant="h4" gutterBottom>
          Study Session Complete!
        </Typography>

        {stats && <ProgressTracker stats={stats} />}

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Great job!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {dueCards.length === 0
                ? "You've completed all cards for today. Come back tomorrow for more!"
                : 'You completed this study session.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="contained" onClick={() => navigate('/flashcards')}>
                Back to Decks
              </Button>
              <Button variant="outlined" onClick={() => setShowResults(false)}>
                Study Again
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/flashcards')} sx={{ mb: 3 }}>
        Back to Decks
      </Button>

      <Typography variant="h4" gutterBottom>
        {deck?.title}
      </Typography>

      {stats && (
        <Box sx={{ mb: 3 }}>
          <ProgressTracker stats={stats} />
        </Box>
      )}

      <FlashcardStudyMode
        cards={dueCards}
        onCardStudied={handleCardStudied}
        onComplete={handleComplete}
      />
    </Box>
  );
};

export default FlashcardStudyPage;
