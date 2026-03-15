import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  TextField,
  Button,
  Slider,
  alpha,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  MoodBad,
  Close,
} from '@mui/icons-material';
import { MoodType, MoodCheckIn as MoodCheckInType } from '@/types/studyBuddy';

interface MoodCheckInProps {
  onSubmit: (mood: Omit<MoodCheckInType, 'id' | 'timestamp'>) => void;
  onClose?: () => void;
  compact?: boolean;
}

const moodOptions: {
  type: MoodType;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  label: string;
}[] = [
  {
    type: 'stressed',
    emoji: '😰',
    icon: <SentimentVeryDissatisfied />,
    color: '#f44336',
    label: 'Stressed',
  },
  { type: 'tired', emoji: '😴', icon: <SentimentDissatisfied />, color: '#ff9800', label: 'Tired' },
  {
    type: 'confused',
    emoji: '😕',
    icon: <SentimentNeutral />,
    color: '#9e9e9e',
    label: 'Confused',
  },
  { type: 'neutral', emoji: '😐', icon: <SentimentNeutral />, color: '#2196f3', label: 'Neutral' },
  { type: 'happy', emoji: '😊', icon: <SentimentSatisfied />, color: '#4caf50', label: 'Happy' },
  {
    type: 'excited',
    emoji: '🤩',
    icon: <SentimentVerySatisfied />,
    color: '#8bc34a',
    label: 'Excited',
  },
];

export default function MoodCheckIn({ onSubmit, onClose, compact = false }: MoodCheckInProps) {
  const theme = useTheme();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(50);
  const [focusLevel, setFocusLevel] = useState<number>(50);
  const [note, setNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    if (!compact) {
      setShowDetails(true);
    }
  };

  const handleSubmit = () => {
    if (!selectedMood) return;

    onSubmit({
      mood: selectedMood,
      energyLevel,
      focusLevel,
      note: note.trim() || undefined,
    });

    setSelectedMood(null);
    setEnergyLevel(50);
    setFocusLevel(50);
    setNote('');
    setShowDetails(false);
  };

  const selectedMoodOption = moodOptions.find((m) => m.type === selectedMood);

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        border: selectedMood ? `2px solid ${selectedMoodOption?.color}` : undefined,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoodBad color="primary" />
            <Typography variant="h6" fontWeight={700}>
              How are you feeling?
            </Typography>
          </Box>
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            gap: 1,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          {moodOptions.map((mood) => (
            <Box
              key={mood.type}
              onClick={() => handleMoodSelect(mood.type)}
              sx={{
                cursor: 'pointer',
                textAlign: 'center',
                p: 1.5,
                borderRadius: 2,
                border: `2px solid ${selectedMood === mood.type ? mood.color : 'transparent'}`,
                bgcolor: selectedMood === mood.type ? alpha(mood.color, 0.1) : 'transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(mood.color, 0.05),
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {mood.emoji}
              </Typography>
              <Typography variant="caption" fontWeight={500} sx={{ color: mood.color }}>
                {mood.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Collapse in={showDetails && selectedMood !== null}>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Energy Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Low
                </Typography>
                <Slider
                  value={energyLevel}
                  onChange={(_, value) => setEnergyLevel(value as number)}
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: '' },
                    { value: 50, label: '' },
                    { value: 100, label: '' },
                  ]}
                  sx={{
                    '& .MuiSlider-thumb': {
                      width: 20,
                      height: 20,
                    },
                    '& .MuiSlider-track': {
                      background: `linear-gradient(90deg, ${theme.palette.error.main} 0%, ${theme.palette.warning.main} 50%, ${theme.palette.success.main} 100%)`,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  High
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', display: 'block', mt: 1 }}
              >
                {energyLevel}%
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Focus Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Low
                </Typography>
                <Slider
                  value={focusLevel}
                  onChange={(_, value) => setFocusLevel(value as number)}
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: '' },
                    { value: 50, label: '' },
                    { value: 100, label: '' },
                  ]}
                  sx={{
                    '& .MuiSlider-thumb': {
                      width: 20,
                      height: 20,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  High
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', display: 'block', mt: 1 }}
              >
                {focusLevel}%
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Any thoughts or notes? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedMood}
              sx={{
                py: 1.5,
                fontWeight: 600,
                bgcolor: selectedMoodOption?.color,
                '&:hover': {
                  bgcolor: selectedMoodOption ? alpha(selectedMoodOption.color, 0.8) : undefined,
                },
              }}
            >
              Submit Check-in
            </Button>
          </Box>
        </Collapse>

        {compact && selectedMood && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: 600,
              bgcolor: selectedMoodOption?.color,
              '&:hover': {
                bgcolor: selectedMoodOption ? alpha(selectedMoodOption.color, 0.8) : undefined,
              },
            }}
          >
            Submit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
