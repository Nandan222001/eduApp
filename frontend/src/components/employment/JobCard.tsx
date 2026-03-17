import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import { StudentJobListing } from '@/types/employment';

interface JobCardProps {
  job: StudentJobListing;
  onViewDetails: (job: StudentJobListing) => void;
  onBookmarkToggle?: (jobId: number) => void;
  isBookmarked?: boolean;
}

export default function JobCard({ job, onViewDetails, onBookmarkToggle, isBookmarked }: JobCardProps) {
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'part_time':
        return 'primary';
      case 'seasonal':
        return 'secondary';
      case 'internship':
        return 'success';
      case 'volunteer':
        return 'info';
      default:
        return 'default';
    }
  };

  const getJobTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => onViewDetails(job)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Chip
            label={getJobTypeLabel(job.job_type)}
            color={getJobTypeColor(job.job_type) as any}
            size="small"
          />
          {onBookmarkToggle && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkToggle(job.id);
              }}
            >
              {isBookmarked ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <BusinessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {job.employer_name}
          </Typography>
          {job.employer_verified && (
            <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
          )}
        </Box>

        <Typography variant="h6" fontWeight={600} gutterBottom>
          {job.job_title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2,
          }}
        >
          {job.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {job.hourly_pay && (
            <Chip
              icon={<MoneyIcon />}
              label={`$${job.hourly_pay}/hr`}
              size="small"
              variant="outlined"
            />
          )}
          {job.hours_per_week && (
            <Chip
              icon={<ScheduleIcon />}
              label={`${job.hours_per_week}hrs/week`}
              size="small"
              variant="outlined"
            />
          )}
          {job.location && (
            <Chip
              icon={<LocationIcon />}
              label={job.location}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(job);
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
