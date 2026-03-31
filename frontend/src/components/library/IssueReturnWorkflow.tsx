import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Tab,
  Tabs,
  Alert,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Replay as ReturnIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '../../api/library';
import { BookIssue, BookIssueWithDetails } from '../../types/library';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const IssueReturnWorkflow: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<BookIssueWithDetails | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: issuesData } = useQuery({
    queryKey: ['bookIssues', activeTab === 0 ? 'active' : 'returned'],
    queryFn: () => libraryApi.listIssues({ status: activeTab === 0 ? 'issued' : 'returned' }),
  });

  const { data: settingsData } = useQuery({
    queryKey: ['librarySettings'],
    queryFn: () => libraryApi.getSettings(),
  });

  const issueMutation = useMutation({
    mutationFn: libraryApi.issueBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookIssues'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setIssueDialogOpen(false);
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BookIssue> }) =>
      libraryApi.returnBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookIssues'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setReturnDialogOpen(false);
      setSelectedIssue(undefined);
    },
  });

  const renewMutation = useMutation({
    mutationFn: libraryApi.renewBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookIssues'] });
    },
  });

  const handleIssueSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      institution_id: 1,
      book_id: parseInt(formData.get('book_id') as string),
      student_id: parseInt(formData.get('student_id') as string),
      issue_date: (formData.get('issue_date') as string) || undefined,
      due_date: (formData.get('due_date') as string) || undefined,
      remarks: (formData.get('remarks') as string) || undefined,
    };
    issueMutation.mutate(data);
  };

  const handleReturn = (issue: BookIssueWithDetails) => {
    setSelectedIssue(issue);
    setReturnDialogOpen(true);
  };

  const handleReturnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedIssue) return;
    const formData = new FormData(event.currentTarget);
    const data = {
      return_date: (formData.get('return_date') as string) || undefined,
      fine_paid: formData.get('fine_paid') === 'on',
      remarks: (formData.get('remarks') as string) || undefined,
    };
    returnMutation.mutate({ id: selectedIssue.id, data });
  };

  const handleRenew = (issueId: number) => {
    if (confirm('Are you sure you want to renew this book issue?')) {
      renewMutation.mutate(issueId);
    }
  };

  const calculateFine = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    if (today <= due) return 0;
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const finePerDay = settingsData?.fine_per_day || 5;
    return daysOverdue * finePerDay;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)}>
          <Tab label="Active Issues" />
          <Tab label="Return History" />
        </Tabs>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIssueDialogOpen(true)}
        >
          Issue Book
        </Button>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Book Title</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fine</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issuesData?.items?.map((issue: BookIssueWithDetails) => {
                const fine = calculateFine(issue.due_date);
                const isOverdue = fine > 0;
                return (
                  <TableRow key={issue.id}>
                    <TableCell>{issue.book_title}</TableCell>
                    <TableCell>
                      <div>{issue.student_name}</div>
                      <Typography variant="caption" color="text.secondary">
                        {issue.student_roll_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(issue.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(issue.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={isOverdue ? 'Overdue' : 'Active'}
                        color={isOverdue ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {fine > 0 && (
                        <Typography color="error" fontWeight="bold">
                          ₹{fine}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<ReturnIcon />}
                        onClick={() => handleReturn(issue)}
                        sx={{ mr: 1 }}
                      >
                        Return
                      </Button>
                      {settingsData?.allow_renewals && (
                        <Button size="small" onClick={() => handleRenew(issue.id)}>
                          Renew
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Book Title</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Return Date</TableCell>
                <TableCell>Fine</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issuesData?.items?.map((issue: BookIssueWithDetails) => (
                <TableRow key={issue.id}>
                  <TableCell>{issue.book_title}</TableCell>
                  <TableCell>{issue.student_name}</TableCell>
                  <TableCell>{new Date(issue.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {issue.return_date ? new Date(issue.return_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>₹{issue.fine_amount || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={issue.fine_paid ? 'Fine Paid' : 'Fine Pending'}
                      color={issue.fine_paid ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <Dialog
        open={issueDialogOpen}
        onClose={() => setIssueDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleIssueSubmit}>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogContent>
            {settingsData && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Issue duration: {settingsData.issue_duration_days} days | Fine per day: ₹
                {settingsData.fine_per_day}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="Book ID" name="book_id" type="number" required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Student ID" name="student_id" type="number" required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Issue Date"
                  name="issue_date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  name="due_date"
                  type="date"
                  defaultValue={
                    new Date(
                      Date.now() + (settingsData?.issue_duration_days || 14) * 24 * 60 * 60 * 1000
                    )
                      .toISOString()
                      .split('T')[0]
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Remarks" name="remarks" multiline rows={2} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Issue Book
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleReturnSubmit}>
          <DialogTitle>Return Book</DialogTitle>
          <DialogContent>
            {selectedIssue && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Book: {selectedIssue.book_title}
                  <br />
                  Student: {selectedIssue.student_name}
                  <br />
                  Fine: ₹{calculateFine(selectedIssue.due_date)}
                </Alert>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Return Date"
                      name="return_date"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Remarks" name="remarks" multiline rows={2} />
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Return Book
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default IssueReturnWorkflow;
