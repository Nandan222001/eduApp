import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Button,
} from '@mui/material';
import {
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  Whatshot as BossIcon,
} from '@mui/icons-material';
import { SubjectRegion } from '../../types/rpg';

interface WorldMapProps {
  regions: SubjectRegion[];
  onRegionClick: (regionId: string) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ regions, onRegionClick }) => {
  const getStatusIcon = (status: SubjectRegion['status']) => {
    switch (status) {
      case 'locked':
        return <LockIcon />;
      case 'in-progress':
        return <PlayIcon />;
      case 'complete':
        return <CheckIcon />;
    }
  };

  const getStatusColor = (status: SubjectRegion['status']) => {
    switch (status) {
      case 'locked':
        return 'default';
      case 'in-progress':
        return 'warning';
      case 'complete':
        return 'success';
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          World Map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Explore subject regions and defeat bosses to progress
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {regions.map((region) => (
          <Grid item xs={12} sm={6} md={4} key={region.id}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: region.status !== 'locked' ? 'pointer' : 'default',
                opacity: region.status === 'locked' ? 0.6 : 1,
                '&:hover': {
                  transform: region.status !== 'locked' ? 'translateY(-4px)' : 'none',
                  boxShadow: region.status !== 'locked' ? 4 : 1,
                },
                borderTop: `4px solid ${region.color}`,
              }}
              onClick={() => region.status !== 'locked' && onRegionClick(region.id)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {region.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {region.subject}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(region.status)}
                    label={region.status}
                    color={getStatusColor(region.status)}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {region.completionPercentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={region.completionPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: region.color,
                      },
                    }}
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Chapters: {region.completedChapters} / {region.chapterCount}
                  </Typography>
                  {region.bossDefeated ? (
                    <Chip
                      icon={<CheckIcon />}
                      label="Boss Defeated"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  ) : region.status !== 'locked' ? (
                    <Chip
                      icon={<BossIcon />}
                      label="Boss Available"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  ) : null}
                </Box>

                {region.status === 'locked' && (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={1}
                    p={2}
                    bgcolor="action.hover"
                    borderRadius={1}
                  >
                    <LockIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Complete previous regions to unlock
                    </Typography>
                  </Box>
                )}

                {region.status !== 'locked' && (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={region.status === 'in-progress' ? <PlayIcon /> : <CheckIcon />}
                    sx={{
                      bgcolor: region.color,
                      '&:hover': {
                        bgcolor: region.color,
                        filter: 'brightness(0.9)',
                      },
                    }}
                  >
                    {region.status === 'in-progress' ? 'Continue' : 'Review'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
