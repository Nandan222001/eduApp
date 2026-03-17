import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as MissingIcon,
  Help as ConfusedIcon,
} from '@mui/icons-material';
import { ConceptAnalysis } from '@/types/reverseClassroom';

interface AnalysisResultProps {
  analysis: ConceptAnalysis;
}

export default function AnalysisResult({ analysis }: AnalysisResultProps) {
  const theme = useTheme();

  const getUnderstandingLevel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Excellent', color: theme.palette.success.main };
    if (score >= 60) return { label: 'Good', color: theme.palette.info.main };
    if (score >= 40) return { label: 'Fair', color: theme.palette.warning.main };
    return { label: 'Needs Improvement', color: theme.palette.error.main };
  };

  const understanding = getUnderstandingLevel(analysis.understanding_score);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Analysis Results
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Understanding Level
          </Typography>
          <Typography variant="body2" fontWeight={700} color={understanding.color}>
            {understanding.label}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={analysis.understanding_score}
          sx={{
            height: 12,
            borderRadius: 6,
            bgcolor: alpha(understanding.color, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 6,
              bgcolor: understanding.color,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            0%
          </Typography>
          <Typography variant="h6" fontWeight={700} color={understanding.color}>
            {analysis.understanding_score}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            100%
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              bgcolor: alpha(theme.palette.success.main, 0.05),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckIcon sx={{ color: theme.palette.success.main }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Correctly Explained ({analysis.correctly_explained.length})
              </Typography>
            </Box>
            {analysis.correctly_explained.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No concepts correctly explained yet
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {analysis.correctly_explained.map((concept, idx) => (
                  <Chip
                    key={idx}
                    label={concept}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      color: theme.palette.success.dark,
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              bgcolor: alpha(theme.palette.error.main, 0.05),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MissingIcon sx={{ color: theme.palette.error.main }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Missing Concepts ({analysis.missing_concepts.length})
              </Typography>
            </Box>
            {analysis.missing_concepts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No missing concepts
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {analysis.missing_concepts.map((concept, idx) => (
                  <Chip
                    key={idx}
                    label={concept}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                      color: theme.palette.error.dark,
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ConfusedIcon sx={{ color: theme.palette.warning.main }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Confused Concepts ({analysis.confused_concepts.length})
              </Typography>
            </Box>
            {analysis.confused_concepts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No confused concepts
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {analysis.confused_concepts.map((concept, idx) => (
                  <Chip
                    key={idx}
                    label={concept}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.2),
                      color: theme.palette.warning.dark,
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
