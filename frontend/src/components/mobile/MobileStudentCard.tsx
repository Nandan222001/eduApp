import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useState } from 'react';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  admission_number?: string;
  roll_number?: string;
  photo_url?: string;
  status: string;
  gender?: string;
  section?: {
    id: number;
    name: string;
    grade?: {
      name: string;
    };
  };
}

interface MobileStudentCardProps {
  student: Student;
  onView?: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onViewIDCard?: (student: Student) => void;
}

export default function MobileStudentCard({
  student,
  onView,
  onEdit,
  onDelete,
  onViewIDCard,
}: MobileStudentCardProps) {
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
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'graduated':
        return 'info';
      case 'transferred':
        return 'warning';
      default:
        return 'default';
    }
  };

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
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Avatar
            src={student.photo_url}
            alt={`${student.first_name} ${student.last_name}`}
            sx={{
              width: 60,
              height: 60,
              mr: 2,
              border: `3px solid ${theme.palette.primary.main}`,
            }}
          >
            {student.first_name.charAt(0)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
              {student.first_name} {student.last_name}
            </Typography>
            {student.admission_number && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Admission: {student.admission_number}
              </Typography>
            )}
            {student.roll_number && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Roll No: {student.roll_number}
              </Typography>
            )}
          </Box>

          <IconButton
            onClick={handleMenuOpen}
            sx={{ minWidth: 44, minHeight: 44, alignSelf: 'flex-start' }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={student.status} size="small" color={getStatusColor(student.status)} />
          {student.gender && (
            <Chip
              label={student.gender}
              size="small"
              color={student.gender === 'male' ? 'primary' : 'secondary'}
            />
          )}
          {student.section && (
            <Chip
              label={`${student.section.grade?.name || ''} - ${student.section.name}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {student.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {student.email}
              </Typography>
            </Box>
          )}
          {student.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {student.phone}
              </Typography>
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
          <MenuItem onClick={() => handleAction(() => onView(student))}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Profile</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => handleAction(() => onEdit(student))}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {onViewIDCard && (
          <MenuItem onClick={() => handleAction(() => onViewIDCard(student))}>
            <ListItemIcon>
              <BadgeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View ID Card</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem
            onClick={() => handleAction(() => onDelete(student))}
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
