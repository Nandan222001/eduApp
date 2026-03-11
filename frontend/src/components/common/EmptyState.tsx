import { Box, Typography, Button, Paper } from '@mui/material';
import { ReactNode } from 'react';
import InboxIcon from '@mui/icons-material/Inbox';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  iconType?:
    | 'inbox'
    | 'search'
    | 'folder'
    | 'assignment'
    | 'people'
    | 'event'
    | 'school'
    | 'custom';
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'standard' | 'minimal' | 'card';
}

const iconMap = {
  inbox: InboxIcon,
  search: SearchOffIcon,
  folder: FolderOpenIcon,
  assignment: AssignmentIcon,
  people: PeopleIcon,
  event: EventIcon,
  school: SchoolIcon,
};

export const EmptyState = ({
  title = 'No Data Available',
  message = 'There is nothing to display at the moment.',
  icon,
  iconType = 'inbox',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'standard',
}: EmptyStateProps) => {
  const IconComponent = iconType !== 'custom' ? iconMap[iconType] : null;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: variant === 'minimal' ? 3 : 6,
        px: 2,
        textAlign: 'center',
      }}
    >
      {icon ? (
        <Box sx={{ color: 'text.disabled', fontSize: 80 }}>{icon}</Box>
      ) : IconComponent ? (
        <IconComponent
          sx={{
            fontSize: variant === 'minimal' ? 60 : 80,
            color: 'text.disabled',
          }}
        />
      ) : null}

      <Box>
        <Typography
          variant={variant === 'minimal' ? 'subtitle1' : 'h6'}
          color="text.secondary"
          gutterBottom
          fontWeight={500}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>

      {(actionLabel || secondaryActionLabel) && (
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          {actionLabel && onAction && (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outlined" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  if (variant === 'card') {
    return (
      <Paper sx={{ borderRadius: 2 }} elevation={0}>
        {content}
      </Paper>
    );
  }

  return content;
};

export default EmptyState;
