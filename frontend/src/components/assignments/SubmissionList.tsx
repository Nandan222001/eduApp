import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  LinearProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GradeIcon from '@mui/icons-material/Grade';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { Submission, SubmissionStatus } from '../../types/assignment';

interface SubmissionListProps {
  submissions: Submission[];
  loading?: boolean;
  onReview: (submission: Submission) => void;
  onDownloadAll: () => void;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
  submissions,
  loading = false,
  onReview,
  onDownloadAll,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.NOT_SUBMITTED:
        return 'default';
      case SubmissionStatus.SUBMITTED:
        return 'info';
      case SubmissionStatus.LATE_SUBMITTED:
        return 'warning';
      case SubmissionStatus.GRADED:
        return 'success';
      case SubmissionStatus.RETURNED:
        return 'primary';
      default:
        return 'default';
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      submission.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.student_roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const paginatedSubmissions = filteredSubmissions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(
      (s) =>
        s.status === SubmissionStatus.SUBMITTED ||
        s.status === SubmissionStatus.LATE_SUBMITTED ||
        s.status === SubmissionStatus.GRADED
    ).length,
    graded: submissions.filter((s) => s.status === SubmissionStatus.GRADED).length,
    pending: submissions.filter(
      (s) => s.status === SubmissionStatus.SUBMITTED || s.status === SubmissionStatus.LATE_SUBMITTED
    ).length,
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search by student name or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.disabled' }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={SubmissionStatus.NOT_SUBMITTED}>Not Submitted</MenuItem>
            <MenuItem value={SubmissionStatus.SUBMITTED}>Submitted</MenuItem>
            <MenuItem value={SubmissionStatus.LATE_SUBMITTED}>Late Submitted</MenuItem>
            <MenuItem value={SubmissionStatus.GRADED}>Graded</MenuItem>
            <MenuItem value={SubmissionStatus.RETURNED}>Returned</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onDownloadAll}>
          Download All
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Chip label={`Total: ${stats.total}`} />
        <Chip label={`Submitted: ${stats.submitted}`} color="info" />
        <Chip label={`Graded: ${stats.graded}`} color="success" />
        <Chip label={`Pending: ${stats.pending}`} color="warning" />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Submitted At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Marks</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubmissions.map((submission) => (
                <TableRow key={submission.id} hover>
                  <TableCell>{submission.student_name || 'Unknown'}</TableCell>
                  <TableCell>{submission.student_roll_number || '-'}</TableCell>
                  <TableCell>
                    {submission.submitted_at
                      ? format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={submission.status.replace('_', ' ')}
                      color={getStatusColor(submission.status)}
                      size="small"
                    />
                    {submission.is_late && (
                      <Chip label="Late" color="warning" size="small" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {submission.marks_obtained !== null && submission.marks_obtained !== undefined
                      ? submission.marks_obtained
                      : '-'}
                  </TableCell>
                  <TableCell>{submission.grade || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => onReview(submission)}
                      title="Review & Grade"
                    >
                      {submission.status === SubmissionStatus.GRADED ? (
                        <VisibilityIcon />
                      ) : (
                        <GradeIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredSubmissions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};
