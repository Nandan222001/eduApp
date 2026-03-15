import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Radio,
  alpha,
  useTheme,
} from '@mui/material';
import { Videocam as VideocamIcon } from '@mui/icons-material';
import { CameraAngle } from '@/types/event';

interface CameraAngleSelectorProps {
  cameras: CameraAngle[];
  selectedCameraId: string;
  onChange: (cameraId: string) => void;
  compact?: boolean;
}

export const CameraAngleSelector: React.FC<CameraAngleSelectorProps> = ({
  cameras,
  selectedCameraId,
  onChange,
  compact = false,
}) => {
  const theme = useTheme();

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
        {cameras.map((camera) => (
          <Card
            key={camera.id}
            onClick={() => camera.is_active && onChange(camera.id)}
            sx={{
              minWidth: 120,
              cursor: camera.is_active ? 'pointer' : 'not-allowed',
              opacity: camera.is_active ? 1 : 0.5,
              border: 2,
              borderColor:
                selectedCameraId === camera.id ? theme.palette.primary.main : 'transparent',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: camera.is_active ? theme.palette.primary.light : 'transparent',
              },
            }}
          >
            {camera.thumbnail_url ? (
              <CardMedia
                component="img"
                height="80"
                image={camera.thumbnail_url}
                alt={camera.name}
              />
            ) : (
              <Box
                sx={{
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.200',
                }}
              >
                <VideocamIcon sx={{ fontSize: 40, color: 'grey.500' }} />
              </Box>
            )}
            <CardContent sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" fontWeight="bold">
                {camera.name}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {cameras.map((camera) => (
        <Grid item xs={12} sm={6} md={4} key={camera.id}>
          <Card
            onClick={() => camera.is_active && onChange(camera.id)}
            sx={{
              cursor: camera.is_active ? 'pointer' : 'not-allowed',
              opacity: camera.is_active ? 1 : 0.5,
              border: 2,
              borderColor:
                selectedCameraId === camera.id ? theme.palette.primary.main : 'transparent',
              transition: 'all 0.2s',
              position: 'relative',
              '&:hover': {
                borderColor: camera.is_active ? theme.palette.primary.light : 'transparent',
                transform: camera.is_active ? 'scale(1.02)' : 'none',
              },
            }}
          >
            <Radio
              checked={selectedCameraId === camera.id}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                zIndex: 1,
              }}
            />
            {camera.thumbnail_url ? (
              <CardMedia
                component="img"
                height="140"
                image={camera.thumbnail_url}
                alt={camera.name}
              />
            ) : (
              <Box
                sx={{
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.200',
                }}
              >
                <VideocamIcon sx={{ fontSize: 60, color: 'grey.500' }} />
              </Box>
            )}
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {camera.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {camera.is_active ? 'Available' : 'Not available'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CameraAngleSelector;
