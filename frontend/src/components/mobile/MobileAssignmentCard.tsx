import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { format } from 'date-fns';

interface Assignment {
  id: number;
  title: string;
  description?: string;
  total_marks: number;
  due_date?: string;
  status: string;
  submission_count?: number;
  total_students?: number;
}

interface MobileAssignmentCardProps {
  assignment: Assignment;
  onView?: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onDownload?: (assignment: Assignment) => void;
}

export default function MobileAssignmentCard({
  assignment,
  onView,
  onEdit,
  onDelete,
  onDownload,
}: MobileAssignmentCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'draft':
        return 'default';
      case 'closed':
        return 'error';
      case 'graded':
        return 'info';
      default:
        return 'default';
    }
  };

  const submissionPercentage =
    assignment.submission_count && assignment.total_students
      ? (assignment.submission_count / assignment.total_students) * 100
      : 0;

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        touchAction: 'manipulation',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              flexShrink: 0,
            }}
          >
            <AssignmentIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
              {assignment.title}
            </Typography>
            {assignment.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {assignment.description}
              </Typography>
            )}
          </Box>

          <IconButton onClick={handleMenuOpen} sx={{ minWidth: 44, minHeight: 44, ml: 1 }}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={assignment.status} size="small" color={getStatusColor(assignment.status)} />
          <Chip label={`${assignment.total_marks} marks`} size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {assignment.due_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          )}

          {assignment.submission_count !== undefined && assignment.total_students !== undefined && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Submissions: {assignment.submission_count} / {assignment.total_students}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={submissionPercentage}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {onView && (
          <MenuItem onClick={() => handleAction(() => onView(assignment))}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => handleAction(() => onEdit(assignment))}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {onDownload && (
          <MenuItem onClick={() => handleAction(() => onDownload(assignment))}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download Submissions</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem
            onClick={() => handleAction(() => onDelete(assignment))}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}
