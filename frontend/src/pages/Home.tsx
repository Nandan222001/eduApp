import { Container, Typography, Box, Card, CardContent, Grid, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { env } from '@/config/env';

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to {env.appName}
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          A modern React application built with TypeScript, Vite, and Material-UI
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/about"
            sx={{ mr: 2 }}
          >
            Learn More
          </Button>
          <Button variant="outlined" size="large">
            Get Started
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                React 18
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Built with the latest version of React for optimal performance and developer
                experience.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                TypeScript
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type-safe development with full TypeScript support for better code quality and
                maintainability.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Material-UI
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Beautiful, responsive UI components following Material Design guidelines.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                React Query
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Powerful data fetching and state management for seamless API integration.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Zustand
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lightweight and flexible state management solution for global application state.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Vite
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lightning-fast build tool with instant hot module replacement for development.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
