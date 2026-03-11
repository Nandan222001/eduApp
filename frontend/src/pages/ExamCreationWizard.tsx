import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import examinationsApi from '@/api/examinations';
import {
  ExamType,
  ExamCreateInput,
  ExamSubjectCreateInput,
  ExamScheduleCreateInput,
} from '@/types/examination';

const steps = ['Exam Details', 'Add Subjects', 'Schedule', 'Upload Papers'];

export default function ExamCreationWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdExamId, setCreatedExamId] = useState<number | null>(null);

  const [examData, setExamData] = useState<ExamCreateInput>({
    institution_id: 1,
    academic_year_id: 1,
    grade_id: 1,
    name: '',
    exam_type: ExamType.UNIT,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    description: '',
    total_marks: 0,
    passing_marks: 0,
  });

  const [subjects, setSubjects] = useState<ExamSubjectCreateInput[]>([]);
  const [schedules, setSchedules] = useState<ExamScheduleCreateInput[]>([]);
  const [questionPapers, setQuestionPapers] = useState<{ [key: number]: File }>({});

  const handleNext = async () => {
    if (activeStep === 0) {
      try {
        setLoading(true);
        setError(null);
        const exam = await examinationsApi.createExam(examData);
        setCreatedExamId(exam.id);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (err) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to create exam');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1 && createdExamId) {
      try {
        setLoading(true);
        setError(null);
        for (const subject of subjects) {
          await examinationsApi.addSubject(createdExamId, {
            ...subject,
            exam_id: createdExamId,
          });
        }
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (err) {
        setError(
          (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            'Failed to add subjects'
        );
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 2 && createdExamId) {
      try {
        setLoading(true);
        setError(null);
        for (const schedule of schedules) {
          await examinationsApi.createSchedule(createdExamId, {
            ...schedule,
            exam_id: createdExamId,
          });
        }
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (err) {
        setError(
          (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            'Failed to create schedules'
        );
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/examinations/list');
      }, 2000);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to complete exam creation'
      );
    } finally {
      setLoading(false);
    }
  };

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        institution_id: 1,
        exam_id: createdExamId || 0,
        subject_id: 0,
        theory_max_marks: 0,
        practical_max_marks: 0,
        theory_passing_marks: 0,
        practical_passing_marks: 0,
      },
    ]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: string | number) => {
    const updatedSubjects = [...subjects];
    (updatedSubjects[index] as Record<string, string | number>)[field] = value;
    setSubjects(updatedSubjects);
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        institution_id: 1,
        exam_id: createdExamId || 0,
        subject_id: 0,
        section_id: 1,
        exam_date: new Date().toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '12:00:00',
        room_number: '',
      },
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: string, value: string | number) => {
    const updatedSchedules = [...schedules];
    (updatedSchedules[index] as Record<string, string | number>)[field] = value;
    setSchedules(updatedSchedules);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exam Name"
                value={examData.name}
                onChange={(e) => setExamData({ ...examData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Exam Type"
                value={examData.exam_type}
                onChange={(e) =>
                  setExamData({ ...examData, exam_type: e.target.value as ExamType })
                }
              >
                <MenuItem value={ExamType.UNIT}>Unit Test</MenuItem>
                <MenuItem value={ExamType.MID_TERM}>Mid-term</MenuItem>
                <MenuItem value={ExamType.FINAL}>Final</MenuItem>
                <MenuItem value={ExamType.MOCK}>Mock</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Grade"
                value={examData.grade_id}
                onChange={(e) => setExamData({ ...examData, grade_id: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    Grade {grade}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={new Date(examData.start_date)}
                  onChange={(date) =>
                    setExamData({
                      ...examData,
                      start_date: date?.toISOString().split('T')[0] || '',
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={new Date(examData.end_date)}
                  onChange={(date) =>
                    setExamData({
                      ...examData,
                      end_date: date?.toISOString().split('T')[0] || '',
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Marks"
                value={examData.total_marks}
                onChange={(e) =>
                  setExamData({ ...examData, total_marks: parseInt(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Passing Marks"
                value={examData.passing_marks}
                onChange={(e) =>
                  setExamData({ ...examData, passing_marks: parseInt(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={examData.description}
                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Configure Subjects</Typography>
              <Button startIcon={<AddIcon />} variant="outlined" onClick={addSubject}>
                Add Subject
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Theory Max</TableCell>
                    <TableCell>Practical Max</TableCell>
                    <TableCell>Theory Pass</TableCell>
                    <TableCell>Practical Pass</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjects.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={subject.subject_id}
                          onChange={(e) =>
                            updateSubject(index, 'subject_id', parseInt(e.target.value))
                          }
                        >
                          <MenuItem value={1}>Mathematics</MenuItem>
                          <MenuItem value={2}>Science</MenuItem>
                          <MenuItem value={3}>English</MenuItem>
                          <MenuItem value={4}>Social Studies</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={subject.theory_max_marks}
                          onChange={(e) =>
                            updateSubject(index, 'theory_max_marks', parseInt(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={subject.practical_max_marks}
                          onChange={(e) =>
                            updateSubject(index, 'practical_max_marks', parseInt(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={subject.theory_passing_marks}
                          onChange={(e) =>
                            updateSubject(index, 'theory_passing_marks', parseInt(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={subject.practical_passing_marks}
                          onChange={(e) =>
                            updateSubject(
                              index,
                              'practical_passing_marks',
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton color="error" onClick={() => removeSubject(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Create Exam Schedule</Typography>
              <Button startIcon={<AddIcon />} variant="outlined" onClick={addSchedule}>
                Add Schedule
              </Button>
            </Box>
            <Grid container spacing={2}>
              {schedules.map((schedule, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Subject"
                            value={schedule.subject_id}
                            onChange={(e) =>
                              updateSchedule(index, 'subject_id', parseInt(e.target.value))
                            }
                          >
                            <MenuItem value={1}>Mathematics</MenuItem>
                            <MenuItem value={2}>Science</MenuItem>
                            <MenuItem value={3}>English</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Date"
                            value={schedule.exam_date}
                            onChange={(e) => updateSchedule(index, 'exam_date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="time"
                            label="Start Time"
                            value={schedule.start_time}
                            onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            type="time"
                            label="End Time"
                            value={schedule.end_time}
                            onChange={(e) => updateSchedule(index, 'end_time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Room"
                            value={schedule.room_number}
                            onChange={(e) => updateSchedule(index, 'room_number', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <IconButton color="error" onClick={() => removeSchedule(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Question Papers (Optional)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              You can upload question papers now or later from the exam details page.
            </Alert>
            <Grid container spacing={2}>
              {subjects.map((subject, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Subject {subject.subject_id}
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        fullWidth
                      >
                        Upload Question Paper
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setQuestionPapers({
                                ...questionPapers,
                                [subject.subject_id]: e.target.files[0],
                              });
                            }
                          }}
                        />
                      </Button>
                      {questionPapers[subject.subject_id] && (
                        <Chip
                          label={questionPapers[subject.subject_id].name}
                          onDelete={() => {
                            const newPapers = { ...questionPapers };
                            delete newPapers[subject.subject_id];
                            setQuestionPapers(newPapers);
                          }}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/examinations/list')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Create New Exam
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Follow the steps to create and schedule a new examination
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Exam created successfully! Redirecting...
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>{renderStepContent(activeStep)}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button variant="contained" onClick={handleFinish} disabled={loading}>
                  Finish
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext} disabled={loading}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
