import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, LocalCafe as BreakIcon } from '@mui/icons-material';
import { breakSuggestions } from '@/types/pomodoro';

interface BreakSuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  breakType: 'short' | 'long';
}

export default function BreakSuggestionsModal({
  open,
  onClose,
  breakType,
}: BreakSuggestionsModalProps) {
  const theme = useTheme();

  const filteredSuggestions =
    breakType === 'short'
      ? breakSuggestions.filter((s) => s.duration_minutes <= 5)
      : breakSuggestions;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BreakIcon sx={{ color: theme.palette.success.main }} />
          <Typography variant="h6" fontWeight={600}>
            {breakType === 'short' ? 'Short Break' : 'Long Break'} Suggestions
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
          }}
        >
          <Typography variant="body1" fontWeight={600} gutterBottom>
            🎉 Great work! You&apos;ve completed a focus session!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Take a break to recharge. Here are some suggested activities:
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {filteredSuggestions.map((suggestion, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Typography variant="h3">{suggestion.icon}</Typography>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {suggestion.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ~{suggestion.duration_minutes} min
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {suggestion.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Additional Tips:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>20-20-20 Rule:</strong> Every 20 minutes, look at something 20 feet away for
              20 seconds
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Stay Hydrated:</strong> Drink water regularly to maintain focus and energy
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Move Around:</strong> Stand up and stretch to improve circulation
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              <strong>Avoid Screens:</strong> Give your eyes a break from digital devices
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="contained" startIcon={<CloseIcon />}>
          Got It!
        </Button>
      </DialogActions>
    </Dialog>
  );
}
