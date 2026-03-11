import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Chip,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { PendingAssignment } from '@/types/parent';

interface PendingAssignmentsListProps {
  assignments: PendingAssignment[];
}

export const PendingAssignmentsList: React.FC<PendingAssignmentsListProps> = ({ assignments }) => {
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    return a.days_remaining - b.days_remaining;
  });

  const getDaysRemainingText = (assignment: PendingAssignment) => {
    if (assignment.is_overdue) {
      return `Overdue by ${Math.abs(assignment.days_remaining)} days`;
    }
    if (assignment.days_remaining === 0) {
      return 'Due today';
    }
    if (assignment.days_remaining === 1) {
      return 'Due tomorrow';
    }
    return `${assignment.days_remaining} days left`;
  };

  const getDaysRemainingColor = (assignment: PendingAssignment) => {
    if (assignment.is_overdue) return 'error';
    if (assignment.days_remaining <= 1) return 'warning';
    if (assignment.days_remaining <= 3) return 'info';
    return 'success';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6">Pending Assignments</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} pending
        </Typography>

        {assignments.length === 0 ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            All assignments completed! 🎉
          </Alert>
        ) : (
          <List sx={{ mt: 2, maxHeight: 500, overflow: 'auto' }}>
            {sortedAssignments.map((assignment, index) => (
              <React.Fragment key={assignment.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 2,
                    backgroundColor: assignment.is_overdue ? 'error.light' : 'transparent',
                    opacity: assignment.is_overdue ? 0.1 : 1,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} width="100%" mb={1}>
                    {assignment.is_overdue && <WarningIcon color="error" fontSize="small" />}
                    <Typography variant="subtitle2" fontWeight="bold" flex={1}>
                      {assignment.title}
                    </Typography>
                    <Chip
                      label={getDaysRemainingText(assignment)}
                      color={getDaysRemainingColor(assignment)}
                      size="small"
                      icon={<ScheduleIcon />}
                    />
                  </Box>

                  <Box display="flex" gap={1} mb={1}>
                    <Chip label={assignment.subject_name} size="small" variant="outlined" />
                    <Chip label={`${assignment.max_marks} marks`} size="small" variant="outlined" />
                  </Box>

                  {assignment.description && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {assignment.description.substring(0, 100)}
                      {assignment.description.length > 100 && '...'}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Due: {format(parseISO(assignment.due_date), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
