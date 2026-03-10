import { Box, Typography } from '@mui/material';
import { Lock } from '@mui/icons-material';

interface MobileAuthHeaderProps {
  title: string;
  subtitle?: string;
}

export default function MobileAuthHeader({ title, subtitle }: MobileAuthHeaderProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          mb: 2,
        }}
      >
        <Lock sx={{ fontSize: 32, color: 'white' }} />
      </Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
