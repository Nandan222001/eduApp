import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  Lightbulb,
  CheckCircle,
  Cancel,
  Replay,
} from '@mui/icons-material';
import { Flashcard } from '@/types/flashcard';

interface FlashcardStudyModeProps {
  cards: Flashcard[];
  onCardStudied: (cardId: number, isCorrect: boolean) => void;
  onComplete: () => void;
}

export const FlashcardStudyMode: React.FC<FlashcardStudyModeProps> = ({
  cards,
  onCardStudied,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answeredCards, setAnsweredCards] = useState<Set<number>>(new Set());

  const currentCard = cards[currentIndex];
  const progress = (answeredCards.size / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (isCorrect: boolean) => {
    onCardStudied(currentCard.id, isCorrect);
    setAnsweredCards((prev) => new Set(prev).add(currentCard.id));

    if (currentIndex < cards.length - 1) {
      handleNext();
    } else {
      onComplete();
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setAnsweredCards(new Set());
  };

  if (!currentCard) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6">No cards to study</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Card {currentIndex + 1} of {cards.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Progress: {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      <Card
        sx={{
          minHeight: 400,
          mb: 3,
          cursor: 'pointer',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          position: 'relative',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleFlip}
      >
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <Chip
            label={isFlipped ? 'Answer' : 'Question'}
            color={isFlipped ? 'success' : 'primary'}
            sx={{ mb: 2 }}
          />

          <Typography variant="h4" align="center" sx={{ mb: 2 }}>
            {isFlipped ? currentCard.back_content : currentCard.front_content}
          </Typography>

          {!isFlipped && currentCard.hint && showHint && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                💡 Hint: {currentCard.hint}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 2 }}>
            Click card to flip
          </Typography>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
        {!isFlipped && currentCard.hint && (
          <Button
            startIcon={<Lightbulb />}
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(!showHint);
            }}
            variant="outlined"
          >
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Button>
        )}
      </Stack>

      {isFlipped && (
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={(e) => {
              e.stopPropagation();
              handleAnswer(false);
            }}
          >
            Need More Practice
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={(e) => {
              e.stopPropagation();
              handleAnswer(true);
            }}
          >
            Got It Right
          </Button>
        </Stack>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconButton onClick={handlePrevious} disabled={currentIndex === 0}>
          <NavigateBefore />
        </IconButton>

        <Button startIcon={<Replay />} onClick={handleRestart} variant="outlined">
          Restart
        </Button>

        <IconButton onClick={handleNext} disabled={currentIndex === cards.length - 1}>
          <NavigateNext />
        </IconButton>
      </Box>
    </Box>
  );
};
