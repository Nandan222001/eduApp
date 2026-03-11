import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Slider,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import aiPredictionDashboardApi, {
  WhatIfScenarioResponse,
  TopicProbabilityRanking,
} from '@/api/aiPredictionDashboard';

interface WhatIfScenarioSimulatorProps {
  board: string;
  gradeId: number;
  subjectId: number;
  topics: TopicProbabilityRanking[];
}

export default function WhatIfScenarioSimulator({
  board,
  gradeId,
  subjectId,
  topics,
}: WhatIfScenarioSimulatorProps) {
  const theme = useTheme();
  const [studyHoursAdjustment, setStudyHoursAdjustment] = useState(0);
  const [practiceTestCount, setPracticeTestCount] = useState(0);
  const [focusTopicIds, setFocusTopicIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfScenarioResponse | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await aiPredictionDashboardApi.simulateWhatIfScenario({
        board,
        grade_id: gradeId,
        subject_id: subjectId,
        study_hours_adjustment: studyHoursAdjustment,
        focus_topic_ids: focusTopicIds,
        practice_test_count: practiceTestCount,
      });
      setResult(response);
    } catch (error) {
      console.error('Failed to simulate scenario', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelection = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    setFocusTopicIds(typeof value === 'string' ? [] : value);
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          What-If Scenario Simulator
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Adjust parameters to see how they affect your predicted performance
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography gutterBottom>
              Study Hours Adjustment: {studyHoursAdjustment > 0 ? '+' : ''}
              {studyHoursAdjustment} hours/day
            </Typography>
            <Slider
              value={studyHoursAdjustment}
              onChange={(_, value) => setStudyHoursAdjustment(value as number)}
              min={-5}
              max={10}
              step={0.5}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>Practice Tests: {practiceTestCount}</Typography>
            <Slider
              value={practiceTestCount}
              onChange={(_, value) => setPracticeTestCount(value as number)}
              min={0}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Focus Topics (Optional)</InputLabel>
              <Select
                multiple
                value={focusTopicIds}
                onChange={handleTopicSelection}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const topic = topics.find((t) => t.topic_id === value);
                      return <Chip key={value} label={topic?.topic_name || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {topics
                  .filter((t) => t.topic_id !== undefined)
                  .slice(0, 20)
                  .map((topic) => (
                    <MenuItem key={topic.topic_id} value={topic.topic_id}>
                      {topic.topic_name} ({topic.probability_score.toFixed(0)}%)
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSimulate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <ScienceIcon />}
            >
              Simulate Scenario
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {result && (
        <>
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              p: 3,
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Predicted Score
                </Typography>
                <Typography variant="h3" fontWeight={700}>
                  {result.current_predicted_score.toFixed(1)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Projected Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    {result.projected_score.toFixed(1)}
                  </Typography>
                  {result.score_improvement > 0 ? (
                    <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Score Improvement
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={result.score_improvement > 0 ? 'success.main' : 'error.main'}
                >
                  {result.score_improvement > 0 ? '+' : ''}
                  {result.score_improvement.toFixed(1)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {result.prediction_changes.map((change, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    {change.metric}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Current
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {change.current_value.toFixed(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Projected
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {change.projected_value.toFixed(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Change
                    </Typography>
                    <Chip
                      label={`${change.change_percentage > 0 ? '+' : ''}${change.change_percentage.toFixed(1)}%`}
                      size="small"
                      color={change.change_percentage > 0 ? 'success' : 'default'}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {result.recommended_adjustments.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Recommendations
              </Typography>
              {result.recommended_adjustments.map((rec, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                  • {rec}
                </Typography>
              ))}
            </Alert>
          )}

          {result.risk_factors.length > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Risk Factors
              </Typography>
              {result.risk_factors.map((risk, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                  • {risk}
                </Typography>
              ))}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
