import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Stack,
  Box,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  EmojiEvents as TrophyIcon,
  Groups as TeamIcon,
  Person as PersonIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { Competition } from '@/api/olympics';
import { format } from 'date-fns';

interface CompetitionCardProps {
  competition: Competition;
  onViewDetails: (id: number) => void;
}

export default function CompetitionCard({ competition, onViewDetails }: CompetitionCardProps) {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (competition.status) {
      case 'active':
        return theme.palette.success.main;
      case 'upcoming':
        return theme.palette.info.main;
      case 'past':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusLabel = () => {
    switch (competition.status) {
      case 'active':
        return 'Live Now';
      case 'upcoming':
        return 'Coming Soon';
      case 'past':
        return 'Completed';
      default:
        return competition.status;
    }
  };

  const getTypeIcon = () => {
    switch (competition.competition_type) {
      case 'team':
        return <TeamIcon />;
      case 'individual':
        return <PersonIcon />;
      default:
        return <TrophyIcon />;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardMedia
        component="div"
        sx={{
          height: 180,
          background: competition.banner_url
            ? `url(${competition.banner_url}) center/cover`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
          }}
        >
          <Chip
            label={getStatusLabel()}
            size="small"
            sx={{
              bgcolor: alpha(getStatusColor(), 0.9),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {competition.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {competition.description}
        </Typography>

        <Stack spacing={1} mb={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {format(new Date(competition.start_date), 'MMM dd, yyyy')} -{' '}
              {format(new Date(competition.end_date), 'MMM dd, yyyy')}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            {getTypeIcon()}
            <Typography variant="caption" color="text.secondary">
              {competition.competition_type === 'team' && competition.team_size
                ? `Team (${competition.team_size} members)`
                : competition.competition_type.charAt(0).toUpperCase() +
                  competition.competition_type.slice(1)}
            </Typography>
          </Stack>

          {competition.prize_pool && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrophyIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
              <Typography variant="caption" fontWeight="bold" color="warning.main">
                {competition.prize_pool}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            endIcon={<ArrowIcon />}
            onClick={() => onViewDetails(competition.id)}
            disabled={competition.status === 'past'}
          >
            {competition.status === 'active'
              ? 'Join Now'
              : competition.status === 'upcoming'
                ? 'View Details'
                : 'View Results'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
