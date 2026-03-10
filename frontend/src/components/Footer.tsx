import { Box, Container, Typography, Link } from '@mui/material';
import { env } from '@/config/env';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[200],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'Copyright © '}
          <Link color="inherit" href="/">
            {env.appName}
          </Link>{' '}
          {new Date().getFullYear()}. Version {env.appVersion}
        </Typography>
      </Container>
    </Box>
  );
}
