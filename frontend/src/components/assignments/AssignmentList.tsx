import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Button,
  LinearProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { Assignment, AssignmentStatus } from '../../types/assignment';

interface AssignmentListProps {
  assignments: Assignment[];
  loading?: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  onView: (assignment: Assignment) => void;
  onCreate: () => void;
  onDownloadSubmissions: (assignment: Assignment) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onCreate,
  onDownloadSubmissions,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assignment: Assignment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssignment(null);
  };

  const handleEdit = () => {
    if (selectedAssignment) {
      onEdit(selectedAssignment);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedAssignment) {
      onDelete(selectedAssignment);
    }
    handleMenuClose();
  };

  const handleView = () => {
    if (selectedAssignment) {
      onView(selectedAssignment);
    }
    handleMenuClose();
  };

  const handleDownload = () => {
    if (selectedAssignment) {
      onDownloadSubmissions(selectedAssignment);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.DRAFT:
        return 'default';
      case AssignmentStatus.PUBLISHED:
        return 'success';
      case AssignmentStatus.CLOSED:
        return 'warning';
      case AssignmentStatus.ARCHIVED:
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search assignments..."
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
            onChange={(e) => setStatusFilter(e.target.value as AssignmentStatus | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={AssignmentStatus.DRAFT}>Draft</MenuItem>
            <MenuItem value={AssignmentStatus.PUBLISHED}>Published</MenuItem>
            <MenuItem value={AssignmentStatus.CLOSED}>Closed</MenuItem>
            <MenuItem value={AssignmentStatus.ARCHIVED}>Archived</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
          New Assignment
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="textSecondary">
              No assignments found. Create your first assignment to get started.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} sx={{ mt: 2 }}>
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredAssignments.map((assignment) => (
            <Grid item xs={12} md={6} lg={4} key={assignment.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
                onClick={() => onView(assignment)}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={assignment.status}
                      color={getStatusColor(assignment.status)}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, assignment);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" gutterBottom noWrap>
                    {assignment.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {assignment.description || 'No description provided'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {assignment.due_date && (
                      <Typography variant="caption" color="textSecondary">
                        Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      Max Marks: {assignment.max_marks}
                    </Typography>
                    {assignment.attachment_files && assignment.attachment_files.length > 0 && (
                      <Typography variant="caption" color="primary">
                        {assignment.attachment_files.length} file(s) attached
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>View Details</MenuItem>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDownload}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Download Submissions
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};
