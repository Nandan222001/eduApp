import { Container, Typography, Box, Paper } from '@mui/material';

export default function About() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        About This Application
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Tech Stack
        </Typography>
        <Box component="ul" sx={{ mt: 2 }}>
          <li>
            <Typography variant="body1">
              <strong>React 18:</strong> Modern UI library with concurrent features
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>TypeScript:</strong> Type-safe development experience
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Vite:</strong> Next-generation frontend tooling
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>React Router v6:</strong> Declarative routing for React
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Material-UI v5:</strong> React component library implementing Material Design
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>React Query:</strong> Powerful asynchronous state management
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Zustand:</strong> Lightweight state management solution
            </Typography>
          </li>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Development Tools
        </Typography>
        <Box component="ul" sx={{ mt: 2 }}>
          <li>
            <Typography variant="body1">
              <strong>ESLint:</strong> Code quality and consistency
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Prettier:</strong> Automatic code formatting
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Husky:</strong> Git hooks for pre-commit checks
            </Typography>
          </li>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Features
        </Typography>
        <Box component="ul" sx={{ mt: 2 }}>
          <li>
            <Typography variant="body1">Environment-based API endpoint management</Typography>
          </li>
          <li>
            <Typography variant="body1">Configured ESLint and Prettier</Typography>
          </li>
          <li>
            <Typography variant="body1">Pre-commit hooks with Husky</Typography>
          </li>
          <li>
            <Typography variant="body1">Custom theme with Material-UI</Typography>
          </li>
          <li>
            <Typography variant="body1">React Query for data fetching</Typography>
          </li>
          <li>
            <Typography variant="body1">Zustand for global state management</Typography>
          </li>
          <li>
            <Typography variant="body1">Path aliases configured (@/*)</Typography>
          </li>
        </Box>
      </Paper>
    </Container>
  );
}
