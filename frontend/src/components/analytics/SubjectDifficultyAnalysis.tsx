import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  useTheme,
  LinearProgress,
  alpha,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingDown as DifficultIcon,
  TrendingFlat as ModerateIcon,
  TrendingUp as EasyIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { SubjectDifficultyAnalysis as SubjectDifficultyType } from '@/types/analytics';

interface SubjectDifficultyAnalysisProps {
  data: SubjectDifficultyType[];
}

export default function SubjectDifficultyAnalysis({ data }: SubjectDifficultyAnalysisProps) {
  const theme = useTheme();

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return theme.palette.success.main;
      case 'moderate':
        return theme.palette.warning.main;
      case 'difficult':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'easy':
        return <EasyIcon />;
      case 'moderate':
        return <ModerateIcon />;
      case 'difficult':
        return <DifficultIcon />;
      default:
        return <ModerateIcon />;
    }
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Subject Difficulty Analysis"
        subheader="Performance analysis and common challenges"
      />
      <CardContent>
        {data.map((subject) => (
          <Accordion
            key={subject.subject}
            elevation={0}
            sx={{
              mb: 1,
              border: `1px solid ${theme.palette.divider}`,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {subject.subject}
                  </Typography>
                  <Chip
                    icon={getDifficultyIcon(subject.difficultyLevel)}
                    label={
                      subject.difficultyLevel.charAt(0).toUpperCase() +
                      subject.difficultyLevel.slice(1)
                    }
                    size="small"
                    sx={{
                      backgroundColor: alpha(getDifficultyColor(subject.difficultyLevel), 0.1),
                      color: getDifficultyColor(subject.difficultyLevel),
                      fontWeight: 600,
                    }}
                  />
                  {subject.studentsStruggling > 0 && (
                    <Chip
                      label={`${subject.studentsStruggling} struggling`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Score: {subject.averageScore.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pass Rate: {subject.passRate.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={subject.averageScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(getDifficultyColor(subject.difficultyLevel), 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getDifficultyColor(subject.difficultyLevel),
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pass Rate
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={subject.passRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.success.main,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              {subject.commonMistakes.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Common Mistakes:
                  </Typography>
                  <List dense>
                    {subject.commonMistakes.map((mistake, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <ErrorIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={mistake}
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
}
