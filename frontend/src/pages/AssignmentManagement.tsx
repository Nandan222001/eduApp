import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  AssignmentForm,
  AssignmentList,
  RubricBuilder,
  SubmissionReview,
  SubmissionList,
} from '../components/assignments';
import { Assignment, AssignmentCreateInput, RubricCriteria, Submission } from '../types/assignment';
import { assignmentApi, submissionApi } from '../api/assignments';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const AssignmentManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentApi.list();
      setAssignments(response.items);
    } catch (error) {
      showSnackbar('Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateAssignment = async (data: AssignmentCreateInput, files: File[]) => {
    try {
      setLoading(true);
      const assignment = await assignmentApi.create(data);

      for (const file of files) {
        await assignmentApi.uploadFile(assignment.id, file);
      }

      if (rubricCriteria.length > 0) {
        for (const criteria of rubricCriteria) {
          await assignmentApi.createRubricCriteria(assignment.id, criteria);
        }
      }

      showSnackbar('Assignment created successfully', 'success');
      setFormOpen(false);
      setRubricCriteria([]);
      loadAssignments();
    } catch (error) {
      showSnackbar('Failed to create assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (data: AssignmentCreateInput, files: File[]) => {
    if (!selectedAssignment) return;

    try {
      setLoading(true);
      await assignmentApi.update(selectedAssignment.id, data);

      for (const file of files) {
        await assignmentApi.uploadFile(selectedAssignment.id, file);
      }

      showSnackbar('Assignment updated successfully', 'success');
      setFormOpen(false);
      setSelectedAssignment(null);
      loadAssignments();
    } catch (error) {
      showSnackbar('Failed to update assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      setLoading(true);
      await assignmentApi.delete(assignment.id);
      showSnackbar('Assignment deleted successfully', 'success');
      loadAssignments();
    } catch (error) {
      showSnackbar('Failed to delete assignment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssignment = async (assignment: Assignment) => {
    try {
      setLoading(true);
      const fullAssignment = await assignmentApi.getWithRubric(assignment.id);
      setSelectedAssignment(fullAssignment);
      await loadSubmissions(assignment.id);
      setTabValue(1);
    } catch (error) {
      showSnackbar('Failed to load assignment details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId: number) => {
    try {
      const response = await assignmentApi.listSubmissions(assignmentId);
      setSubmissions(response.items);
    } catch (error) {
      showSnackbar('Failed to load submissions', 'error');
    }
  };

  const handleReviewSubmission = async (submission: Submission) => {
    try {
      setLoading(true);
      const fullSubmission = await submissionApi.get(submission.id);
      setSelectedSubmission(fullSubmission);
      setReviewOpen(true);
    } catch (error) {
      showSnackbar('Failed to load submission details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSubmissions = async (assignment: Assignment) => {
    try {
      setLoading(true);
      const blob = await assignmentApi.bulkDownloadSubmissions(assignment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assignment_${assignment.id}_submissions.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSnackbar('Submissions downloaded successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to download submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (
    marks: number,
    grade?: string,
    feedback?: string,
    rubricGrades?: { criteria_id: number; points_awarded: number; feedback?: string }[]
  ) => {
    if (!selectedSubmission) return;

    try {
      setLoading(true);
      await submissionApi.grade(selectedSubmission.id, {
        marks_obtained: marks,
        grade,
        feedback,
        rubric_grades: rubricGrades,
      });
      showSnackbar('Submission graded successfully', 'success');
      setReviewOpen(false);
      setSelectedSubmission(null);
      if (selectedAssignment) {
        await loadSubmissions(selectedAssignment.id);
      }
    } catch (error) {
      showSnackbar('Failed to grade submission', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateForm = () => {
    setSelectedAssignment(null);
    setRubricCriteria([]);
    setFormOpen(true);
  };

  const handleOpenEditForm = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setRubricCriteria(assignment.rubric_criteria || []);
    setFormOpen(true);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Assignment Management
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Assignments" />
            <Tab label="Assignment Details" disabled={!selectedAssignment} />
            <Tab label="Submissions" disabled={!selectedAssignment} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <AssignmentList
              assignments={assignments}
              loading={loading}
              onEdit={handleOpenEditForm}
              onDelete={handleDeleteAssignment}
              onView={handleViewAssignment}
              onCreate={handleOpenCreateForm}
              onDownloadSubmissions={handleDownloadSubmissions}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {selectedAssignment && (
              <Box>
                <Typography variant="h5" gutterBottom>
                  {selectedAssignment.title}
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  {selectedAssignment.description}
                </Typography>
                {selectedAssignment.content && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedAssignment.content}
                    </Typography>
                  </Paper>
                )}
                {selectedAssignment.rubric_criteria &&
                  selectedAssignment.rubric_criteria.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <RubricBuilder
                        criteria={selectedAssignment.rubric_criteria}
                        onChange={() => {}}
                        readOnly
                      />
                    </Box>
                  )}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <SubmissionList
              submissions={submissions}
              loading={loading}
              onReview={handleReviewSubmission}
              onDownloadAll={() =>
                selectedAssignment && handleDownloadSubmissions(selectedAssignment)
              }
            />
          </TabPanel>
        </Paper>

        <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedAssignment ? 'Edit Assignment' : 'Create New Assignment'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <AssignmentForm
                assignment={selectedAssignment || undefined}
                onSubmit={selectedAssignment ? handleUpdateAssignment : handleCreateAssignment}
                onCancel={() => setFormOpen(false)}
                loading={loading}
              />

              <Box sx={{ mt: 3 }}>
                <RubricBuilder criteria={rubricCriteria} onChange={setRubricCriteria} />
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Review Submission</DialogTitle>
          <DialogContent>
            {selectedSubmission && (
              <SubmissionReview
                submission={selectedSubmission}
                rubricCriteria={selectedAssignment?.rubric_criteria || []}
                onGrade={handleGradeSubmission}
                onCancel={() => setReviewOpen(false)}
                loading={loading}
              />
            )}
          </DialogContent>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};
