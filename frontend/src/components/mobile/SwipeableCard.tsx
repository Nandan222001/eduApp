import { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, IconButton, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface SwipeableCardProps {
  children: React.ReactNode[];
  onSwipe?: (index: number) => void;
  initialIndex?: number;
}

export default function SwipeableCard({ children, onSwipe, initialIndex = 0 }: SwipeableCardProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    onSwipe?.(currentIndex);
  }, [currentIndex, onSwipe]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < children.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < children.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Box
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        sx={{
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          {children.map((child, index) => (
            <Box
              key={index}
              sx={{
                minWidth: '100%',
                width: '100%',
                flexShrink: 0,
              }}
            >
              <Card
                elevation={2}
                sx={{
                  mx: 1,
                  borderRadius: 3,
                }}
              >
                <CardContent>{child}</CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      {currentIndex > 0 && (
        <IconButton
          onClick={handlePrevious}
          sx={{
            position: 'absolute',
            left: -12,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'background.paper',
            boxShadow: theme.shadows[2],
            '&:hover': {
              bgcolor: 'background.paper',
            },
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}

      {currentIndex < children.length - 1 && (
        <IconButton
          onClick={handleNext}
          sx={{
            position: 'absolute',
            right: -12,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'background.paper',
            boxShadow: theme.shadows[2],
            '&:hover': {
              bgcolor: 'background.paper',
            },
          }}
        >
          <ChevronRight />
        </IconButton>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          mt: 2,
        }}
      >
        {children.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentIndex(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: index === currentIndex ? 'primary.main' : 'grey.300',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
