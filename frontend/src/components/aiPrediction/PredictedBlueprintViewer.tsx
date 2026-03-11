import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Divider,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';
import { PredictedQuestionBlueprint } from '@/api/aiPredictionDashboard';

interface PredictedBlueprintViewerProps {
  blueprint: PredictedQuestionBlueprint;
}

export default function PredictedBlueprintViewer({ blueprint }: PredictedBlueprintViewerProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>('section0');

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Predicted Question Paper Blueprint
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GradeIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Marks
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {blueprint.total_marks}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {blueprint.duration_minutes} min
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Sections
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {blueprint.sections.length}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Sections */}
      <Box sx={{ mb: 3 }}>
        {blueprint.sections.map((section, index) => (
          <Accordion
            key={index}
            expanded={expanded === `section${index}`}
            onChange={handleChange(`section${index}`)}
            elevation={0}
            sx={{ border: `1px solid ${theme.palette.divider}`, mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                  {section.section_name}
                </Typography>
                <Chip
                  label={`${section.total_marks} marks`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Question Types
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {section.question_types.map((type, idx) => (
                      <Chip key={idx} label={type} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Difficulty Distribution
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {Object.entries(section.difficulty_distribution).map(([level, percentage]) => (
                      <Box key={level} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{level}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {percentage}%
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${percentage}%`,
                              height: '100%',
                              bgcolor: theme.palette.primary.main,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Bloom&apos;s Taxonomy Level Distribution
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {Object.entries(section.bloom_level_distribution).map(([level, percentage]) => (
                      <Box key={level} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{level}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {percentage}%
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${percentage}%`,
                              height: '100%',
                              bgcolor: theme.palette.secondary.main,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Topics Covered (Top {Math.min(5, section.topics_included.length)})
                  </Typography>
                  <List dense>
                    {section.topics_included.slice(0, 5).map((topic, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemText
                          primary={topic}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Overall Topic Coverage */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Overall Topic Coverage
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {Object.entries(blueprint.topic_coverage)
            .slice(0, 10)
            .map(([topic, probability]) => (
              <Grid item xs={12} sm={6} key={topic}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{topic}</Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {probability.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${probability}%`,
                        height: '100%',
                        bgcolor: theme.palette.primary.main,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
        </Grid>
      </Paper>
    </Box>
  );
}
