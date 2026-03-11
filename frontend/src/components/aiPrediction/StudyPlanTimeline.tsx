import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import aiPredictionDashboardApi, {
  StudyPlanResponse,
  TopicProbabilityRanking,
} from '@/api/aiPredictionDashboard';

interface StudyPlanTimelineProps {
  board: string;
  gradeId: number;
  subjectId: number;
  topicRankings: TopicProbabilityRanking[];
}

export default function StudyPlanTimeline({
  board,
  gradeId,
  subjectId,
  topicRankings,
}: StudyPlanTimelineProps) {
  const theme = useTheme();
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!examDate) return;

    setLoading(true);
    try {
      const plan = await aiPredictionDashboardApi.generateStudyPlan({
        board,
        grade_id: gradeId,
        subject_id: subjectId,
        exam_date: examDate.toISOString().split('T')[0],
        available_hours_per_day: hoursPerDay,
        weak_areas: topicRankings
          .filter((t) => t.priority_tag === 'MUST STUDY')
          .map((t) => t.topic_id)
          .filter((id): id is number => id !== undefined),
      });
      setStudyPlan(plan);
    } catch (error) {
      console.error('Failed to generate study plan', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  const getTaskColor = (taskType: string) => {
    switch (taskType) {
      case 'study':
        return theme.palette.primary.main;
      case 'practice':
        return theme.palette.info.main;
      case 'revision':
        return theme.palette.warning.main;
      case 'test':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Generate Personalized Study Plan
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Exam Date"
                value={examDate}
                onChange={(newValue) => setExamDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Study Hours Per Day"
              type="number"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              fullWidth
              inputProps={{ min: 0.5, max: 12, step: 0.5 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGenerate}
              disabled={!examDate || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CalendarIcon />}
            >
              Generate Plan
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {studyPlan && (
        <>
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Days Until Exam
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {studyPlan.days_until_exam}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Study Hours
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {studyPlan.total_study_hours}h
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Completion
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {(
                    (completedTasks.size /
                      studyPlan.weeks.reduce((acc, w) => acc + w.tasks.length, 0)) *
                    100
                  ).toFixed(0)}
                  %
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Weeks
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {studyPlan.weeks.length}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {studyPlan.weeks.map((week) => (
            <Accordion
              key={week.week_number}
              elevation={0}
              sx={{ border: `1px solid ${theme.palette.divider}`, mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    Week {week.week_number}: {new Date(week.start_date).toLocaleDateString()} -{' '}
                    {new Date(week.end_date).toLocaleDateString()}
                  </Typography>
                  <Chip label={`${week.total_hours}h`} size="small" color="primary" />
                  <Chip
                    label={`${week.tasks.filter((t) => completedTasks.has(t.task_id)).length}/${week.tasks.length} tasks`}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Focus Topics
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {week.focus_topics.map((topic, idx) => (
                    <Chip key={idx} label={topic} size="small" variant="outlined" />
                  ))}
                </Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Daily Tasks
                </Typography>
                <List>
                  {week.tasks.map((task) => (
                    <ListItem
                      key={task.task_id}
                      sx={{
                        borderLeft: `4px solid ${getTaskColor(task.task_type)}`,
                        mb: 1,
                        bgcolor: completedTasks.has(task.task_id)
                          ? alpha(theme.palette.success.main, 0.05)
                          : alpha(theme.palette.grey[500], 0.02),
                        borderRadius: 1,
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={completedTasks.has(task.task_id)}
                          onChange={() => toggleTask(task.task_id)}
                          icon={<RadioButtonUncheckedIcon />}
                          checkedIcon={<CheckCircleIcon />}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {new Date(task.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                            <Chip
                              label={task.task_type}
                              size="small"
                              sx={{
                                bgcolor: alpha(getTaskColor(task.task_type), 0.1),
                                color: getTaskColor(task.task_type),
                                fontSize: '0.7rem',
                              }}
                            />
                            <Typography variant="body2">{task.description}</Typography>
                          </Box>
                        }
                        secondary={`${task.duration_hours}h • Priority: ${task.priority}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      )}
    </Box>
  );
}
