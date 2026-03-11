import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  useTheme,
  Grid,
  LinearProgress,
  alpha,
  Chip,
} from '@mui/material';
import { CheckCircle as MasteredIcon, TrendingUp as ProgressIcon } from '@mui/icons-material';
import { ChapterMastery } from '@/types/analytics';

interface ChapterMasteryGaugesProps {
  data: ChapterMastery[];
}

export default function ChapterMasteryGauges({ data }: ChapterMasteryGaugesProps) {
  const theme = useTheme();

  const getMasteryLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Mastered', color: theme.palette.success.main };
    if (percentage >= 60) return { level: 'Proficient', color: theme.palette.info.main };
    if (percentage >= 40) return { level: 'Developing', color: theme.palette.warning.main };
    return { level: 'Needs Practice', color: theme.palette.error.main };
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader title="Chapter-wise Mastery" subheader="Your understanding of each chapter" />
      <CardContent>
        <Grid container spacing={3}>
          {data.map((chapter) => {
            const mastery = getMasteryLevel(chapter.masteryPercentage);
            return (
              <Grid item xs={12} sm={6} md={4} key={`${chapter.subject}-${chapter.chapter}`}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      borderColor: mastery.color,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {chapter.chapter}
                    </Typography>
                    {chapter.masteryPercentage >= 80 && (
                      <MasteredIcon sx={{ fontSize: 18, color: mastery.color }} />
                    )}
                    {chapter.masteryPercentage < 80 && (
                      <ProgressIcon sx={{ fontSize: 18, color: mastery.color }} />
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    {chapter.subject}
                  </Typography>

                  <Box sx={{ my: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h4" fontWeight={700} color={mastery.color}>
                        {chapter.masteryPercentage.toFixed(0)}%
                      </Typography>
                      <Chip
                        label={mastery.level}
                        size="small"
                        sx={{
                          backgroundColor: alpha(mastery.color, 0.1),
                          color: mastery.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={chapter.masteryPercentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(mastery.color, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: mastery.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {chapter.questionsCorrect} / {chapter.questionsAttempted} correct
                    </Typography>
                    {chapter.lastPracticed && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(chapter.lastPracticed).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
