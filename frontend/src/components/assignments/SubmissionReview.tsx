import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  Card,
  CardContent,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { format } from 'date-fns';
import { Submission, RubricCriteria, SubmissionGrade } from '../../types/assignment';

interface SubmissionReviewProps {
  submission: Submission;
  rubricCriteria: RubricCriteria[];
  onGrade: (
    marks: number,
    grade?: string,
    feedback?: string,
    rubricGrades?: SubmissionGrade[]
  ) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({
  submission,
  rubricCriteria,
  onGrade,
  onCancel,
  loading = false,
}) => {
  const [marks, setMarks] = useState<number>(submission.marks_obtained || 0);
  const [grade, setGrade] = useState<string>(submission.grade || '');
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [rubricGrades, setRubricGrades] = useState<SubmissionGrade[]>(
    submission.rubric_grades || []
  );

  const handleRubricGradeChange = (
    criteriaId: number,
    points: number,
    criteriaFeedback?: string
  ) => {
    const existing = rubricGrades.find((g) => g.criteria_id === criteriaId);
    if (existing) {
      setRubricGrades(
        rubricGrades.map((g) =>
          g.criteria_id === criteriaId
            ? { ...g, points_awarded: points, feedback: criteriaFeedback }
            : g
        )
      );
    } else {
      setRubricGrades([
        ...rubricGrades,
        {
          criteria_id: criteriaId,
          points_awarded: points,
          feedback: criteriaFeedback,
        },
      ]);
    }
  };

  const calculateTotalFromRubric = () => {
    return rubricGrades.reduce((sum, grade) => sum + grade.points_awarded, 0);
  };

  const handleSubmit = () => {
    const finalMarks = rubricCriteria.length > 0 ? calculateTotalFromRubric() : marks;
    onGrade(finalMarks, grade, feedback, rubricGrades);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Submission Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Student
              </Typography>
              <Typography variant="body1">
                {submission.student_name || 'Unknown Student'}
              </Typography>
              {submission.student_roll_number && (
                <Typography variant="caption" color="textSecondary">
                  Roll: {submission.student_roll_number}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Submitted At
              </Typography>
              <Typography variant="body1">
                {submission.submitted_at
                  ? format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')
                  : 'Not submitted'}
              </Typography>
              {submission.is_late && (
                <Chip label="Late Submission" color="warning" size="small" sx={{ mt: 1 }} />
              )}
            </Box>

            {submission.submission_text && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Submission Text
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'action.hover' }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {submission.submission_text}
                  </Typography>
                </Paper>
              </Box>
            )}

            {submission.submission_files && submission.submission_files.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Attached Files
                </Typography>
                {submission.submission_files.map((file) => (
                  <Card key={file.id} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        '&:last-child': { pb: 1.5 },
                      }}
                    >
                      <AttachFileIcon sx={{ mr: 1, color: 'action.active' }} />
                      <Box sx={{ flex: 1 }}>
                        <Link
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          {file.file_name}
                        </Link>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: 'block' }}
                        >
                          {(file.file_size / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        href={file.file_url}
                        download
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Grading
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {rubricCriteria.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rubric-Based Grading
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Criteria</TableCell>
                        <TableCell align="right">Max Points</TableCell>
                        <TableCell align="right">Points Awarded</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rubricCriteria.map((criteria) => {
                        const existingGrade = rubricGrades.find(
                          (g) => g.criteria_id === criteria.id
                        );
                        return (
                          <TableRow key={criteria.id}>
                            <TableCell>
                              <Typography variant="body2">{criteria.name}</Typography>
                              {criteria.description && (
                                <Typography variant="caption" color="textSecondary">
                                  {criteria.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">{criteria.max_points}</TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={existingGrade?.points_awarded || 0}
                                onChange={(e) =>
                                  handleRubricGradeChange(criteria.id!, Number(e.target.value))
                                }
                                inputProps={{
                                  min: 0,
                                  max: criteria.max_points,
                                  step: 0.5,
                                }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="subtitle2">Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">{calculateTotalFromRubric()}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Marks Obtained"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Box>
            )}

            <Box sx={{ mb: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g., A, B+, Pass"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                multiline
                rows={6}
                placeholder="Provide feedback to the student..."
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                Submit Grade
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
